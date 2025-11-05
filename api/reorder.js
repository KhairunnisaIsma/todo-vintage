import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Handler ini menerima array of objects, di mana setiap object
 * hanya berisi `id` dan `position` barunya.
 * Contoh body: { "todos": [{ "id": 15, "position": 0 }, { "id": 12, "position": 1 }] }
 */
export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { todos } = req.body;

        // Validasi input dasar
        if (!todos || !Array.isArray(todos)) {
            return res.status(400).json({ error: 'Invalid request: "todos" array is required.' });
        }

        // Supabase `upsert` adalah cara yang sangat efisien untuk memperbarui
        // banyak baris sekaligus. Ia akan mencari baris berdasarkan `id`
        // (karena itu primary key kita) dan memperbarui kolom lainnya (`position`).
        const { error } = await supabase
            .from('todos')
            .upsert(todos);

        // Penanganan error dari Supabase
        if (error) {
            console.error('Supabase reorder error:', error);
            return res.status(500).json({ error: 'Failed to reorder tasks', details: error.message });
        }

        // Jika berhasil, kirim respons sukses
        return res.status(200).json({ message: 'Tasks reordered successfully' });
    }

    // Jika method request bukan POST
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}