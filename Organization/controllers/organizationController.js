const organizationModel = require('../models/organizationModel');
const { sendEmail, emailTemplates } = require('../../utils/emailService');
const { authenticate, authorizeRoles } = require('../../Auth/middlewares/authMiddleware');
const teacherModel = require('../../Teacher/models/teacherModel');
const studentModel = require('../../Student/models/studentModel');
const { generatePassword, hashPassword } = require('../../Auth/services/authService');

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

exports.getDashboard = async (req, res) => {
  try {
    const { orgId } = req.user;

    const organization = await organizationModel.getOrganizationById(orgId);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const teachers = await teacherModel.getApprovedTeachersByOrgId(orgId);
    const students = await studentModel.getApprovedStudentsByOrgId(orgId);

    res.status(200).json({
      orgName: organization.orgName,
      totalTeachers: teachers.length,
      totalStudents: students.length,
      activeCourses: 0
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard' });
  }
};

exports.getTeacherRequests = async (req, res) => {
  try {
    const { orgId } = req.user;
    const teachers = await teacherModel.getPendingTeachersByOrgId(orgId);
    res.status(200).json({ teachers });
  } catch (error) {
    console.error('Error fetching teacher requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

exports.approveTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { orgId } = req.user;

    const teacher = await teacherModel.getTeacherById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.orgId !== orgId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (teacher.status !== 'pending') {
      return res.status(400).json({ message: 'Teacher already processed' });
    }

    const organization = await organizationModel.getOrganizationById(orgId);
    const password = generatePassword();
    const hashedPassword = await hashPassword(password);

    await teacherModel.updateTeacherStatus(teacherId, 'approved', hashedPassword);

    const emailContent = emailTemplates.teacherApproved(
      teacher.name,
      organization.orgName,
      teacher.email,
      password
    );
    await sendEmail(teacher.email, emailContent.subject, emailContent.html);

    res.status(200).json({ message: 'Teacher approved successfully' });
  } catch (error) {
    console.error('Teacher approval error:', error);
    res.status(500).json({ message: 'Approval failed' });
  }
};

exports.declineTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { reason } = req.body;
    const { orgId } = req.user;

    const teacher = await teacherModel.getTeacherById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.orgId !== orgId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (teacher.status !== 'pending') {
      return res.status(400).json({ message: 'Teacher already processed' });
    }

    const organization = await organizationModel.getOrganizationById(orgId);

    await teacherModel.updateTeacherStatus(teacherId, 'rejected', null);

    const emailContent = emailTemplates.teacherRejected(teacher.name, organization.orgName, reason);
    await sendEmail(teacher.email, emailContent.subject, emailContent.html);

    res.status(200).json({ message: 'Teacher declined successfully' });
  } catch (error) {
    console.error('Teacher decline error:', error);
    res.status(500).json({ message: 'Decline failed' });
  }
};

exports.getAllTeachers = async (req, res) => {
  try {
    const { orgId } = req.user;
    const teachers = await teacherModel.getApprovedTeachersByOrgId(orgId);
    res.status(200).json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
};

exports.getStudentRequests = async (req, res) => {
  try {
    const { orgId } = req.user;
    const students = await studentModel.getPendingStudentsByOrgId(orgId);
    res.status(200).json({ students });
  } catch (error) {
    console.error('Error fetching student requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
};

exports.approveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { orgId } = req.user;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.orgId !== orgId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (student.status !== 'pending') {
      return res.status(400).json({ message: 'Student already processed' });
    }

    const organization = await organizationModel.getOrganizationById(orgId);
    const password = generatePassword();
    const hashedPassword = await hashPassword(password);

    await studentModel.updateStudentStatus(studentId, 'approved', hashedPassword);

    const emailContent = emailTemplates.studentApproved(
      student.studentName,
      organization.orgName,
      student.email,
      password
    );
    await sendEmail(student.email, emailContent.subject, emailContent.html);

    res.status(200).json({ message: 'Student approved successfully' });
  } catch (error) {
    console.error('Student approval error:', error);
    res.status(500).json({ message: 'Approval failed' });
  }
};

exports.declineStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;
    const { orgId } = req.user;

    const student = await studentModel.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.orgId !== orgId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (student.status !== 'pending') {
      return res.status(400).json({ message: 'Student already processed' });
    }

    const organization = await organizationModel.getOrganizationById(orgId);

    await studentModel.updateStudentStatus(studentId, 'rejected', null);

    const emailContent = emailTemplates.studentRejected(student.studentName, organization.orgName, reason);
    await sendEmail(student.email, emailContent.subject, emailContent.html);

    res.status(200).json({ message: 'Student declined successfully' });
  } catch (error) {
    console.error('Student decline error:', error);
    res.status(500).json({ message: 'Decline failed' });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const { orgId } = req.user;
    const students = await studentModel.getApprovedStudentsByOrgId(orgId);
    res.status(200).json({ students });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};