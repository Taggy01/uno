import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  setupSocketHandlers(io);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UNO Express + MongoDB Backend running on http://localhost:${PORT}`);
  });

  // Connect to MongoDB asynchronously
  connectDB().catch((err) => {
    console.error(`MongoDB connection error: ${err.message}`);
  });
}

bootstrap();
