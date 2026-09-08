// api/chat.js – Vercel Serverless Function (compatível com Groq, OpenAI, etc.)
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Mensagens inválidas' });
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('Chave da API não configurada no servidor.');
        }

        // Usa variáveis de ambiente para endpoint e modelo
        const endpoint = process.env.AI_ENDPOINT || 'https://api.openai.com/v1/chat/completions';
        const model = process.env.AI_MODEL || 'gpt-3.5-turbo';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Erro na API da IA');
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'Desculpe, não entendi.';

        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Erro no proxy:', error);
        return res.status(500).json({ error: error.message });
    }
}
