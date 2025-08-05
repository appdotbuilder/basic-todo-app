
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoStatusInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTodoStatus = async (input: UpdateTodoStatusInput): Promise<Todo> => {
  try {
    // Update the todo's completed status
    const result = await db.update(todosTable)
      .set({
        completed: input.completed
      })
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Todo status update failed:', error);
    throw error;
  }
};
