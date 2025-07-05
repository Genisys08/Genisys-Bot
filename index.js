const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🤖 Genisys Bot is Running'));
app.listen(port, () => console.log(`🌐 Web server running on port ${port}`));

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startGenisys() {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        version
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) startGenisys();
        } else if (connection === 'open') {
            console.log('✅ Genisys connected to WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text === '.menu') {
            await sock.sendMessage(from, { text: '👋 Hello! I am Genisys.

Commands:
.menu
.ping

More coming soon 😎' });
        } else if (text === '.ping') {
            await sock.sendMessage(from, { text: '🏓 Pong!' });
        }
    });
}

startGenisys();
