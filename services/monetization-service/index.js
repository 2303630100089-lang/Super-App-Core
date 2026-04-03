import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import connectDB from './config/db.js';
import monetizationRoutes from './routes/monetizationRoutes.js';
import adCampaignRoutes from './routes/adCampaignRoutes.js';
import posRoutes from './routes/posRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5026;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Too many requests, please try again later.' },
});
app.use(limiter);
app.use(express.json());
app.use(mongoSanitize());
app.use(hpp());

app.use('/', monetizationRoutes);
app.use('/ads', adCampaignRoutes);
app.use('/pos', posRoutes);
app.use('/invoices', invoiceRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Monetization Service is running' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Monetization Service running on port ${PORT}`);
  });
});
