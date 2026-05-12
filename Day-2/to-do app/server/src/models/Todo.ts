import mongoose, { Schema, Document } from 'mongoose';

export interface ITodo extends Document {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  category: 'Work' | 'Personal' | 'Urgent';
  completed: boolean;
  createdAt: Date;
}

const TodoSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  category: { type: String, enum: ['Work', 'Personal', 'Urgent'], default: 'Work' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ITodo>('Todo', TodoSchema);
