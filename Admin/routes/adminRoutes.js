const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/organizations/pending', adminController.getPendingOrganizations);
router.put('/organizations/approve/:id', adminController.approveOrganization);
router.put('/organizations/reject/:id', adminController.rejectOrganization);

router.get('/teachers/pending/:orgId', adminController.getPendingTeachers);
router.put('/teachers/approve/:id', adminController.approveTeacher);
router.put('/teachers/reject/:id', adminController.rejectTeacher);

router.get('/students/pending/:orgId', adminController.getPendingStudents);
router.put('/students/approve/:id', adminController.approveStudent);
router.put('/students/reject/:id', adminController.rejectStudent);

module.exports = router;