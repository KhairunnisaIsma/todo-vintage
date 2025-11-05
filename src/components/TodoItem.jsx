import React from 'react';

function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="todo-item-checkbox"
        checked={todo.is_completed}
        onChange={() => onToggle(todo.id, !todo.is_completed)}
      />
      <span
        className="todo-item-text"
        onClick={() => onToggle(todo.id, !todo.is_completed)}
      >
        {todo.text}
      </span>
      <button className="todo-item-delete" onClick={() => onDelete(todo.id)}>
        ×
      </button>
    </li>
  );    
}

export default TodoItem;