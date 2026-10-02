import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const scenarios = sqliteTable('scenarios', { id: text('id').primaryKey(), ownerId: text('owner_id').notNull(), name: text('name').notNull(), inputs: text('inputs').notNull(), createdAt: integer('created_at').notNull() });
