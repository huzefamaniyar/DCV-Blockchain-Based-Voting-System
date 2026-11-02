const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join user room for personal notifications
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`Socket ${socket.id} joined user-${userId}`);
    });

    // Join election room for real-time updates
    socket.on('join-election', (electionId) => {
      socket.join(`election-${electionId}`);
      console.log(`Socket ${socket.id} joined election-${electionId}`);
    });

    // Leave election room
    socket.on('leave-election', (electionId) => {
      socket.leave(`election-${electionId}`);
      console.log(`Socket ${socket.id} left election-${electionId}`);
    });

    // Join dashboard for global updates
    socket.on('join-dashboard', () => {
      socket.join('dashboard');
      console.log(`Socket ${socket.id} joined dashboard`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit vote update to all clients watching an election
const emitVoteUpdate = (electionId, data) => {
  if (io) {
    io.to(`election-${electionId}`).emit('vote-cast', {
      electionId,
      ...data,
      timestamp: new Date()
    });
    
    // Also emit to dashboard for global stats
    io.to('dashboard').emit('election-updated', {
      electionId,
      type: 'vote',
      timestamp: new Date()
    });
  }
};

// Emit election status change
const emitElectionStatusChange = (electionId, newStatus) => {
  if (io) {
    io.to(`election-${electionId}`).emit('status-changed', {
      electionId,
      status: newStatus,
      timestamp: new Date()
    });
    
    io.to('dashboard').emit('election-updated', {
      electionId,
      type: 'status-change',
      status: newStatus,
      timestamp: new Date()
    });
  }
};

// Emit new election created
const emitNewElection = (electionData) => {
  if (io) {
    io.to('dashboard').emit('election-created', {
      ...electionData,
      timestamp: new Date()
    });
  }
};

// Emit election deleted
const emitElectionDeleted = (electionId) => {
  if (io) {
    io.to(`election-${electionId}`).emit('election-deleted', {
      electionId,
      timestamp: new Date()
    });
    
    io.to('dashboard').emit('election-updated', {
      electionId,
      type: 'deleted',
      timestamp: new Date()
    });
  }
};

// Emit notification to specific user
const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user-${userId}`).emit('new-notification', {
      ...notification.toObject(),
      timestamp: new Date()
    });
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitVoteUpdate,
  emitElectionStatusChange,
  emitNewElection,
  emitElectionDeleted,
  emitNotification
};
