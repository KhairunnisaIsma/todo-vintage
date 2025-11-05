import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    // GET: Mengambil semua tugas
    if (req.method === 'GET') {
        // PERUBAHAN UTAMA: Mengurutkan berdasarkan 'position' bukan 'created_at'
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .order('position', { ascending: true }); // Mengurutkan dari posisi terkecil ke terbesar

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
    }

    // POST: Menambah tugas baru
    if (req.method === 'POST') {
        const { text, due_date } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        const { data, error } = await supabase
            .from('todos')
            .insert([{ text, due_date, is_completed: false }]) // `position` akan memiliki nilai default 0 dari database
            .select()
            .single();
        
        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json(data);
    }
    
    // PUT: Memperbarui tugas (misal: is_completed)
    if (req.method === 'PUT') {
        const { id, ...updateData } = req.body;
        if (!id) return res.status(400).json({ error: 'ID is required' });

        const { data, error } = await supabase
            .from('todos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    }
    
    // DELETE: Menghapus tugas
    if (req.method === 'DELETE') {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'ID is required' });

        const { error } = await supabase.from('todos').delete().eq('id', id);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(204).send(); // No Content
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}