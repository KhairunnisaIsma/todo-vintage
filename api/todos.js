import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Client di sisi server
// Variabel ini akan kita atur di Vercel nanti
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // 1. GET: Mengambil semua tugas
    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }

    // 2. POST: Menambah tugas baru
    if (req.method === 'POST') {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        const { data, error } = await supabase
            .from('todos')
            .insert([{ text, is_completed: false }])
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json(data);
    }

    // 3. PUT: Memperbarui tugas (selesai/belum)
    if (req.method === 'PUT') {
        const { id, is_completed, text } = req.body;
        if (id === undefined) return res.status(400).json({ error: 'ID is required' });

        const { data, error } = await supabase
            .from('todos')
            .update({ is_completed, text })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }
    
    // 4. DELETE: Menghapus tugas
    if (req.method === 'DELETE') {
        const { id } = req.body;
        if (id === undefined) return res.status(400).json({ error: 'ID is required' });

        const { error } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(204).send(); // 204 No Content
    }

    // Jika metode lain
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}