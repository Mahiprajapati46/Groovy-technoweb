import express from 'express';
import Todo from '../models/Todo';

const router = express.Router();

// GET all todos
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json({ data: todos });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new todo
router.post('/', async (req, res) => {
  const { title, description, priority, category } = req.body;
  const newTodo = new Todo({
    title,
    description,
    priority,
    category
  });

  try {
    const savedTodo = await newTodo.save();
    res.status(201).json({ data: savedTodo });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH a todo (update status or details)
router.patch('/:id', async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTodo) return res.status(404).json({ error: 'Todo not found' });
    res.json({ data: updatedTodo });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a todo
router.delete('/:id', async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
    if (!deletedTodo) return res.status(404).json({ error: 'Todo not found' });
    res.json({ data: { message: 'Todo deleted successfully' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
