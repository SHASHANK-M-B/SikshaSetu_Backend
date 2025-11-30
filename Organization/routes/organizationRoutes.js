const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { authenticate, authorizeRoles } = require('../../Auth/middlewares/authMiddleware');

router.post('/register', organizationController.register);
router.get('/list', organizationController.getApprovedOrganizations);

router.get('/dashboard', authenticate, authorizeRoles('organization'), organizationController.getDashboard);

router.get('/teachers/requests', authenticate, authorizeRoles('organization'), organizationController.getTeacherRequests);
router.put('/teachers/approve/:teacherId', authenticate, authorizeRoles('organization'), organizationController.approveTeacher);
router.put('/teachers/decline/:teacherId', authenticate, authorizeRoles('organization'), organizationController.declineTeacher);
router.get('/teachers', authenticate, authorizeRoles('organization'), organizationController.getAllTeachers);

router.get('/students/requests', authenticate, authorizeRoles('organization'), organizationController.getStudentRequests);
router.put('/students/approve/:studentId', authenticate, authorizeRoles('organization'), organizationController.approveStudent);
router.put('/students/decline/:studentId', authenticate, authorizeRoles('organization'), organizationController.declineStudent);
router.get('/students', authenticate, authorizeRoles('organization'), organizationController.getAllStudents);

module.exports = router;