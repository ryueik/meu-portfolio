const GH = {
  owner:  process.env.GH_OWNER,
  repo:   process.env.GH_REPO,
  branch: process.env.GH_BRANCH || 'main',
  path:   process.env.GH_PATH   || 'data/portfolio.json',
  token:  process.env.GH_TOKEN,
};
const API = 'https://api.github.com';

const headers = () => ({
  Authorization: `Bearer ${GH.token}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'portfolio-admin',
});

async function getFile() {
  const url = `${API}/repos/${GH.owner}/${GH.repo}/contents/${GH.path}?ref=${GH.branch}&t=${Date.now()}`;
  const r = await fetch(url, { headers: headers() });
  if (r.status === 404) return { data: null, sha: null };
  if (!r.ok) throw new Error((await r.json()).message || `GitHub ${r.status}`);
  const j = await r.json();
  return { data: JSON.parse(Buffer.from(j.content, 'base64').toString('utf8')), sha: j.sha };
}

async function putFile(dataObj, sha, msg) {
  const payload = {
    message: msg || 'Update portfolio data',
    content: Buffer.from(JSON.stringify(dataObj, null, 2)).toString('base64'),
    branch: GH.branch,
  };
  if (sha) payload.sha = sha;
  const r = await fetch(`${API}/repos/${GH.owner}/${GH.repo}/contents/${GH.path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).message || `GitHub ${r.status}`);
  return (await r.json()).content.sha;
}

async function putBinary(path, base64, msg) {
  let sha = null;
  const r0 = await fetch(`${API}/repos/${GH.owner}/${GH.repo}/contents/${path}?ref=${GH.branch}`, { headers: headers() });
  if (r0.ok) sha = (await r0.json()).sha;
  const payload = { message: msg || `Upload ${path}`, content: base64, branch: GH.branch };
  if (sha) payload.sha = sha;
  const r = await fetch(`${API}/repos/${GH.owner}/${GH.repo}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error((await r.json()).message || `GitHub ${r.status}`);
}

// Rate limit simples por IP (best-effort em serverless)
const hits = new Map();
function blocked(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) { hits.set(ip, { n: 1, reset: now + 60_000 }); return false; }
  rec.n++;
  return rec.n > 10;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
  if (blocked(ip)) return res.status(429).json({ error: 'Muitas tentativas. Aguarde 1 minuto.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { action, password } = body;

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  try {
    if (action === 'login') return res.json({ ok: true });

    if (action === 'load') {
      const { data, sha } = await getFile();
      return res.json({ data, sha });
    }
    if (action === 'save') {
      const sha = await putFile(body.data, body.sha, body.message);
      return res.json({ sha });
    }
    if (action === 'upload') {
      await putBinary(body.path, body.content, body.message);
      const url = `https://cdn.jsdelivr.net/gh/${GH.owner}/${GH.repo}@${GH.branch}/${body.path}?v=${Date.now()}`;
      return res.json({ url });
    }
    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
