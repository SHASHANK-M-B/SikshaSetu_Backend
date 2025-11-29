const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

// Organization Login
router.post('/organization/login', authController.organizationLogin);
router.post('/organization/login/request-otp', authController.organizationRequestOTP);
router.post('/organization/login/verify-otp', authController.organizationVerifyOTP);

// Teacher Login
router.post('/teacher/login', authController.teacherLogin);
router.post('/teacher/login/request-otp', authController.teacherRequestOTP);
router.post('/teacher/login/verify-otp', authController.teacherVerifyOTP);

// Student Login
router.post('/student/login', authController.studentLogin);
router.post('/student/login/request-otp', authController.studentRequestOTP);
router.post('/student/login/verify-otp', authController.studentVerifyOTP);

// Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;