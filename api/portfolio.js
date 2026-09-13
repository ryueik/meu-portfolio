export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Nunca cachear
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

    try {
        const OWNER = 'ryueik';
        const REPO = 'meu-portfolio';
        const BRANCH = 'main';
        const PATH = 'data/portfolio.json';

        // Busca pelo GitHub API (nunca cacheia)
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}&t=${Date.now()}`;
        const ghRes = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'portfolio-api'
            }
        });

        if (!ghRes.ok) {
            return res.status(ghRes.status).json({ error: 'Erro ao buscar do GitHub: ' + ghRes.status });
        }

        const ghData = await ghRes.json();

        // Decodifica base64 → JSON
        const content = Buffer.from(ghData.content, 'base64').toString('utf-8');
        const json = JSON.parse(content);

        return res.status(200).json(json);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
