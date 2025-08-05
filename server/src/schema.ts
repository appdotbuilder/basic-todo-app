
import { z } from 'zod';

// Todo schema
export const todoSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
  created_at: z.coerce.date()
});

export type Todo = z.infer<typeof todoSchema>;

// Input schema for creating todos
export const createTodoInputSchema = z.object({
  title: z.string().min(1, "Title cannot be empty")
});

export type CreateTodoInput = z.infer<typeof createTodoInputSchema>;

// Input schema for updating todo status
export const updateTodoStatusInputSchema = z.object({
  id: z.number(),
  completed: z.boolean()
});

export type UpdateTodoStatusInput = z.infer<typeof updateTodoStatusInputSchema>;

// Input schema for deleting todo
export const deleteTodoInputSchema = z.object({
  id: z.number()
});

export type DeleteTodoInput = z.infer<typeof deleteTodoInputSchema>;
