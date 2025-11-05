import { useState, useEffect, useRef } from 'react';
import './App.css';
import { getTaskStatus } from './utils/dateUtils';

// ===================================================================================
// KOMPONEN-KOMPONEN ANAK (HELPER COMPONENTS)
// ===================================================================================

const FILTERS = ['All', 'Upcoming', 'Due Tomorrow', 'Due Today', 'Completed', 'Overdue'];

function FilterControls({ activeFilter, setActiveFilter, scrollRef }) {
    // Komponen ini sekarang menerima 'scrollRef'
    return (
        <div className="filter-controls" ref={scrollRef}>
            {FILTERS.map(filter => (
                <button
                    key={filter}
                    className={`filter-btn ${activeFilter === filter ? 'active' : ''} ${filter.replace(' ', '')}`}
                    onClick={() => setActiveFilter(filter)}
                >
                    {filter}
                </button>
            ))}
        </div>
    );
}

// Komponen TodoItem sekarang menjadi komponen sederhana tanpa dnd-kit
function TodoItem({ todo, onToggle, onDelete }) {
    const status = getTaskStatus(todo);

    return (
        <div className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
            <input
                type="checkbox"
                className="todo-item-checkbox"
                checked={todo.is_completed}
                onChange={() => onToggle(todo.id, !todo.is_completed)}
            />
            <span className="todo-item-text" onClick={() => onToggle(todo.id, !todo.is_completed)}>
                {todo.text}
            </span>
            <StatusBadge status={status} />
            <button className="delete-btn" onClick={() => onDelete(todo.id)}>×</button>
        </div>
    );
}

function StatusBadge({ status }) {
    if (status.style === 'none' || !status.text) return null;
    return <span className={`status-badge badge-${status.style}`}>{status.text}</span>;
}

function AddTaskForm({ onAddTask, onCancel }) {
    const [text, setText] = useState('');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onAddTask(text, dueDate);
    };

    return (
        <form className="add-task-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="task-text">Task Name</label>
                <input id="task-text" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g., Finish the report" autoFocus />
            </div>
            <div className="form-group">
                <label htmlFor="task-due-date">Due Date (Optional)</label>
                <input id="task-due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Task</button>
            </div>
        </form>
    );
}

// ===================================================================================
// KOMPONEN UTAMA APLIKASI
// ===================================================================================

function App() {
    const [todos, setTodos] = useState([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [view, setView] = useState('list');
    
    // Hook useRef untuk mengakses elemen DOM filter
    const scrollRef = useRef(null);

    useEffect(() => { fetchTodos(); }, []);

    const fetchTodos = async () => {
        try {
            const res = await fetch('/api/todos');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            setTodos(data);
        } catch (error) {
            console.error("Failed to fetch todos:", error);
        }
    };

    const handleAddTask = async (text, due_date) => {
        await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, due_date: due_date || null }),
        });
        await fetchTodos();
        setView('list');
    };

    const handleToggleComplete = async (id, is_completed) => {
        const originalTodos = [...todos];
        setTodos(todos.map(todo => todo.id === id ? { ...todo, is_completed } : todo));
        try {
            await fetch('/api/todos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_completed }),
            });
        } catch (error) {
            setTodos(originalTodos);
            console.error("Failed to update todo:", error);
        }
    };
    
    const handleDeleteTodo = async (id) => {
        const originalTodos = [...todos];
        setTodos(todos.filter(todo => todo.id !== id));
        try {
            await fetch('/api/todos', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
        } catch (error) {
            setTodos(originalTodos);
            console.error("Failed to delete todo:", error);
        }
    };

     // FUNGSI BARU UNTUK MENGONTROL SCROLL
    const handleScroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = 200; // Seberapa jauh scroll saat tombol diklik
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth', // Animasi scroll yang halus
            });
        }
    };

    const filteredAndSortedTodos = todos
        .filter(todo => {
            // Logika baru yang lebih ketat
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Completed') return todo.is_completed;
            if (todo.is_completed) return false; // Jika sudah selesai, jangan muncul di filter lain

            const status = getTaskStatus(todo);
            if (activeFilter === 'Upcoming') return status.style === 'upcoming';
            if (activeFilter === 'Due Tomorrow') return status.style === 'tomorrow';
            if (activeFilter === 'Due Today') return status.style === 'today';
            if (activeFilter === 'Overdue') return status.style === 'overdue';
            
            return false;
        })
        .sort((a, b) => {
            if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
            if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
            return a.due_date ? -1 : b.due_date ? 1 : 0;
        });

    const getTitle = () => {
        if (view === 'add') return 'Add New Task';
        return `My Tasks (${filteredAndSortedTodos.length})`;
    };

    return (
        <div className="todo-app-container">
            <header className="app-header"><h1>To-Do List</h1></header>
            {view === 'list' ? (
                <>
                    <div className="view-header">
                        <h2 className="view-title">{getTitle()}</h2>
                        <button className="fab" onClick={() => setView('add')}>+</button>
                    </div>
                    {/* STRUKTUR BARU DENGAN TOMBOL SCROLL */}
                    <div className="filter-container">
                        <button className="scroll-btn left" onClick={() => handleScroll('left')}>&lt;</button>
                        <FilterControls activeFilter={activeFilter} setActiveFilter={setActiveFilter} scrollRef={scrollRef} />
                        <button className="scroll-btn right" onClick={() => handleScroll('right')}>&gt;</button>
                    </div>
                    <div className="todo-list">
                        {filteredAndSortedTodos.map(todo => (
                            <TodoItem key={todo.id} todo={todo} onToggle={handleToggleComplete} onDelete={handleDeleteTodo} />
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <div className="view-header">
                         <h2 className="view-title">{getTitle()}</h2>
                    </div>
                    <AddTaskForm onAddTask={handleAddTask} onCancel={() => setView('list')} />
                </>
            )}
        </div>
    );
}
export default App;