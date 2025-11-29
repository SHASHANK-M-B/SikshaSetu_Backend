const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.post('/register', teacherController.register);
router.get('/subjects', teacherController.getSubjects);

module.exports = router;