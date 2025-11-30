const teacherModel = require('../models/teacherModel');
const organizationModel = require('../../Organization/models/organizationModel');
const { sendEmail, emailTemplates } = require('../../utils/emailService');

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

exports.register = async (req, res) => {
  try {
    const { name, orgCode, subject, customSubject, email } = req.body;

    if (!name || !orgCode || !subject || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (subject === 'Other' && !customSubject) {
      return res.status(400).json({ message: 'Custom subject is required when "Other" is selected' });
    }

    const organization = await organizationModel.getOrganizationByOrgCode(orgCode);
    if (!organization) {
      return res.status(400).json({ message: 'Invalid organization code' });
    }

    if (organization.status !== 'approved') {
      return res.status(400).json({ message: 'Organization not approved yet' });
    }

    const existingTeacher = await teacherModel.getTeacherByEmail(email);
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher with this email already exists' });
    }

    const teacher = await teacherModel.createTeacher({
      name,
      orgId: organization.orgId,
      orgCode,
      subject,
      customSubject: subject === 'Other' ? customSubject : null,
      email
    });

    sendEmail(
      email,
      emailTemplates.teacherPendingApproval(name, organization.orgName).subject,
      emailTemplates.teacherPendingApproval(name, organization.orgName).html
    ).catch(() => {});

    res.status(201).json({
      message: 'Registration successful. Awaiting organization approval.',
      teacherId: teacher.teacherId
    });
  } catch (error) {
    console.error('Teacher registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    res.status(200).json({ subjects: teacherModel.subjectsList });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};