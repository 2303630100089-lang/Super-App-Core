import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5037;

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
app.use(express.json({ limit: '5mb' })); // larger limit for batch events
app.use(mongoSanitize());
app.use(hpp());

app.use('/', analyticsRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Analytics Service is running' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Analytics Service running on port ${PORT}`);
  });
});
