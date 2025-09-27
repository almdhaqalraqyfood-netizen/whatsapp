const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// تحسين الاستجابة للطلبات الأولى
app.use((req, res, next) => {
    console.log(`📨 Request: ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/', (req, res) => {
    res.json({
        service: 'WhatsApp Service',
        status: 'running',
        message: '✅ WhatsApp service is ready',
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
        version: '1.0.0',
        server_time: new Date().toLocaleString('ar-SA')
    });
});

// endpoint للإبقاء نشطاً
app.get('/keep-alive', (req, res) => {
    res.json({ 
        status: 'active', 
        timestamp: new Date().toISOString(),
        message: 'Service keep-alive ping'
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
    
    // محاكاة delay لاختبار الأداء
    setTimeout(() => {
        res.json({
            success: true,
            message: 'OTP sent successfully',
            phone: phone,
            method: 'whatsapp',
            timestamp: new Date().toISOString()
        });
    }, 1000); // delay لمحاكاة الإرسال الحقيقي
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp Service running on port ${PORT}`);
    console.log(`📍 Base URL: https://whatsapp-nx6i.onrender.com`);
    console.log(`📍 Health: https://whatsapp-nx6i.onrender.com/health`);
    
    // رسالة ترحيب عند بدء التشغيل
    console.log('💡 Note: Free instance may take 50s to wake up after inactivity');
});