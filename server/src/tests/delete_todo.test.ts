
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input
const testDeleteInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    const created = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = created[0].id;

    // Delete the todo
    const result = await deleteTodo({ id: todoId });

    expect(result.success).toBe(true);

    // Verify todo is deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when deleting non-existent todo', async () => {
    // Try to delete a todo that doesn't exist
    const result = await deleteTodo({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple todos
    const created = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', completed: false },
        { title: 'Todo 2', completed: true },
        { title: 'Todo 3', completed: false }
      ])
      .returning()
      .execute();

    const todoToDelete = created[1].id;

    // Delete the middle todo
    const result = await deleteTodo({ id: todoToDelete });

    expect(result.success).toBe(true);

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.find(todo => todo.id === todoToDelete)).toBeUndefined();
    expect(remainingTodos.find(todo => todo.title === 'Todo 1')).toBeDefined();
    expect(remainingTodos.find(todo => todo.title === 'Todo 3')).toBeDefined();
  });
});
