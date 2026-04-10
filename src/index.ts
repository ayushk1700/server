import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import messageRoutes from './routes/messageRoutes';
import { requireAuth, rateLimit } from './middlewares/auth';
import { setIo } from './config/socket';

dotenv.config();

// Guard: fail fast if JWT_SECRET is not set
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET env var is not set. Set it in server/.env');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Register the io instance in the singleton BEFORE routes are loaded
setIo(io);

app.use(cors());
app.use(express.json());

// Routes — auth is rate-limited, messages require valid JWT
app.use('/api/auth', rateLimit(10), authRoutes);
app.use('/api/messages', requireAuth, messageRoutes);

// Socket.io for Real-time
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room.`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
