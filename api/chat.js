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

        // ⚠️ Forçamos o modelo da Groq, ignorando o que vier do front-end
        const GROQ_MODEL = 'llama-3.3-70b-versatile';

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('[Groq API Error]', response.status, err);
            return res.status(response.status).json({ error: err.error?.message || `Erro ${response.status} na Groq API` });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Sem resposta';
        return res.status(200).json({ reply });
    } catch (e) {
        console.error('[Chat handler error]', e);
        return res.status(500).json({ error: e.message });
    }
}
