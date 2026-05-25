import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  wordCount: integer('word_count'),
  readingTime: integer('reading_time'),
  summary: text('summary'),
  status: text('status', { enum: ['draft', 'processing', 'published', 'failed'] })
    .notNull()
    .default('draft'),
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
})

export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
