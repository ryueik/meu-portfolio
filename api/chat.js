export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY não configurada no Vercel' });

    try {
        const { messages } = req.body;
        if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages inválido' });

        // URL DA GROQ (não OpenAI)
        const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('[Groq erro]', response.status, err);
            return res.status(response.status).json({ error: err.error?.message || `Erro ${response.status}` });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Sem resposta';
        return res.status(200).json({ reply });
    } catch (e) {
        console.error('[Chat erro]', e);
        return res.status(500).json({ error: e.message });
    }
}
