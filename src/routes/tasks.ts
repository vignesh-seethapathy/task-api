import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { tasks } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const TaskSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  completed: z.boolean().optional(),
});

const UpdateTaskSchema = TaskSchema.partial();

export async function taskRoutes(fastify: FastifyInstance) {
  // Get all tasks
  fastify.get('/tasks', async () => {
    return await db.select().from(tasks).orderBy(tasks.id);
  });

  // Get task by id
  fastify.get('/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [task] = await db.select().from(tasks).where(eq(tasks.id, parseInt(id)));
    if (!task) return reply.status(404).send({ error: 'Task not found' });
    return task;
  });

  // Create task
  fastify.post('/tasks', async (request, reply) => {
    const result = TaskSchema.safeParse(request.body);
    if (!result.success) return reply.status(400).send(result.error);
    
    const [task] = await db.insert(tasks).values(result.data).returning();
    return reply.status(201).send(task);
  });

  // Update task
  fastify.patch('/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = UpdateTaskSchema.safeParse(request.body);
    if (!result.success) return reply.status(400).send(result.error);

    const [task] = await db
      .update(tasks)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(tasks.id, parseInt(id)))
      .returning();

    if (!task) return reply.status(404).send({ error: 'Task not found' });
    return task;
  });

  // Delete task
  fastify.delete('/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [task] = await db.delete(tasks).where(eq(tasks.id, parseInt(id))).returning();
    if (!task) return reply.status(404).send({ error: 'Task not found' });
    return reply.status(204).send();
  });
}
