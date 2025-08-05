
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        { title: 'First todo', completed: false },
        { title: 'Second todo', completed: true },
        { title: 'Third todo', completed: false }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify all todos are returned
    const titles = result.map(todo => todo.title);
    expect(titles).toContain('First todo');
    expect(titles).toContain('Second todo');
    expect(titles).toContain('Third todo');
  });

  it('should return todos with correct structure', async () => {
    // Create a test todo
    await db.insert(todosTable)
      .values({ title: 'Test todo', completed: true })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    
    const todo = result[0];
    expect(todo.id).toBeDefined();
    expect(typeof todo.id).toBe('number');
    expect(todo.title).toEqual('Test todo');
    expect(todo.completed).toBe(true);
    expect(todo.created_at).toBeInstanceOf(Date);
  });

  it('should return todos ordered by creation date (newest first)', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({ title: 'First todo', completed: false })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Second todo', completed: false })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({ title: 'Third todo', completed: false })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify order - newest first
    expect(result[0].title).toEqual('Third todo');
    expect(result[1].title).toEqual('Second todo');
    expect(result[2].title).toEqual('First todo');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });
});
