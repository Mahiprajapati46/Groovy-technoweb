import React, { useState } from 'react';
import type { CreateTodoInput } from '../types';
import './TodoForm.css';

interface TodoFormProps {
  onSubmit: (todo: CreateTodoInput) => void;
}

const TodoForm: React.FC<TodoFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [category, setCategory] = useState<'Work' | 'Personal' | 'Urgent'>('Work');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description, priority, category });
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setCategory('Work');
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="form-input title-input"
        required
      />
      <textarea
        placeholder="Add a description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="form-input"
      />
      <div className="form-row">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="form-select"
        >
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className="form-select"
        >
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Urgent">Urgent</option>
        </select>
        <button type="submit" className="submit-btn">Add Task</button>
      </div>
    </form>
  );
};

export default TodoForm;
