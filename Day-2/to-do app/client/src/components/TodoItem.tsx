import React from 'react';
import type { Todo } from '../types';
import './TodoItem.css';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-content">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo._id, !todo.completed)}
          className="todo-checkbox"
        />
        <div className="todo-details">
          <h3 className="todo-title">{todo.title}</h3>
          {todo.description && <p className="todo-description">{todo.description}</p>}
          <div className="todo-meta">
            <span className={`badge priority-${todo.priority.toLowerCase()}`}>
              {todo.priority}
            </span>
            <span className="badge category">
              {todo.category}
            </span>
          </div>
        </div>
      </div>
      <button className="delete-btn" onClick={() => onDelete(todo._id)}>
        &times;
      </button>
    </div>
  );
};

export default TodoItem;
