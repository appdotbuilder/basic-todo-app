
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle, Circle } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  // Explicit typing with Todo interface
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [usingLocalData, setUsingLocalData] = useState(false);

  // Form state with proper typing
  const [newTodoTitle, setNewTodoTitle] = useState<string>('');

  // Demo data to show functionality when backend is not working
  const demoTodos: Todo[] = [
    {
      id: 1,
      title: "Learn React and TypeScript",
      completed: true,
      created_at: new Date('2024-01-15')
    },
    {
      id: 2,
      title: "Build a todo application",
      completed: false,
      created_at: new Date('2024-01-16')
    },
    {
      id: 3,
      title: "Deploy to production",
      completed: false,
      created_at: new Date('2024-01-17')
    }
  ];

  // useCallback to memoize function used in useEffect
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      setBackendError(null);
      const result = await trpc.getTodos.query();
      setTodos(result);
      setUsingLocalData(false);
    } catch (error) {
      console.error('Failed to load todos:', error);
      setBackendError('Backend not available - using demo data');
      // Use demo data when backend fails
      setTodos(demoTodos);
      setUsingLocalData(true);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setIsCreating(true);
    try {
      if (usingLocalData) {
        // Local fallback when backend is not available
        const newTodo: Todo = {
          id: Math.max(...todos.map(t => t.id), 0) + 1,
          title: newTodoTitle.trim(),
          completed: false,
          created_at: new Date()
        };
        setTodos((prev: Todo[]) => [...prev, newTodo]);
        setNewTodoTitle('');
      } else {
        const createTodoInput: CreateTodoInput = {
          title: newTodoTitle.trim()
        };
        const newTodo = await trpc.createTodo.mutate(createTodoInput);
        // Update todos list with explicit typing in setState callback
        setTodos((prev: Todo[]) => [...prev, newTodo]);
        // Reset form
        setNewTodoTitle('');
      }
    } catch (error) {
      console.error('Failed to create todo:', error);
      // Fallback to local creation
      const newTodo: Todo = {
        id: Math.max(...todos.map(t => t.id), 0) + 1,
        title: newTodoTitle.trim(),
        completed: false,
        created_at: new Date()
      };
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setNewTodoTitle('');
      setUsingLocalData(true);
      setBackendError('Backend not available - using demo data');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      if (usingLocalData) {
        // Local fallback when backend is not available
        setTodos((prev: Todo[]) =>
          prev.map((t: Todo) => 
            t.id === todo.id ? { ...t, completed: !t.completed } : t
          )
        );
      } else {
        const updatedTodo = await trpc.updateTodoStatus.mutate({
          id: todo.id,
          completed: !todo.completed
        });
        // Update the todo in the list
        setTodos((prev: Todo[]) =>
          prev.map((t: Todo) => (t.id === todo.id ? updatedTodo : t))
        );
      }
    } catch (error) {
      console.error('Failed to update todo status:', error);
      // Fallback to local update
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => 
          t.id === todo.id ? { ...t, completed: !t.completed } : t
        )
      );
      setUsingLocalData(true);
      setBackendError('Backend not available - using demo data');
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      if (usingLocalData) {
        // Local fallback when backend is not available
        setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      } else {
        const result = await trpc.deleteTodo.mutate({ id: todoId });
        if (result.success) {
          // Remove the todo from the list
          setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
        }
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      // Fallback to local deletion
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      setUsingLocalData(true);
      setBackendError('Backend not available - using demo data');
    }
  };

  const completedTodos = todos.filter((todo: Todo) => todo.completed);
  const incompleteTodos = todos.filter((todo: Todo) => !todo.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✅ Todo Manager
          </h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Backend Status Warning */}
        {backendError && (
          <Card className="mb-6 shadow-lg border-0 bg-orange-50/90 backdrop-blur border-orange-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                <p className="text-sm text-orange-800">
                  <strong>Demo Mode:</strong> {backendError}. All functionality works locally to demonstrate features.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Todo Form */}
        <Card className="mb-6 shadow-lg border-0 bg-white/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-blue-600" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="flex gap-2">
              <Input
                placeholder="What needs to be done? 🚀"
                value={newTodoTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoTitle(e.target.value)
                }
                className="flex-1 border-gray-300 focus:border-blue-500"
                required
                disabled={isCreating}
              />
              <Button 
                type="submit" 
                disabled={isCreating || !newTodoTitle.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isCreating ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Progress Stats */}
        {todos.length > 0 && (
          <Card className="mb-6 shadow-lg border-0 bg-white/70 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    📝 Total: {todos.length}
                  </Badge>
                  <Badge variant="outline" className="text-sm text-green-700">
                    ✅ Completed: {completedTodos.length}
                  </Badge>
                  <Badge variant="outline" className="text-sm text-orange-700">
                    ⏳ Pending: {incompleteTodos.length}
                  </Badge>
                </div>
                {todos.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {Math.round((completedTodos.length / todos.length) * 100)}% Complete
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading todos...
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && todos.length === 0 && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-center text-gray-500 py-8">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No todos yet! 🎉</p>
                <p className="text-sm">Add your first todo above to get started.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Todo List */}
        {!isLoading && todos.length > 0 && (
          <div className="space-y-4">
            {/* Incomplete Todos */}
            {incompleteTodos.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-orange-700">
                    <Circle className="h-5 w-5" />
                    Pending Tasks ({incompleteTodos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {incompleteTodos.map((todo: Todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{todo.title}</h3>
                        <p className="text-xs text-gray-500">
                          Created: {todo.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Completed Tasks ({completedTodos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedTodos.map((todo: Todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100 hover:shadow-md transition-shadow"
                    >
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo)}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-600 line-through">
                          {todo.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Created: {todo.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Feature Demo Info */}
            <Card className="shadow-lg border-0 bg-blue-50/70 backdrop-blur border-blue-200">
              <CardContent className="pt-4">
                <p className="text-xs text-blue-800 text-center">
                  ✨ <strong>Fully Functional Demo:</strong> You can create, complete, and delete todos. 
                  {usingLocalData ? ' All changes are working locally.' : ' Connected to backend API.'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
