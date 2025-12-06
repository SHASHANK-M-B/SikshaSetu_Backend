const studentModel = require('../models/studentModel');
const quizModel = require('../../Teacher/models/quizModel');
const liveSessionModel = require('../../Teacher/models/liveSessionModel');

exports.getAnalytics = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { range, metric } = req.query;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const { db } = require('../../config/Firebase');

    let startDate;
    const now = new Date();
    
    if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const quizResponses = await quizModel.getQuizResponsesByStudentId(studentId);
    
    const recentResponses = quizResponses.filter(response => {
      const responseDate = response.submittedAt?._seconds 
        ? new Date(response.submittedAt._seconds * 1000) 
        : new Date(response.submittedAt);
      return responseDate >= startDate;
    });

    let attendance = 0;
    const sessionsSnapshot = await db.collection('liveSessions')
      .where('participants', 'array-contains', studentId)
      .get();
    
    const attendedSessions = sessionsSnapshot.docs.filter(doc => {
      const sessionData = doc.data();
      const sessionDate = sessionData.createdAt?._seconds 
        ? new Date(sessionData.createdAt._seconds * 1000) 
        : new Date(sessionData.createdAt);
      return sessionDate >= startDate;
    });

    const totalSessionsSnapshot = await db.collection('liveSessions')
      .where('orgId', '==', student.orgId)
      .get();
    
    const totalRecentSessions = totalSessionsSnapshot.docs.filter(doc => {
      const sessionData = doc.data();
      const sessionDate = sessionData.createdAt?._seconds 
        ? new Date(sessionData.createdAt._seconds * 1000) 
        : new Date(sessionData.createdAt);
      return sessionDate >= startDate;
    });

    if (totalRecentSessions.length > 0) {
      attendance = Math.round((attendedSessions.length / totalRecentSessions.length) * 100);
    }

    let assignments = 0;
    if (recentResponses.length > 0) {
      const totalCorrect = recentResponses.reduce((sum, r) => sum + r.correctAnswers, 0);
      const totalQuestions = recentResponses.reduce((sum, r) => sum + r.totalQuestions, 0);
      assignments = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    }

    const overall = Math.round((attendance + assignments) / 2);

    const days = range === '7d' ? 7 : range === '90d' ? 12 : 4;
    const trend = [];
    const intervalMs = range === '7d' 
      ? 24 * 60 * 60 * 1000 
      : range === '90d' 
        ? 7 * 24 * 60 * 60 * 1000 
        : 7 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < days; i++) {
      const intervalStart = new Date(startDate.getTime() + i * intervalMs);
      const intervalEnd = new Date(intervalStart.getTime() + intervalMs);

      const intervalResponses = recentResponses.filter(response => {
        const responseDate = response.submittedAt?._seconds 
          ? new Date(response.submittedAt._seconds * 1000) 
          : new Date(response.submittedAt);
        return responseDate >= intervalStart && responseDate < intervalEnd;
      });

      let value = 0;
      if (intervalResponses.length > 0) {
        const totalCorrect = intervalResponses.reduce((sum, r) => sum + r.correctAnswers, 0);
        const totalQuestions = intervalResponses.reduce((sum, r) => sum + r.totalQuestions, 0);
        value = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
      }

      const label = range === '7d' 
        ? `Day ${i + 1}` 
        : range === '90d' 
          ? `Week ${i + 1}` 
          : `Week ${i + 1}`;

      trend.push({ label, value });
    }

    const analytics = {
      attendance,
      assignments,
      overall,
      trend,
      stats: {
        totalQuizzes: quizResponses.length,
        recentQuizzes: recentResponses.length,
        totalSessions: attendedSessions.length,
        averageScore: assignments
      }
    };

    if (metric === 'attendance') {
      res.status(200).json({ attendance, trend });
    } else if (metric === 'assignments') {
      res.status(200).json({ assignments, trend });
    } else if (metric === 'overall') {
      res.status(200).json({ overall, trend });
    } else {
      res.status(200).json(analytics);
    }
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};