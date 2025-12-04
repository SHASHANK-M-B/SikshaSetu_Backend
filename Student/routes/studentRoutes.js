const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const liveSessionController = require('../controllers/liveSessionController');
const quizController = require('../controllers/quizController');
const discussionController = require('../controllers/discussionController');
const uploadMiddleware = require('../../Teacher/middlewares/uploadMiddleware');
const { authenticate, authorizeRoles } = require('../../Auth/middlewares/authMiddleware');

router.post('/register', studentController.register);
router.get('/subjects', studentController.getSubjects);
router.get('/dashboard', authenticate, authorizeRoles('student'), studentController.getDashboard);

router.get('/live-session/available', authenticate, authorizeRoles('student'), liveSessionController.getAvailableSessions);
router.get('/live-session/all', authenticate, authorizeRoles('student'), liveSessionController.getAllSessions);
router.get('/live-session/:id', authenticate, authorizeRoles('student'), liveSessionController.getSessionDetails);
router.get('/live-session/:id/materials', authenticate, authorizeRoles('student'), liveSessionController.getSessionMaterials);
router.get('/live-session/:id/chat', authenticate, authorizeRoles('student'), liveSessionController.getSessionChat);

router.get('/quizzes', authenticate, authorizeRoles('student'), quizController.getAvailableQuizzes);
router.get('/quiz/:id', authenticate, authorizeRoles('student'), quizController.getQuizForStudent);
router.post('/quiz/:id/submit', authenticate, authorizeRoles('student'), quizController.submitQuiz);
router.get('/quiz-responses', authenticate, authorizeRoles('student'), quizController.getMyQuizResponses);
router.get('/quiz/:id/my-response', authenticate, authorizeRoles('student'), quizController.getMyQuizResponseDetail);

router.post('/discussions', authenticate, authorizeRoles('student'), uploadMiddleware.multiple('files', 5), discussionController.createDiscussion);
router.get('/discussions/my', authenticate, authorizeRoles('student'), discussionController.getMyDiscussions);
router.get('/discussions/all', authenticate, authorizeRoles('student'), discussionController.getAllDiscussions);
router.get('/discussions/:id', authenticate, authorizeRoles('student'), discussionController.getDiscussionThread);
router.post('/discussions/:id/reply', authenticate, authorizeRoles('student'), uploadMiddleware.multiple('files', 5), discussionController.replyToDiscussion);
router.put('/discussions/:id/resolve', authenticate, authorizeRoles('student'), discussionController.markResolved);

module.exports = router;