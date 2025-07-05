
// Genisys - WhatsApp Bot by John
// Built with Baileys (Multi-Device)

const { Boom } = require('@hapi/boom');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const axios = require('axios');
const fs = require('fs');

const prefix = '.'; // Bot command prefix
const botName = 'Genisys';
const ownerName = 'John';

async function startGenisysBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Genisys-Bot','Safari','1.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (!messages || type !== 'notify') return;
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const sender = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text;
        if (!body || !body.startsWith(prefix)) return;

        const command = body.slice(1).trim().split(/ +/).shift().toLowerCase();
        const args = body.trim().split(/ +/).slice(1);

        if (command === 'menu') {
            await sock.sendMessage(sender, { text: `
🤖 *${botName} Menu* 🤖

${prefix}menu - Show this menu
${prefix}ai <text> - Chat with AI
${prefix}play <song> - Download a song
${prefix}afk <reason> - Set auto-reply
${prefix}credits - Show bot info

_Type '${prefix}help' for more._` });

        } else if (command === 'credits') {
            await sock.sendMessage(sender, { text: `🔧 Genisys v1.0 by ${ownerName}\nBuilt with Baileys.` });

        } else if (command === 'ai') {
            const input = args.join(' ');
            if (!input) return await sock.sendMessage(sender, { text: 'Please provide a question or message.' });
            await sock.sendMessage(sender, { text: `🧠 (Simulated AI reply): ${input}` });
            // You can plug in actual OpenAI API here

        } else if (command === 'play') {
            const query = args.join(' ');
            if (!query) return await sock.sendMessage(sender, { text: 'Please provide a song name.' });
            await sock.sendMessage(sender, { text: `🎵 Searching for: ${query}\n(This is a mock. You can add YouTube API here)` });

        } else if (command === 'afk') {
            const reason = args.join(' ') || 'AFK';
            await sock.sendMessage(sender, { text: `💤 ${ownerName} is now AFK: ${reason}` });

        } else {
            await sock.sendMessage(sender, { text: `❓ Unknown command: ${command}\nTry ${prefix}menu` });
        }
    });
}

startGenisysBot();
