import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5032;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// General rate limit: 100 requests per 15 minutes
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// Strict rate limit for payment transactions: max 30 per minute
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many payment requests. Please wait before trying again.' },
});
app.use('/transfer', paymentLimiter);
app.use('/qr/pay', paymentLimiter);
app.use('/merchant/pay', paymentLimiter);
app.use('/refund', paymentLimiter);

app.use('/', paymentRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Payment Service is running' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Payment Service running on port ${PORT}`);
  });
});
