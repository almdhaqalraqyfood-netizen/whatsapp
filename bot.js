const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode'); // تحويل QR Code إلى صورة

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`📨 Request: ${req.method} ${req.path}`);
    next();
});

// حالة WhatsApp
let whatsappClient = null;
let isAuthenticated = false;
let qrCodeData = null;
let clientReady = false;

// تهيئة WhatsApp Web
function initializeWhatsApp() {
    whatsappClient = new Client({
        authStrategy: new LocalAuth({ clientId: "whatsapp-client" }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        }
    });

    whatsappClient.on('qr', (qr) => {
        console.log('📱 QR Code received! Scan with WhatsApp');
        qrCodeData = qr;
        isAuthenticated = false;
        clientReady = false;
    });

    whatsappClient.on('ready', () => {
        console.log('✅ WhatsApp Client is ready!');
        isAuthenticated = true;
        clientReady = true;
        qrCodeData = null;
    });

    whatsappClient.on('authenticated', () => {
        console.log('✅ WhatsApp authenticated successfully!');
        isAuthenticated = true;
    });

    whatsappClient.on('auth_failure', (msg) => {
        console.log('❌ WhatsApp authentication failed:', msg);
        isAuthenticated = false;
        clientReady = false;
    });

    whatsappClient.on('disconnected', (reason) => {
        console.log('❌ WhatsApp disconnected:', reason);
        isAuthenticated = false;
        clientReady = false;
        setTimeout(() => {
            console.log('🔄 Reconnecting WhatsApp...');
            initializeWhatsApp();
        }, 10000);
    });

    whatsappClient.initialize();
}

// دالة إرسال رسالة WhatsApp
async function sendWhatsAppMessage(phone, message) {
    if (!clientReady || !whatsappClient) throw new Error('WhatsApp client is not ready');

    const cleanedPhone = phone.replace(/\D/g, '');
    let formattedPhone;
    if (cleanedPhone.startsWith('967')) formattedPhone = cleanedPhone;
    else if (cleanedPhone.startsWith('0')) formattedPhone = '967' + cleanedPhone.substring(1);
    else if (cleanedPhone.startsWith('+967')) formattedPhone = cleanedPhone.substring(1);
    else formattedPhone = '967' + cleanedPhone;

    const chatId = `${formattedPhone}@c.us`;

    const isRegistered = await whatsappClient.isRegisteredUser(chatId);
    if (!isRegistered) throw new Error('Phone number is not registered on WhatsApp');

    await whatsappClient.sendMessage(chatId, message);
}

// Routes
app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp Service',
        status: clientReady ? 'ready' : 'initializing',
        endpoints: {
            health: '/health',
            qr: '/qr',
            send_otp: '/send-otp (POST)',
            keep_alive: '/keep-alive'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server_time: new Date().toLocaleString('ar-SA'),
        whatsapp_ready: clientReady,
        whatsapp_authenticated: isAuthenticated
    });
});

app.get('/keep-alive', (req, res) => {
    res.json({
        status: 'active',
        timestamp: new Date().toISOString(),
        message: 'Service keep-alive ping'
    });
});

// QR Endpoint مع صورة
app.get('/qr', async (req, res) => {
    if (isAuthenticated && clientReady) {
        return res.send('<h2>✅ WhatsApp Authenticated</h2><p>Client is ready!</p>');
    }

    if (qrCodeData) {
        try {
            const qrImage = await QRCode.toDataURL(qrCodeData);
            const html = `
                <h2>📱 Scan this QR code with WhatsApp mobile app</h2>
                <img src="${qrImage}" alt="WhatsApp QR Code" />
            `;
            return res.send(html);
        } catch (err) {
            return res.status(500).send('❌ Failed to generate QR image');
        }
    }

    res.send('<p>Generating QR code, please refresh in a few seconds...</p>');
});

// إرسال OTP عبر WhatsApp
app.post('/send-otp', async (req, res) => {
    const { phone, otp, name = 'عميلنا' } = req.body;

    if (!phone || !otp) return res.status(400).json({ success: false, error: 'Phone and OTP are required' });

    if (!clientReady) return res.status(503).json({ success: false, error: 'WhatsApp not ready', status: 'not_ready' });

    const message = `🔐 رمز التحقق 🔐\n\nمرحباً ${name}،\n\nرمز التحقق الخاص بك هو: 📱 *${otp}*\n⏰ صالح لمدة 5 دقائق\n⚠️ لا تشارك الرمز مع أي شخص`;

    try {
        await sendWhatsAppMessage(phone, message);
        console.log(`✅ OTP sent to ${phone}`);
        res.json({ success: true, message: 'OTP sent successfully', phone, method: 'whatsapp' });
    } catch (error) {
        console.error('❌ Error sending OTP:', error);
        res.status(500).json({ success: false, error: error.message, message: 'Failed to send OTP' });
    }
});

// Initialize WhatsApp
initializeWhatsApp();

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp Service running on port ${PORT}`);
    console.log(`📍 Health: https://whatsapp-nx6i.onrender.com/health`);
});
