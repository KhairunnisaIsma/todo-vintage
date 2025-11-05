import { useState, useEffect } from 'react';
import './App.css';
import TodoItem from './components/TodoItem';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputText, setInputText] = useState('');

  // Efek untuk mengambil data saat komponen pertama kali dimuat
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const res = await fetch('/api/todos');
    const data = await res.json();
    setTodos(data);
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (inputText.trim() === '') return;

    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputText }),
    });

    if (res.ok) {
      setInputText('');
      fetchTodos(); // Ambil ulang data agar daftar terupdate
    }
  };
  
  const handleToggleTodo = async (id, is_completed) => {
      const res = await fetch('/api/todos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, is_completed }),
      });
      if (res.ok) {
          fetchTodos();
      }
  };

  const handleDeleteTodo = async (id) => {
      const res = await fetch('/api/todos', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
      });
      if (res.ok) {
          fetchTodos();
      }
  };

  return (
    <div className="app-container">
      <div className="todo-app">
        <h1>To-Do List 90s</h1>
        <form className="add-todo-form" onSubmit={handleAddTodo}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ketik tugas baru..."
          />
          <button type="submit">Tambah</button>
        </form>
        <ul className="todo-list">
          {todos.map((todo) => (
            <TodoItem 
              key={todo.id} 
              todo={todo}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
