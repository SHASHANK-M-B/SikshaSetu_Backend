const organizationModel = require('../models/organizationModel');
const { sendEmail, emailTemplates } = require('../../utils/emailService');

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePhone = (phone) => {
  const regex = /^[0-9]{10}$/;
  return regex.test(phone);
};

exports.register = async (req, res) => {
  try {
    const { orgName, email, phone, state, city, address } = req.body;

    if (!orgName || !email || !phone || !state || !city || !address) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!validatePhone(phone)) {
      return res.status(400).json({ message: 'Phone number must be 10 digits' });
    }

    const existingOrg = await organizationModel.getOrganizationByEmail(email);
    if (existingOrg) {
      return res.status(400).json({ message: 'Organization with this email already exists' });
    }

    const organization = await organizationModel.createOrganization({
      orgName,
      email,
      phone,
      state,
      city,
      address
    });

    const emailContent = emailTemplates.organizationPendingApproval(orgName);
    await sendEmail(email, emailContent.subject, emailContent.html);

    res.status(201).json({
      message: 'Registration successful. Awaiting admin approval.',
      orgId: organization.orgId
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.getApprovedOrganizations = async (req, res) => {
  try {
    const organizations = await organizationModel.getAllApprovedOrganizations();
    res.status(200).json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Failed to fetch organizations' });
  }
};