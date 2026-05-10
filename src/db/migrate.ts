import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index.js';

export const runMigrations = async () => {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations completed!');
};
