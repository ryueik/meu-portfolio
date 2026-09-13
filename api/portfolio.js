export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const url = `https://api.github.com/repos/ryueik/meu-portfolio/contents/data/portfolio.json?ref=main&t=${Date.now()}`;
        const ghRes = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'portfolio-api'
            }
        });

        if (!ghRes.ok) {
            return res.status(ghRes.status).json({ error: 'Erro GitHub: ' + ghRes.status });
        }

        const ghData = await ghRes.json();
        const content = Buffer.from(ghData.content, 'base64').toString('utf-8');
        const json = JSON.parse(content);

        return res.status(200).json(json);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
