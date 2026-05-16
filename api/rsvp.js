const DEFAULT_BOT_TOKEN = '8781128784:AAECuc2oK-lHYZIuc8qsyLTgv36mG7MeCqs';
const DEFAULT_CHAT_ID = '-5173257192';

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const text = req.body && req.body.text;
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing text' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

    try {
        const telegramRes = await fetch(
            'https://api.telegram.org/bot' + botToken + '/sendMessage',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown',
                }),
            }
        );

        if (!telegramRes.ok) {
            const errBody = await telegramRes.text();
            console.error('Telegram API error:', telegramRes.status, errBody);
            return res.status(502).json({ error: 'Telegram error' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('RSVP handler error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};
