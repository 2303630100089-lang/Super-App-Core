import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import socialRoutes from './routes/socialRoutes.js';
import unifiedSocialRoutes from './routes/unifiedSocialRoutes.js';
import { handleErrors } from './utils/errors.js';
import correlationMiddleware from './utils/correlationMiddleware.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5004;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
}));

app.use(correlationMiddleware);
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { status: 'fail', message: 'Too many requests' }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

app.use('/', socialRoutes);
app.use('/unified', unifiedSocialRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Social Service is healthy', correlationId: req.correlationId });
});

app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  next(err);
});

app.use(handleErrors);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 100,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Social Service running on port ${PORT}`);
    });
  });
}

export default app;
