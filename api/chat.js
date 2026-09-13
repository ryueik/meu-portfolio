export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY não configurada' });

    try {
        const { messages } = req.body;

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const groqText = await groqRes.text();

        if (!groqRes.ok) {
            return res.status(groqRes.status).json({
                error: 'Groq API erro',
                status: groqRes.status,
                details: groqText.substring(0, 300)
            });
        }

        const groqData = JSON.parse(groqText);
        const reply = groqData.choices?.[0]?.message?.content || 'Sem resposta';
        return res.status(200).json({ reply });

    } catch (e) {
        return res.status(500).json({
            error: 'Erro no handler',
            message: e.message,
            stack: e.stack ? e.stack.substring(0, 500) : null
        });
    }
}
