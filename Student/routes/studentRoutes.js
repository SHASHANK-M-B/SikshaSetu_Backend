const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorizeRoles } = require('../../Auth/middlewares/authMiddleware');

router.post('/register', studentController.register);
router.get('/subjects', studentController.getSubjects);
router.get('/dashboard', authenticate, authorizeRoles('student'), studentController.getDashboard);

module.exports = router;