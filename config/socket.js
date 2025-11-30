import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initializeSocket = (server, opts = {}) => {
  io = new Server(server, {
    cors: {
      origin: opts.origin || [process.env.SOCKET_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', '*'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userName = decoded.name;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('socket connected:', socket.id, '- User:', socket.userName);
    
    // Join user's personal room for targeted notifications
    socket.join(`user:${socket.userId}`);
    
    // Join chat room
    socket.on('join_chat', (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${socket.userName} joined chat: ${chatId}`);
    });
    
    // Join room (generic)
    socket.on('joinRoom', (room) => {
      socket.join(room);
      console.log(`User ${socket.userName} joined room: ${room}`);
    });
    
    // Join admin room if admin
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`Admin ${socket.userName} joined admin room`);
    });

    // Typing indicators for chat
    socket.on('typing', ({ chatId, userName }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', { userName });
    });

    socket.on('stop_typing', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_stop_typing');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('socket disconnected:', socket.id, '- User:', socket.userName);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit notification to specific user
export const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user:${userId}`).emit('new_notification', notification);
  }
};

// Emit notification to all admins
export const emitToAdmins = (notification) => {
  if (io) {
    io.to('admin_room').emit('admin_notification', notification);
  }
};

// Emit chat message
export const emitChatMessage = (chatId, message) => {
  if (io) {
    io.to(`chat:${chatId}`).emit('new_message', message);
  }
};

// Broadcast system notification to all users
export const broadcastNotification = (notification) => {
  if (io) {
    io.emit('system_notification', notification);
  }
};
