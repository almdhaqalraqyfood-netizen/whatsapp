const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp Service',
        status: 'running',
        message: '✅ WhatsApp service is ready',
        endpoints: {
            health: '/health',
            qr: '/qr',
            send_otp: '/send-otp (POST)'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/qr', (req, res) => {
    res.json({ 
        status: 'ready',
        message: 'QR code endpoint - WhatsApp integration will be added'
    });
});

app.post('/send-otp', (req, res) => {
    const { phone, otp, name } = req.body;
    
    if (!phone || !otp) {
        return res.status(400).json({
            success: false,
            error: 'Phone and OTP are required'
        });
    }
    
    console.log(`📨 OTP to ${phone}: ${otp} for ${name || 'customer'}`);
    
    res.json({
        success: true,
        message: 'OTP sent successfully',
        phone: phone,
        method: 'whatsapp',
        timestamp: new Date().toISOString()
    });
});

// إضافة endpoint لإرسال رسائل عامة
app.post('/send-message', (req, res) => {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({
            success: false,
            error: 'Phone and message are required'
        });
    }
    
    console.log(`💬 Message to ${phone}: ${message}`);
    
    res.json({
        success: true,
        message: 'Message sent successfully',
        phone: phone,
        method: 'whatsapp'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp Service running on port ${PORT}`);
    console.log(`📍 Base URL: http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
});