import Fastify from 'fastify';
import { taskRoutes } from './routes/tasks.js';
import { runMigrations } from './db/migrate.js';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

fastify.register(taskRoutes);

fastify.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await runMigrations();
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
