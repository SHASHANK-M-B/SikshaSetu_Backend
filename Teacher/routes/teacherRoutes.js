const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const courseController = require('../controllers/courseController');
const resourceController = require('../controllers/resourceController');
const contentController = require('../controllers/contentController');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const { authenticate, authorizeRoles } = require('../../Auth/middlewares/authMiddleware');

router.post('/register', teacherController.register);
router.get('/subjects', teacherController.getSubjects);
router.get('/dashboard', authenticate, authorizeRoles('teacher'), teacherController.getDashboard);

router.post('/course', authenticate, authorizeRoles('teacher'), courseController.createCourse);
router.get('/courses', authenticate, authorizeRoles('teacher'), courseController.getCourses);
router.get('/course/:id', authenticate, authorizeRoles('teacher'), courseController.getCourse);
router.put('/course/:id', authenticate, authorizeRoles('teacher'), courseController.updateCourse);
router.delete('/course/:id', authenticate, authorizeRoles('teacher'), courseController.deleteCourse);

router.post('/resource', authenticate, authorizeRoles('teacher'), uploadMiddleware.single('file'), resourceController.uploadResource);
router.get('/resources', authenticate, authorizeRoles('teacher'), resourceController.getResources);
router.get('/resource/:id', authenticate, authorizeRoles('teacher'), resourceController.getResource);
router.put('/resource/:id', authenticate, authorizeRoles('teacher'), resourceController.updateResource);
router.delete('/resource/:id', authenticate, authorizeRoles('teacher'), resourceController.deleteResource);
router.get('/resource-types', resourceController.getResourceTypes);

router.post('/content/upload', authenticate, authorizeRoles('teacher'), uploadMiddleware.fields([
  { name: 'slides', maxCount: 50 },
  { name: 'audio', maxCount: 1 }
]), contentController.uploadContent);
router.get('/content', authenticate, authorizeRoles('teacher'), contentController.getContents);
router.get('/content/:id', authenticate, authorizeRoles('teacher'), contentController.getContent);
router.put('/content/:id', authenticate, authorizeRoles('teacher'), contentController.updateContent);
router.delete('/content/:id', authenticate, authorizeRoles('teacher'), contentController.deleteContent);

module.exports = router;