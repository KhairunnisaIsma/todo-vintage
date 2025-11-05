import { useState, useEffect } from 'react';
import './App.css';
import { getTaskStatus } from './utils/dateUtils';

// --- Components ---

function StatusBadge({ status }) {
    if (status.style === 'none') return null;
    return (
        <span className={`status-badge badge-${status.style}`}>
            <span className="material-icons" style={{ fontSize: '14px' }}>{status.icon}</span>
            {status.text}
        </span>
    );
}

function TodoItem({ todo }) {
    const status = getTaskStatus(todo);
    return (
        <li className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
            <input 
                type="checkbox" 
                className="todo-item-checkbox" 
                defaultChecked={todo.is_completed} 
            />
            <span className="todo-item-text">{todo.text}</span>
            <StatusBadge status={status} />
        </li>
    );
}

const FILTERS = ['All', 'Overdue', 'Due Today', 'Upcoming', 'Completed'];

function FilterControls({ activeFilter, setActiveFilter }) {
    return (
        <div className="filter-controls">
            {FILTERS.map(filter => (
                <button
                    key={filter}
                    className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                    onClick={() => setActiveFilter(filter)}
                >
                    {filter}
                </button>
            ))}
        </div>
    );
}

// --- Main App Component ---

function App() {
    const [todos, setTodos] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        fetch('/api/todos')
            .then(res => res.json())
            .then(data => setTodos(data))
            .catch(err => console.error("Failed to fetch todos:", err));
    }, []);

    const filteredTodos = todos.filter(todo => {
        if (activeFilter === 'All') return true;
        
        const status = getTaskStatus(todo);
        const filterLower = activeFilter.toLowerCase().replace(' ', ''); // "duetoday"
        const statusTextLower = status.text.toLowerCase().replace(' ', ''); // "duetoday"
        
        if (activeFilter === 'Upcoming') {
            return status.style === 'tomorrow' || status.style === 'upcoming';
        }
        
        return statusTextLower === filterLower;
    });

    return (
        <div className="todo-app-container">
            <header className="app-header">
                <h1>My Vintage Tasks</h1>
            </header>
            
            <FilterControls 
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
            />

            <ul className="todo-list">
                {filteredTodos.map(todo => (
                    <TodoItem key={todo.id} todo={todo} />
                ))}
            </ul>
        </div>
    );
}

export default App;
