
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoStatusInput } from '../schema';
import { updateTodoStatus } from '../handlers/update_todo_status';
import { eq } from 'drizzle-orm';

describe('updateTodoStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo status to completed', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const input: UpdateTodoStatusInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodoStatus(input);

    // Verify the result
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Test Todo');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update todo status to not completed', async () => {
    // Create a completed test todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        completed: true
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const input: UpdateTodoStatusInput = {
      id: todoId,
      completed: false
    };

    const result = await updateTodoStatus(input);

    // Verify the result
    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Completed Todo');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist status change in database', async () => {
    // Create a test todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Persistent Test Todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const input: UpdateTodoStatusInput = {
      id: todoId,
      completed: true
    };

    await updateTodoStatus(input);

    // Query the database to verify the change was persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].title).toEqual('Persistent Test Todo');
  });

  it('should throw error for non-existent todo', async () => {
    const input: UpdateTodoStatusInput = {
      id: 99999, // Non-existent ID
      completed: true
    };

    await expect(updateTodoStatus(input)).rejects.toThrow(/not found/i);
  });
});
