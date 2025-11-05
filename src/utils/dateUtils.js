// Helper untuk menghapus informasi waktu dari objek Date
const stripTime = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Fungsi utama untuk mendapatkan status tugas
export const getTaskStatus = (todo) => {
    if (todo.is_completed) {
        return { text: 'Completed', style: 'completed' };
    }

    if (!todo.due_date) {
        return { text: 'No Date', style: 'none' };
    }

    const today = stripTime(new Date());
    const dueDate = stripTime(new Date(todo.due_date));
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: 'Overdue', style: 'overdue' };
    }
    if (diffDays === 0) {
        return { text: 'Due Today', style: 'today' };
    }
    if (diffDays === 1) {
        return { text: 'Due Tomorrow', style: 'tomorrow' };
    }
    // "Upcoming" sekarang HANYA untuk tugas yang jatuh tempo lebih dari 1 hari lagi
    if (diffDays > 1) {
        return { text: `Due in ${diffDays} days`, style: 'upcoming' };
    }

    // Fallback jika ada kasus aneh
    return { text: 'Scheduled', style: 'none' };
};