const studentModel = require('../models/studentModel');
const organizationModel = require('../../Organization/models/organizationModel');
const { sendEmail, emailTemplates } = require('../../utils/emailService');

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

exports.register = async (req, res) => {
  try {
    const { studentName, orgCode, subject, email } = req.body;

    if (!studentName || !orgCode || !subject || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const organization = await organizationModel.getOrganizationByOrgCode(orgCode);
    if (!organization) {
      return res.status(400).json({ message: 'Invalid organization code' });
    }

    if (organization.status !== 'approved') {
      return res.status(400).json({ message: 'Organization not approved yet' });
    }

    const existingStudent = await studentModel.getStudentByEmail(email);
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    const student = await studentModel.createStudent({
      studentName,
      orgId: organization.orgId,
      orgCode,
      subject,
      email
    });

    sendEmail(
      email,
      emailTemplates.studentPendingApproval(studentName, organization.orgName).subject,
      emailTemplates.studentPendingApproval(studentName, organization.orgName).html
    ).catch(() => {});

    res.status(201).json({
      message: 'Registration successful. Awaiting organization approval.',
      studentId: student.studentId
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    res.status(200).json({ subjects: studentModel.subjectsList });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const organization = await organizationModel.getOrganizationById(student.orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.status(200).json({
      orgName: organization.orgName,
      studentName: student.studentName,
      subject: student.subject,
      email: student.email,
      quickStats: {
        enrolledCourses: 0,
        completedQuizzes: 0,
        activeSessions: 0
      }
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
};