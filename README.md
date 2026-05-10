# task-api

A lightweight, containerized REST API for managing tasks and notes.

## Tech Stack
- Node.js + TypeScript
- Fastify (Web Framework)
- PostgreSQL (Database)
- Drizzle ORM
- Docker & Docker Compose

## Getting Started

### Prerequisites
- Docker and Docker Compose

## Deployment

### Docker Compose
Start the services locally:
```bash
docker compose up --build
```

### Kubernetes
For instructions on deploying to a Kubernetes cluster, see [k8s-deploy.md](./k8s-deploy.md).

## API Endpoints

#### 1. Health Check
Verify the service is running.
```bash
curl http://localhost:3000/health
```

#### 2. Create a Task
Create a new note or task.
```bash
curl -X POST http://localhost:3000/tasks \
     -H "Content-Type: application/json" \
     -d '{"title": "Buy groceries", "content": "Milk, Eggs, Bread"}'
```

#### 3. List All Tasks
Retrieve all tasks from the database.
```bash
curl http://localhost:3000/tasks
```

#### 4. Get a Specific Task
Retrieve a task by its ID (replace `1` with the actual ID).
```bash
curl http://localhost:3000/tasks/1
```

#### 5. Update a Task
Mark a task as completed or change its content.
```bash
curl -X PATCH http://localhost:3000/tasks/1 \
     -H "Content-Type: application/json" \
     -d '{"completed": true}'
```

#### 6. Delete a Task
Remove a task from the database.
```bash
curl -X DELETE http://localhost:3000/tasks/1
```

## Environment Variables
The following environment variables are used:
- `DB_HOST`: Database host (e.g., `db` or `localhost`).
- `DB_PORT`: Database port (default: 5432).
- `DB_USER`: Database username.
- `DB_PASSWORD`: Database password.
- `DB_NAME`: Database name.
- `PORT`: Port for the API to listen on (default: 3000).

These are configured in `docker-compose.yml` for the containerized setup.
