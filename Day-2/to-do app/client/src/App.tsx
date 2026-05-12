import { useState, useEffect } from 'react';
import type { Todo, CreateTodoInput } from './types';
import * as api from './api';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';
import './App.css';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await api.fetchTodos();
      setTodos(data);
    } catch (err) {
      setError('Failed to load tasks. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (todoInput: CreateTodoInput) => {
    try {
      const newTodo = await api.createTodo(todoInput);
      setTodos([newTodo, ...todos]);
    } catch (err) {
      alert('Failed to add task.');
    }
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    try {
      const updated = await api.updateTodo(id, { completed });
      setTodos(todos.map((t) => (t._id === id ? updated : t)));
    } catch (err) {
      alert('Failed to update task.');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTodo(id);
      setTodos(todos.filter((t) => t._id !== id));
    } catch (err) {
      alert('Failed to delete task.');
    }
  };

  return (
    <div className="container">
      <header className="app-header">
        <h1>Professional Tasks</h1>
        <p>Stay organized and productive.</p>
      </header>

      <TodoForm onSubmit={handleAddTodo} />

      {loading ? (
        <div className="status-msg">Loading tasks...</div>
      ) : error ? (
        <div className="status-msg error">{error}</div>
      ) : todos.length === 0 ? (
        <div className="status-msg">No tasks found. Add your first one above!</div>
      ) : (
        <div className="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
