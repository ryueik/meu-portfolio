export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('[Chat] GROQ_API_KEY não configurada.');
        return res.status(500).json({ error: 'GROQ_API_KEY não configurada no servidor.' });
    }

    try {
        const { messages } = req.body;
        if (!Array.isArray(messages)) {
            console.error('[Chat] Payload inválido:', req.body);
            return res.status(400).json({ error: 'Formato de mensagens inválido.' });
        }

        console.log('[Chat] Chamando Groq API com o modelo llama-3.3-70b-versatile...');
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            const errorBody = await response.text();
            console.error(`[Chat] Erro da Groq API (${response.status}):`, errorBody);
            return res.status(response.status).json({
                error: `Erro na API da Groq: ${response.status} ${response.statusText}`,
                details: errorBody
            });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Sem resposta da IA.';
        console.log('[Chat] Resposta da Groq recebida com sucesso.');
        return res.status(200).json({ reply });

    } catch (error) {
        console.error('[Chat] Erro fatal no handler:', error);
        // Retorna uma resposta de erro clara para o front-end, em vez de deixar a função crashar.
        return res.status(500).json({
            error: 'Erro interno no servidor.',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
