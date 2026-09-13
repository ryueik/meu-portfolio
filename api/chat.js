export default function handler(req, res) {
    return res.status(200).json({
        ok: true,
        message: 'Função a funcionar!',
        nodeVersion: process.version,
        temChaveGroq: !!process.env.GROQ_API_KEY,
        metodo: req.method,
        timestamp: new Date().toISOString()
    });
}
