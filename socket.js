const { Server } = require('socket.io');
const { db, admin } = require('./config/Firebase');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  const liveSessionNamespace = io.of('/live-session');

  liveSessionNamespace.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-session', async ({ sessionId, userId, userName, role }) => {
      try {
        const sessionRef = db.collection('liveSessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();

        if (!sessionDoc.exists) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const session = sessionDoc.data();
        if (!session.isActive) {
          socket.emit('error', { message: 'Session not active' });
          return;
        }

        socket.join(sessionId);
        socket.sessionId = sessionId;
        socket.userId = userId;
        socket.userName = userName;
        socket.role = role;

        if (role === 'student') {
          await sessionRef.update({
            participants: admin.firestore.FieldValue.arrayUnion(userId)
          });
        }

        liveSessionNamespace.to(sessionId).emit('user-joined', {
          userId,
          userName,
          role,
          participantCount: session.participants ? session.participants.length + 1 : 1
        });

        console.log(`${userName} (${role}) joined session ${sessionId}`);
      } catch (error) {
        console.error('Join session error:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    socket.on('webrtc-offer', ({ sessionId, offer, targetSocketId }) => {
      socket.to(targetSocketId).emit('webrtc-offer', {
        offer,
        fromSocketId: socket.id
      });
    });

    socket.on('webrtc-answer', ({ sessionId, answer, targetSocketId }) => {
      socket.to(targetSocketId).emit('webrtc-answer', {
        answer,
        fromSocketId: socket.id
      });
    });

    socket.on('webrtc-ice-candidate', ({ sessionId, candidate, targetSocketId }) => {
      socket.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate,
        fromSocketId: socket.id
      });
    });

    socket.on('request-teacher-stream', ({ sessionId }) => {
      const teacherSockets = Array.from(liveSessionNamespace.sockets.values())
        .filter(s => s.sessionId === sessionId && s.role === 'teacher');

      if (teacherSockets.length > 0) {
        teacherSockets[0].emit('student-requesting-stream', {
          studentSocketId: socket.id
        });
      }
    });

    socket.on('send-chat-message', async ({ sessionId, message }) => {
      try {
        const chatMessage = {
          messageId: Date.now().toString(),
          userId: socket.userId,
          userName: socket.userName,
          role: socket.role,
          message,
          timestamp: new Date().toISOString()
        };

        const realtimeDb = admin.database();
        await realtimeDb.ref(`liveSessions/${sessionId}/chat`).push(chatMessage);

        liveSessionNamespace.to(sessionId).emit('chat-message', chatMessage);
      } catch (error) {
        console.error('Send chat message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('understood', async ({ sessionId }) => {
      try {
        const sessionRef = db.collection('liveSessions').doc(sessionId);
        await sessionRef.update({
          understoodCount: admin.firestore.FieldValue.increment(1)
        });

        const sessionDoc = await sessionRef.get();
        const understoodCount = sessionDoc.data().understoodCount;

        liveSessionNamespace.to(sessionId).emit('understood-count-updated', {
          understoodCount
        });
      } catch (error) {
        console.error('Understood count error:', error);
      }
    });

    socket.on('material-uploaded', ({ sessionId, material }) => {
      liveSessionNamespace.to(sessionId).emit('new-material', material);
    });

    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);

      if (socket.sessionId && socket.userId) {
        liveSessionNamespace.to(socket.sessionId).emit('user-left', {
          userId: socket.userId,
          userName: socket.userName,
          role: socket.role
        });
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };