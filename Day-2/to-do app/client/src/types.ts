export interface Todo {
  _id: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  category: 'Work' | 'Personal' | 'Urgent';
  completed: boolean;
  createdAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  category: 'Work' | 'Personal' | 'Urgent';
}
