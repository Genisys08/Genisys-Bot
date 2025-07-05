const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('🤖 Genisys Web Bot is Running'));
app.listen(port, () => console.log(`🌐 Web server running on port ${port}`));

const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startGenisys() {
    const { version } = await fetchLatestBaileysVersion();
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
            console.log('❌ Disconnected. Reconnecting:', shouldReconnect);
            if (shouldReconnect) startGenisys();
        } else if (connection === 'open') {
            console.log('✅ Genisys connected to WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text) return;

        const reply = async (txt) => {
            await sock.sendMessage(from, { text: txt });
        };

        // Commands
        const cmd = text.toLowerCase();

        switch (cmd) {
            case '.menu':
                return reply('🧠 Genisys Command Menu:

.menu - Show this menu
.ping - Test response
.time - Show server time
.owner - Bot creator
.joke - Random joke
.hello - Greet you');
            case '.ping':
                return reply('🏓 Pong! I'm alive.');
            case '.time':
                return reply('🕒 Server time: ' + new Date().toLocaleString());
            case '.owner':
                return reply('👑 Created by John | Genisys AI.');
            case '.joke':
                const jokes = [
                    "Why don’t bots tell secrets? Because they have too many bugs!",
                    "I told my computer I needed a break, and it said: 'Error 404: Chill not found.'",
                    "Why was the JavaScript developer sad? Because he didn’t Node how to Express himself."
                ];
                return reply('😂 ' + jokes[Math.floor(Math.random() * jokes.length)]);
            case '.hello':
                return reply('👋 Hey there! I'm Genisys. Ready to assist.');
            default:
                return; // No action for unknown commands
        }
    });
}

startGenisys();
