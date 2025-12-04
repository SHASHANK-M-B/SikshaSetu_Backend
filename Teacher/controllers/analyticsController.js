const teacherModel = require('../models/teacherModel');
const courseModel = require('../models/courseModel');
const resourceModel = require('../models/resourceModel');
const contentModel = require('../models/contentModel');
const liveSessionModel = require('../models/liveSessionModel');
const quizModel = require('../models/quizModel');
const discussionModel = require('../models/discussionModel');
const { db } = require('../../config/Firebase');

exports.getAnalytics = async (req, res) => {
  try {
    const teacherId = req.user.userId;

    const teacher = await teacherModel.getTeacherById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const [
      courses,
      resources,
      contents,
      liveSessions,
      quizzes,
      discussions
    ] = await Promise.all([
      courseModel.getCoursesByTeacherId(teacherId),
      resourceModel.getResourcesByTeacherId(teacherId),
      contentModel.getContentsByTeacherId(teacherId),
      liveSessionModel.getLiveSessionsByTeacherId(teacherId),
      quizModel.getQuizzesByTeacherId(teacherId),
      discussionModel.getAllDiscussions({})
    ]);

    const activeSessions = liveSessions.filter(s => s.isActive).length;
    const completedSessions = liveSessions.filter(s => s.endedAt).length;

    let totalStudents = 0;
    const enrollmentCollection = db.collection('enrollments');
    const enrollmentsSnapshot = await enrollmentCollection
      .where('teacherId', '==', teacherId)
      .get();
    const uniqueStudents = new Set();
    enrollmentsSnapshot.docs.forEach(doc => {
      uniqueStudents.add(doc.data().studentId);
    });
    totalStudents = uniqueStudents.size;

    let totalQuizAttempts = 0;
    let totalQuizScore = 0;
    let quizScoreCount = 0;

    for (const quiz of quizzes) {
      const responses = await quizModel.getQuizResponsesByQuizId(quiz.quizId);
      totalQuizAttempts += responses.length;
      
      responses.forEach(response => {
        if (response.totalQuestions > 0) {
          const percentage = (response.correctAnswers / response.totalQuestions) * 100;
          totalQuizScore += percentage;
          quizScoreCount++;
        }
      });
    }

    const averageQuizScore = quizScoreCount > 0 ? (totalQuizScore / quizScoreCount).toFixed(2) : 0;

    const unresolvedDiscussions = discussions.filter(d => d.status === 'unresolved').length;
    const resolvedDiscussions = discussions.filter(d => d.status === 'resolved').length;

    let totalSessionParticipants = 0;
    let totalUnderstoodCount = 0;
    liveSessions.forEach(session => {
      if (session.participants) {
        totalSessionParticipants += session.participants.length;
      }
      if (session.understoodCount) {
        totalUnderstoodCount += session.understoodCount;
      }
    });

    const resourcesByType = {};
    resources.forEach(resource => {
      const type = resource.resourceType || 'Other';
      resourcesByType[type] = (resourcesByType[type] || 0) + 1;
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentCourses = courses.filter(c => {
      const createdAt = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return createdAt >= thirtyDaysAgo;
    }).length;

    const recentQuizzes = quizzes.filter(q => {
      const createdAt = q.createdAt?.toDate ? q.createdAt.toDate() : new Date(q.createdAt);
      return createdAt >= thirtyDaysAgo;
    }).length;

    const recentSessions = liveSessions.filter(s => {
      const createdAt = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
      return createdAt >= thirtyDaysAgo;
    }).length;

    const analytics = {
      overview: {
        totalCourses: courses.length,
        totalStudents,
        totalResources: resources.length,
        totalRecordedLectures: contents.length,
        totalLiveSessions: liveSessions.length,
        totalQuizzes: quizzes.length,
        totalDiscussions: discussions.length
      },
      liveSessionStats: {
        activeSessions,
        completedSessions,
        scheduledSessions: liveSessions.length - completedSessions - activeSessions,
        totalParticipants: totalSessionParticipants,
        totalUnderstoodCount,
        averageParticipantsPerSession: liveSessions.length > 0 
          ? (totalSessionParticipants / liveSessions.length).toFixed(2) 
          : 0
      },
      quizStats: {
        totalQuizzes: quizzes.length,
        totalAttempts: totalQuizAttempts,
        averageScore: averageQuizScore,
        averageAttemptsPerQuiz: quizzes.length > 0 
          ? (totalQuizAttempts / quizzes.length).toFixed(2) 
          : 0
      },
      discussionStats: {
        totalDiscussions: discussions.length,
        unresolvedDiscussions,
        resolvedDiscussions,
        resolutionRate: discussions.length > 0 
          ? ((resolvedDiscussions / discussions.length) * 100).toFixed(2) 
          : 0
      },
      resourceStats: {
        totalResources: resources.length,
        byType: resourcesByType
      },
      recentActivity: {
        coursesLast30Days: recentCourses,
        quizzesLast30Days: recentQuizzes,
        sessionsLast30Days: recentSessions
      },
      engagement: {
        averageQuizScore: `${averageQuizScore}%`,
        discussionResolutionRate: `${discussions.length > 0 ? ((resolvedDiscussions / discussions.length) * 100).toFixed(2) : 0}%`,
        sessionParticipationRate: liveSessions.length > 0 && totalStudents > 0
          ? `${((totalSessionParticipants / (liveSessions.length * totalStudents)) * 100).toFixed(2)}%`
          : '0%'
      }
    };

    res.status(200).json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

exports.getCourseAnalytics = async (req, res) => {
  try {
    const teacherId = req.user.userId;
    const { id } = req.params;

    const course = await courseModel.getCourseById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacherId !== teacherId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const [
      resources,
      contents,
      liveSessions,
      quizzes,
      discussions
    ] = await Promise.all([
      resourceModel.getResourcesByCourseId(id),
      contentModel.getContentsByCourseId(id),
      (async () => {
        const allSessions = await liveSessionModel.getLiveSessionsByTeacherId(teacherId);
        return allSessions.filter(s => s.courseId === id);
      })(),
      quizModel.getQuizzesByCourseId(id),
      discussionModel.getAllDiscussions({ courseId: id })
    ]);

    const enrollmentCollection = db.collection('enrollments');
    const enrollmentsSnapshot = await enrollmentCollection
      .where('courseId', '==', id)
      .get();
    const enrolledStudents = enrollmentsSnapshot.size;

    let totalQuizAttempts = 0;
    let totalQuizScore = 0;
    let quizScoreCount = 0;

    for (const quiz of quizzes) {
      const responses = await quizModel.getQuizResponsesByQuizId(quiz.quizId);
      totalQuizAttempts += responses.length;
      
      responses.forEach(response => {
        if (response.totalQuestions > 0) {
          const percentage = (response.correctAnswers / response.totalQuestions) * 100;
          totalQuizScore += percentage;
          quizScoreCount++;
        }
      });
    }

    const averageQuizScore = quizScoreCount > 0 ? (totalQuizScore / quizScoreCount).toFixed(2) : 0;

    const courseAnalytics = {
      courseInfo: {
        courseCode: course.courseCode,
        courseName: course.courseName,
        enrolledStudents
      },
      contentStats: {
        totalResources: resources.length,
        totalRecordedLectures: contents.length,
        totalLiveSessions: liveSessions.length,
        totalQuizzes: quizzes.length
      },
      quizPerformance: {
        totalQuizzes: quizzes.length,
        totalAttempts: totalQuizAttempts,
        averageScore: `${averageQuizScore}%`
      },
      discussionActivity: {
        totalDiscussions: discussions.length,
        unresolved: discussions.filter(d => d.status === 'unresolved').length,
        resolved: discussions.filter(d => d.status === 'resolved').length
      },
      engagement: {
        quizParticipationRate: enrolledStudents > 0 && quizzes.length > 0
          ? `${((totalQuizAttempts / (quizzes.length * enrolledStudents)) * 100).toFixed(2)}%`
          : '0%'
      }
    };

    res.status(200).json({ courseAnalytics });
  } catch (error) {
    console.error('Get course analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch course analytics' });
  }
};