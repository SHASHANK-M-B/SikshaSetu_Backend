const { admin } = require('../../config/Firebase');
const liveSessionModel = require('../models/liveSessionModel');

exports.getSessionChat = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const session = await liveSessionModel.getLiveSessionById(id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const realtimeDb = admin.database();
    const chatRef = realtimeDb.ref(`liveSessions/${id}/chat`);
    const snapshot = await chatRef.once('value');
    
    const chatMessages = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        chatMessages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
    }

    res.status(200).json({ chat: chatMessages });
  } catch (error) {
    console.error('Get session chat error:', error);
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
};