'use client'

import React, { useState } from 'react'
import { EnhancedChatInterface } from '@/components/enhanced-chat-interface'

interface ImageFile {
  file?: File
  url: string
  id: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: ImageFile[]
  chainOfThought?: string
  timestamp?: string
  modelId?: string
  modelName?: string
  reasoningType?: 'coding' | 'analysis' | 'creative' | 'research' | 'conversation'
  confidence?: number
  processingTime?: number
}

const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'user',
    content: 'Can you show me a simple React component for a counter and also solve this math equation: $$\\int_0^\\pi \\sin(x) dx$$'
  },
  {
    id: '2', 
    role: 'assistant',
    content: `I'll help you with both! Here's a simple React counter component and the solution to your integral.

## React Counter Component

Here's a basic counter component:

\`\`\`jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  return (
    <div className="counter-container">
      <h2>Counter: {count}</h2>
      <div className="button-group">
        <button onClick={decrement} disabled={count === 0}>
          -
        </button>
        <button onClick={reset}>
          Reset
        </button>
        <button onClick={increment}>
          +
        </button>
      </div>
    </div>
  );
}

export default Counter;
\`\`\`

And here's the accompanying CSS for styling:

\`\`\`css
.counter-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.counter-container h2 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.5rem;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.button-group button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-group button:hover:not(:disabled) {
  background: #0056b3;
}

.button-group button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
\`\`\`

## Mathematical Solution

Now for the integral: $$\\int_0^\\pi \\sin(x) dx$$

To solve this integral, we use the antiderivative of $\\sin(x)$, which is $-\\cos(x)$.

$$\\int_0^\\pi \\sin(x) dx = [-\\cos(x)]_0^\\pi$$

Evaluating at the bounds:
$$= -\\cos(\\pi) - (-\\cos(0))$$
$$= -(-1) - (-1)$$
$$= 1 + 1 = 2$$

So the answer is $2$.

## Usage

You can use this counter component in your app like this:

\`\`\`jsx
import Counter from './Counter';

function App() {
  return (
    <div className="App">
      <h1>My React App</h1>
      <Counter />
    </div>
  );
}
\`\`\`

The component uses React hooks (\`useState\`) to manage state and provides three basic operations: increment, decrement, and reset.`,
    chainOfThought: 'The user asked for both a React component and a mathematical solution. I should provide a well-structured response that covers both topics clearly. For the React component, I\'ll create a simple but complete counter with proper styling. For the math, I\'ll show the step-by-step solution using proper LaTeX notation.',
    modelName: 'Claude',
    confidence: 95,
    processingTime: 1250,
    reasoningType: 'coding'
  },
  {
    id: '3',
    role: 'user',
    content: 'That looks great! Can you also show me a more complex component with TypeScript?'
  },
  {
    id: '4',
    role: 'assistant', 
    content: `Absolutely! Here's a more complex TypeScript component - a Todo List with advanced features:

## Advanced Todo List Component

\`\`\`typescript
import React, { useState, useCallback, useMemo } from 'react';

// Types and interfaces
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: Date;
  dueDate?: Date;
}

interface TodoFormData {
  text: string;
  priority: Todo['priority'];
  category: string;
  dueDate: string;
}

interface TodoListProps {
  initialTodos?: Todo[];
  onTodosChange?: (todos: Todo[]) => void;
}

// Utility functions
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const TodoList: React.FC<TodoListProps> = ({ 
  initialTodos = [], 
  onTodosChange 
}) => {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'dueDate'>('createdAt');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<TodoFormData>({
    text: '',
    priority: 'medium',
    category: 'general',
    dueDate: ''
  });

  // Memoized filtered and sorted todos
  const filteredTodos = useMemo(() => {
    let filtered = todos;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(todo => 
        todo.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        todo.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    switch (filter) {
      case 'active':
        filtered = filtered.filter(todo => !todo.completed);
        break;
      case 'completed':
        filtered = filtered.filter(todo => todo.completed);
        break;
      default:
        break;
    }

    // Sort todos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return filtered;
  }, [todos, filter, sortBy, searchTerm]);

  const addTodo = useCallback(() => {
    if (!formData.text.trim()) return;

    const newTodo: Todo = {
      id: generateId(),
      text: formData.text.trim(),
      completed: false,
      priority: formData.priority,
      category: formData.category,
      createdAt: new Date(),
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined
    };

    const updatedTodos = [newTodo, ...todos];
    setTodos(updatedTodos);
    onTodosChange?.(updatedTodos);
    
    // Reset form
    setFormData({
      text: '',
      priority: 'medium',
      category: 'general',
      dueDate: ''
    });
  }, [formData, todos, onTodosChange]);

  const toggleTodo = useCallback((id: string) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    onTodosChange?.(updatedTodos);
  }, [todos, onTodosChange]);

  const deleteTodo = useCallback((id: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    onTodosChange?.(updatedTodos);
  }, [todos, onTodosChange]);

  const getPriorityColor = (priority: Todo['priority']): string => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const isOverdue = (todo: Todo): boolean => {
    return !todo.completed && todo.dueDate && todo.dueDate < new Date();
  };

  return (
    <div className="todo-list-container">
      <header className="todo-header">
        <h1>Advanced Todo List</h1>
        
        {/* Search and Filter Controls */}
        <div className="controls">
          <input
            type="text"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="sort-select"
          >
            <option value="createdAt">Created Date</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>
      </header>

      {/* Add Todo Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); addTodo(); }}
        className="add-todo-form"
      >
        <input
          type="text"
          placeholder="Enter a new todo..."
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          className="todo-input"
        />
        
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ 
            ...formData, 
            priority: e.target.value as Todo['priority']
          })}
          className="priority-select"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        
        <input
          type="text"
          placeholder="Category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="category-input"
        />
        
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className="date-input"
        />
        
        <button type="submit" className="add-button">
          Add Todo
        </button>
      </form>

      {/* Todo List */}
      <div className="todo-list">
        {filteredTodos.length === 0 ? (
          <div className="empty-state">
            <p>No todos found</p>
          </div>
        ) : (
          filteredTodos.map(todo => (
            <div 
              key={todo.id}
              className={\`todo-item \${todo.completed ? 'completed' : ''} \${isOverdue(todo) ? 'overdue' : ''}\`}
            >
              <div className="todo-content">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="todo-checkbox"
                />
                
                <div className="todo-details">
                  <span className="todo-text">{todo.text}</span>
                  <div className="todo-meta">
                    <span className={\`priority \${getPriorityColor(todo.priority)}\`}>
                      {todo.priority.toUpperCase()}
                    </span>
                    <span className="category">{todo.category}</span>
                    <span className="created-date">
                      Created: {formatDate(todo.createdAt)}
                    </span>
                    {todo.dueDate && (
                      <span className={\`due-date \${isOverdue(todo) ? 'overdue' : ''}\`}>
                        Due: {formatDate(todo.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => deleteTodo(todo.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
      
      {/* Stats */}
      <footer className="todo-stats">
        <span>Total: {todos.length}</span>
        <span>Active: {todos.filter(t => !t.completed).length}</span>
        <span>Completed: {todos.filter(t => t.completed).length}</span>
      </footer>
    </div>
  );
};

export default TodoList;
\`\`\`

This component demonstrates several advanced TypeScript and React patterns:

### Key Features:
- **TypeScript interfaces** for type safety
- **Custom hooks** with useCallback and useMemo for performance
- **Advanced filtering and sorting** 
- **Form management** with controlled components
- **Date handling** and formatting
- **Search functionality**
- **Priority and category system**
- **Overdue detection**

### Advanced TypeScript Features Used:
- Union types (\`'low' | 'medium' | 'high'\`)
- Optional properties (\`dueDate?\`)
- Generic types in useState
- Function type definitions
- Interface composition

The component is fully typed, performant, and includes comprehensive functionality for managing todos with priorities, categories, due dates, and advanced filtering options.`,
    modelName: 'Claude',
    confidence: 98,
    processingTime: 2100,
    reasoningType: 'coding'
  }
]

export const CodeDemoPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES)
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet')

  const handleSendMessage = (content: string, images?: ImageFile[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      images,
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, newMessage])
    
    // Simulate AI response
    setTimeout(() => {
      let responseContent = 'This is a demo response. The actual implementation would connect to your AI backend.'
      
      // If images were sent, provide image analysis response
      if (images && images.length > 0) {
        responseContent = `I can see you've uploaded ${images.length} image${images.length > 1 ? 's' : ''}! 

In a real implementation, I would analyze the image${images.length > 1 ? 's' : ''} and provide detailed insights about:

- **Visual Content**: What I can see in the image${images.length > 1 ? 's' : ''}
- **Text Recognition**: Any text present in the image${images.length > 1 ? 's' : ''}  
- **Technical Analysis**: Image properties, composition, etc.
- **Context Understanding**: How the image${images.length > 1 ? 's' : ''} relate${images.length > 1 ? '' : 's'} to your question

For now, this is just a demo showcasing the image upload functionality. The actual AI vision capabilities would be implemented through your backend API.

${content ? `You also asked: "${content}"` : ''}`
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        modelName: 'Claude',
        confidence: 92,
        processingTime: 850,
        reasoningType: images && images.length > 0 ? 'analysis' : 'conversation'
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <div className="h-screen bg-zinc-950 text-white">
      <EnhancedChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
      />
    </div>
  )
}