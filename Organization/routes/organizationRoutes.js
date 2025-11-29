const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');

router.post('/register', organizationController.register);
router.get('/list', organizationController.getApprovedOrganizations);

module.exports = router;