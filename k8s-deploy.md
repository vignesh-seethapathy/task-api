# Kubernetes Deployment Guide

This document provides instructions and manifests for deploying the Task API and its PostgreSQL database to a Kubernetes cluster.

## Deployment Overview

- **Namespace**: `task-app`
- **Database**: PostgreSQL with persistent storage.
- **API**: Node.js application exposed as an internal `ClusterIP` service.

## Prerequisites

1. A running Kubernetes cluster (Minikube, Kind, GKE, etc.).
2. `kubectl` configured to communicate with your cluster.
3. The API Docker image built and pushed to a registry accessible by your cluster.

### Building and Pushing the Image

Replace `your-registry` with your actual container registry (e.g., Docker Hub username or GCR path).

```bash
docker build -t your-registry/task-api:latest .
docker push your-registry/task-api:latest
```

## Kubernetes Manifests

The following manifest includes all necessary resources. Save this as `k8s-manifests.yaml` or apply it directly using the instructions below.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: task-app
---
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: task-app
type: Opaque
stringData:
  postgres-user: user
  postgres-password: password
  postgres-db: tasks_db
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
  namespace: task-app
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: task-app
spec:
  serviceName: "postgres-headless"
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: postgres-user
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: postgres-password
            - name: POSTGRES_DB
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: postgres-db
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          healthCheck:
            exec:
              command: ["pg_isready", "-U", "user", "-d", "tasks_db"]
            initialDelaySeconds: 5
            periodSeconds: 10
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: task-app
spec:
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-api
  namespace: task-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: task-api
  template:
    metadata:
      labels:
        app: task-api
    spec:
      containers:
        - name: task-api
          image: your-registry/task-api:latest # Update with your image
          ports:
            - containerPort: 3000
          env:
            - name: DB_HOST
              value: "postgres"
            - name: DB_PORT
              value: "5432"
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: postgres-user
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: postgres-password
            - name: DB_NAME
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: postgres-db
            - name: PORT
              value: "3000"
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "250m"
              memory: "256Mi"
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: task-api
  namespace: task-app
spec:
  type: ClusterIP
  selector:
    app: task-api
  ports:
    - port: 80
      targetPort: 3000
```

## Deployment Steps

1. **Apply the manifests**:
   ```bash
   kubectl apply -f k8s-manifests.yaml
   ```

2. **Verify the pods are running**:
   ```bash
   kubectl get pods -n task-app
   ```

3. **Run Database Migrations**:
   The API requires the database schema to be initialized. Run the migration command inside the API pod:
   ```bash
   # Get the API pod name
   POD_NAME=$(kubectl get pods -n task-app -l app=task-api -o jsonpath='{.items[0].metadata.name}')
   
   # Run the migration script
   kubectl exec -n task-app $POD_NAME -- npm run migrate
   ```

## Internal Access

The API is exposed via a `ClusterIP` service named `task-api` on port `80`. Other services within the cluster (like a UI app) can reach it at:
`http://task-api.task-app.svc.cluster.local` or simply `http://task-api.task-app` if they are in the same namespace.
