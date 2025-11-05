// Helper to strip time from a date
const stripTime = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Main function to get task status
export const getTaskStatus = (todo) => {
    if (todo.is_completed) {
        return { text: 'Completed', style: 'completed', icon: 'check_circle' };
    }

    if (!todo.due_date) {
        return { text: 'No Date', style: 'none', icon: '' };
    }

    const today = stripTime(new Date());
    const dueDate = stripTime(new Date(todo.due_date));
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: 'Overdue', style: 'overdue', icon: 'error_outline' };
    }
    if (diffDays === 0) {
        return { text: 'Due Today', style: 'today', icon: 'today' };
    }
    if (diffDays === 1) {
        return { text: 'Due Tomorrow', style: 'tomorrow', icon: 'calendar_today' };
    }
    return { text: `Due in ${diffDays} days`, style: 'upcoming', icon: 'calendar_month' };
};