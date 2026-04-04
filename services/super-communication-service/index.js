import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { correlationMiddleware } from './middleware/correlation.js';
import { errorMiddleware } from './middleware/errors.js';
import SuperMessage from './models/SuperMessage.js';
import profileRoutes from './routes/profileRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import privacyRoutes from './routes/privacyRoutes.js';
import engagementRoutes from './routes/engagementRoutes.js';
import callRoutes from './routes/callRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import infoRoutes from './routes/infoRoutes.js';
import serverRoutes from './routes/serverRoutes.js';
import liveRoutes from './routes/liveRoutes.js';

import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5028;

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
app.use(correlationMiddleware);

// Routes
app.use('/profile', profileRoutes);
app.use('/chat', chatRoutes);
app.use('/group', groupRoutes);
app.use('/channel', channelRoutes);
app.use('/status', statusRoutes);
app.use('/invite', inviteRoutes);
app.use('/roles', roleRoutes);
app.use('/privacy', privacyRoutes);
app.use('/engagement', engagementRoutes);
app.use('/call', callRoutes);
app.use('/business', businessRoutes);
app.use('/info', infoRoutes);
app.use('/server', serverRoutes);
app.use('/live', liveRoutes);

// Fallbacks for direct gateway calls
app.use('/api/super-comm/profile', profileRoutes);
app.use('/api/super-comm/chat', chatRoutes);
app.use('/api/super-comm/group', groupRoutes);
app.use('/api/super-comm/channel', channelRoutes);
app.use('/api/super-comm/business', businessRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Super Communication Service is running' });
});

app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  err.statusCode = 404;
  next(err);
});

// Error Handling
app.use(errorMiddleware);

// Phase AI8: Background Job to delete expired messages
setInterval(async () => {
  try {
    const result = await SuperMessage.deleteMany({
      expiryTime: { $lte: new Date() }
    });
    if (result.deletedCount > 0) {
      console.log(`🗑️ Deleted ${result.deletedCount} expired disappearing messages.`);
    }
  } catch (err) {
    console.error('Error deleting expired messages:', err);
  }
}, 60000); // Check every minute

// Background Job: dispatch scheduled channel/group messages
import Channel from './models/Channel.js';
setInterval(async () => {
  try {
    const due = await SuperMessage.find({ isSent: false, scheduledAt: { $lte: new Date() } });
    for (const msg of due) {
      msg.isSent = true;
      await msg.save();
      await Channel.findByIdAndUpdate(msg.chatId, { lastMessageAt: new Date() }).catch(() => {});
    }
    if (due.length > 0) console.log(`📨 Dispatched ${due.length} scheduled channel messages.`);
  } catch (err) {
    console.error('Error dispatching scheduled channel messages:', err);
  }
}, 30000); // Check every 30 seconds

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Super Communication Service running on port ${PORT}`);
  });

  const io = new Server(server, {
    pingTimeout: 60000,
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true },
  });

  io.on('connection', (socket) => {
    console.log('connected to super-communication socket');

    socket.on('setup', (userData) => {
      socket.join(userData.id);
      socket.emit('connected');
    });

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
      console.log('User Joined Chat: ' + chatId);
    });

    socket.on('new_message', (message) => {
      socket.in(message.chatId).emit('message_received', message);
    });

    socket.on('typing', (data) => {
      socket.in(data.chatId).emit('typing', data);
    });

    socket.on('stop_typing', (data) => {
      socket.in(data.chatId).emit('stop_typing', data);
    });

    socket.on('message_read', (data) => {
      socket.in(data.chatId).emit('read_receipt', data);
    });

    // Phase C7: WebRTC Call Signaling
    socket.on('call_user', (data) => {
      const { userToCall, signalData, from, name } = data;
      io.to(userToCall).emit('incoming_call', { signal: signalData, from, name });
    });

    socket.on('answer_call', (data) => {
      const { to, signal } = data;
      io.to(to).emit('call_accepted', signal);
    });

    socket.on('end_call', (data) => {
      const { to } = data;
      io.to(to).emit('call_ended');
    });

    socket.on('disconnect', () => {
      console.log('USER DISCONNECTED');
    });
  });
});
