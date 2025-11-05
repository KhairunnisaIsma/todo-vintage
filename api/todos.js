import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .order('due_date', { ascending: true, nullsFirst: false }); // Urutkan berdasarkan tanggal

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        return res.status(200).json(data);
    }
    
    // Nanti bisa ditambahkan method POST, PUT, DELETE di sini jika diperlukan
    
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}