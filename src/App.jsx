import { useState, useEffect } from 'react';
// Impor dari dnd-kit untuk fungsionalitas Drag & Drop
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
// PERBAIKAN ADA DI BARIS DI BAWAH INI
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import './App.css';
import { getTaskStatus } from './utils/dateUtils';

// ===================================================================================
// KOMPONEN-KOMPONEN ANAK (HELPER COMPONENTS)
// ===================================================================================

const FILTERS = ['All', 'Overdue', 'Due Today', 'Upcoming', 'Completed'];

function FilterControls({ activeFilter, setActiveFilter }) {
    return (
        <div className="filter-controls">
            {FILTERS.map(filter => (
                <button
                    key={filter}
                    className={`filter-btn ${activeFilter === filter ? 'active' : ''} ${filter.replace(' ', '.')}`}
                    onClick={() => setActiveFilter(filter)}
                >
                    {filter}
                </button>
            ))}
        </div>
    );
}

function SortableTodoItem({ todo, onToggle, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: todo.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const status = getTaskStatus(todo);

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
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
    if (status.style === 'none') return null;
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
                <input id="task-text" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g., Submit monthly report" autoFocus />
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
    
    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        fetchTodos();
    }, []);

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
    
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = todos.findIndex((todo) => todo.id === active.id);
            const newIndex = todos.findIndex((todo) => todo.id === over.id);
            const reorderedTodos = arrayMove(todos, oldIndex, newIndex);
            setTodos(reorderedTodos);
            const reorderPayload = reorderedTodos.map((todo, index) => ({ id: todo.id, position: index }));
            try {
                await fetch('/api/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ todos: reorderPayload }),
                });
            } catch (error) {
                console.error("Failed to save new order:", error);
                fetchTodos();
            }
        }
    };

    const filteredTodos = todos.filter(todo => {
        if (activeFilter === 'All') return true;
        const status = getTaskStatus(todo);
        if (activeFilter === 'Upcoming') {
            return status.style === 'tomorrow' || status.style === 'upcoming';
        }
        return status.text.toLowerCase().replace(' ', '') === activeFilter.toLowerCase().replace(' ', '');
    });

    const getTitle = () => {
        if (view === 'add') return 'Add New Task';
        return `My Tasks (${filteredTodos.length})`;
    };

    return (
        <div className="todo-app-container">
            <header className="app-header"><h1>To-Do List</h1></header>
            <h2 className="view-title">{getTitle()}</h2>

            {view === 'list' ? (
                <>
                    <FilterControls activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
                    
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                            <div className="todo-list">
                                {filteredTodos.map(todo => (
                                    <SortableTodoItem
                                        key={todo.id}
                                        id={todo.id}
                                        todo={todo}
                                        onToggle={handleToggleComplete}
                                        onDelete={handleDeleteTodo}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <button className="fab" onClick={() => setView('add')}>+</button>
                </>
            ) : (
                <AddTaskForm onAddTask={handleAddTask} onCancel={() => setView('list')} />
            )}
        </div>
    );
}

export default App;