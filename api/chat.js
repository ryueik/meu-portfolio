export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Diagnóstico — não expõe a chave inteira
    const apiKey = process.env.GROQ_API_KEY;
    return res.status(200).json({
        status: 'ok',
        temChave: !!apiKey,
        tamanhoChave: apiKey ? apiKey.length : 0,
        prefixoChave: apiKey ? apiKey.substring(0, 7) : null,
        nodeVersion: process.version,
        method: req.method,
        hasBody: !!req.body
    });
}
