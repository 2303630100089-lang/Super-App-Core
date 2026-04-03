import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import apicache from 'apicache';
import compression from 'compression';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(compression());

// Initialize cache
const cache = apicache.options({
  appendKey: (req, res) => req.user ? req.user.id : 'guest',
  statusCodes: { include: [200, 201] }
}).middleware;

const cacheMiddleware = (duration) => (req, res, next) => {
  if (req.method === 'GET') {
    return cache(duration)(req, res, next);
  }
  next();
};

// ==========================================
// MIDDLEWARE
// ==========================================

const correlationMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
};

app.use(correlationMiddleware);

// ==========================================
// SECURITY HEADERS & CORS
// ==========================================

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id']
}));

app.use(morgan('dev'));
app.use(cookieParser());

// ==========================================
// PROXY SETTINGS
// ==========================================

const proxyOptions = {
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-Correlation-Id', req.correlationId);
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
      }
      fixRequestBody(proxyReq, req, res);
    },
};

// ==========================================
// PUBLIC ROUTES
// ==========================================

app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  pathRewrite: { '^/api/auth': '' },
  ...proxyOptions
}));

// ==========================================
// AUTHENTICATION MIDDLEWARE (Local JWT)
// ==========================================

const authenticateToken = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return res.status(401).json({ 
    success: false, 
    errorCode: 'ACCESS_DENIED', 
    message: 'Access denied, no token provided',
    correlationId: req.correlationId
  });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ 
      success: false, 
      errorCode: 'INVALID_TOKEN', 
      message: 'Invalid or expired token',
      correlationId: req.correlationId
    });
    req.user = user;
    next();
  });
};

// ==========================================
// PROTECTED ROUTES
// ==========================================

app.use('/api/users', authenticateToken, cacheMiddleware('30 seconds'), createProxyMiddleware({
  target: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  pathRewrite: { '^/api/users': '' },
  ...proxyOptions
}));

app.use('/api/chats', authenticateToken, createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || 'http://localhost:5003',
  pathRewrite: { '^/api/chats': '/chats' },
  ws: true,
  ...proxyOptions
}));

app.use('/api/snaps', authenticateToken, createProxyMiddleware({
  target: process.env.SNAP_SERVICE_URL || 'http://localhost:5031',
  pathRewrite: { '^/api/snaps': '' },
  ...proxyOptions
}));

app.use('/api/social', authenticateToken, cacheMiddleware('30 seconds'), createProxyMiddleware({
  target: process.env.SOCIAL_SERVICE_URL || 'http://localhost:5004',
  pathRewrite: { '^/api/social': '' },
  ...proxyOptions
}));

app.use('/api/dashboard', authenticateToken, cacheMiddleware('30 seconds'), createProxyMiddleware({
  target: process.env.DASHBOARD_SERVICE_URL || 'http://localhost:5014',
  pathRewrite: { '^/api/dashboard': '' },
  ...proxyOptions
}));

app.use('/api/settings', authenticateToken, createProxyMiddleware({
  target: process.env.SETTINGS_SERVICE_URL || 'http://localhost:5027',
  pathRewrite: { '^/api/settings': '' },
  ...proxyOptions
}));

app.use('/api/notifications', authenticateToken, createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5013',
    pathRewrite: { '^/api/notifications': '' },
    ...proxyOptions
}));

app.use('/api/wallet', authenticateToken, createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:5032',
  pathRewrite: { '^/api/wallet': '' },
  ...proxyOptions
}));

app.use('/api/marketplace', authenticateToken, cacheMiddleware('30 seconds'), createProxyMiddleware({
  target: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:5008',
  pathRewrite: { '^/api/marketplace': '' },
  ...proxyOptions
}));

app.use('/api/cart', authenticateToken, createProxyMiddleware({
  target: process.env.CART_SERVICE_URL || 'http://localhost:5035',
  pathRewrite: { '^/api/cart': '' },
  ...proxyOptions
}));

app.use('/api/orders', authenticateToken, createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL || 'http://localhost:5036',
  pathRewrite: { '^/api/orders': '' },
  ...proxyOptions
}));

app.use('/api/rides', authenticateToken, createProxyMiddleware({
  target: process.env.RIDE_SERVICE_URL || 'http://localhost:5009',
  pathRewrite: { '^/api/rides': '' },
  ...proxyOptions
}));

app.use('/api/food', authenticateToken, cacheMiddleware('30 seconds'), createProxyMiddleware({
  target: process.env.FOOD_SERVICE_URL || 'http://localhost:5010',
  pathRewrite: { '^/api/food': '' },
  ...proxyOptions
}));

app.use('/api/hotels', authenticateToken, cacheMiddleware('30 seconds'), createProxyMiddleware({
  target: process.env.HOTEL_SERVICE_URL || 'http://localhost:5021',
  pathRewrite: { '^/api/hotels': '' },
  ...proxyOptions
}));

app.use('/api/dating', authenticateToken, cacheMiddleware('30 seconds'), createProxyMiddleware({
  target: process.env.DATING_SERVICE_URL || 'http://localhost:5007',
  pathRewrite: { '^/api/dating': '/api/dating' },
  ...proxyOptions
}));

app.use('/api/professional', authenticateToken, createProxyMiddleware({
  target: process.env.PROFESSIONAL_SERVICE_URL || 'http://localhost:5006',
  pathRewrite: { '^/api/professional': '' },
  ...proxyOptions
}));

app.use('/api/productivity', authenticateToken, createProxyMiddleware({
  target: process.env.PRODUCTIVITY_SERVICE_URL || 'http://localhost:5011',
  pathRewrite: { '^/api/productivity': '' },
  ...proxyOptions
}));

app.use('/api/ai', authenticateToken, createProxyMiddleware({
  target: process.env.AI_SERVICE_URL || 'http://localhost:5033',
  pathRewrite: { '^/api/ai': '' },
  ...proxyOptions
}));

app.use('/api/super-comm', authenticateToken, createProxyMiddleware({
  target: process.env.SUPER_COMMUNICATION_SERVICE_URL || 'http://localhost:5028',
  pathRewrite: { '^/api/super-comm': '' },
  ws: true,
  ...proxyOptions
}));

app.use('/api/search', authenticateToken, createProxyMiddleware({
  target: process.env.GLOBAL_SEARCH_SERVICE_URL || 'http://localhost:5025',
  pathRewrite: { '^/api/search': '' },
  ...proxyOptions
}));

app.use('/api/advanced-interactions', authenticateToken, createProxyMiddleware({
  target: process.env.ADVANCED_INTERACTIONS_SERVICE_URL || 'http://localhost:5029',
  pathRewrite: { '^/api/advanced-interactions': '' },
  ...proxyOptions
}));

app.use('/api/mini-apps', authenticateToken, createProxyMiddleware({
  target: process.env.MINI_APP_SERVICE_URL || 'http://localhost:5016',
  pathRewrite: { '^/api/mini-apps': '' },
  ...proxyOptions
}));

app.use('/api/games', authenticateToken, createProxyMiddleware({
  target: process.env.GAME_SERVICE_URL || 'http://localhost:5012',
  pathRewrite: { '^/api/games': '' },
  ws: true,
  ...proxyOptions
}));

app.use('/api/business-dashboard', authenticateToken, createProxyMiddleware({
  target: process.env.BUSINESS_DASHBOARD_SERVICE_URL || 'http://localhost:5034',
  pathRewrite: { '^/api/business-dashboard': '' },
  ...proxyOptions
}));

app.use('/api/monetization', authenticateToken, createProxyMiddleware({
  target: process.env.MONETIZATION_SERVICE_URL || 'http://localhost:5026',
  pathRewrite: { '^/api/monetization': '' },
  ...proxyOptions
}));

app.use('/api/developer', authenticateToken, createProxyMiddleware({
  target: process.env.DEVELOPER_PLATFORM_SERVICE_URL || 'http://localhost:5038',
  pathRewrite: { '^/api/developer': '' },
  ...proxyOptions
}));

app.use('/api/economy', authenticateToken, createProxyMiddleware({
  target: process.env.ECONOMY_SERVICE_URL || 'http://localhost:5022',
  pathRewrite: { '^/api/economy': '' },
  ...proxyOptions
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'API Gateway is online', 
    documentation: '/health',
    frontend: 'http://localhost:3000'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT} (Using Local MongoDB Auth)`);
});
