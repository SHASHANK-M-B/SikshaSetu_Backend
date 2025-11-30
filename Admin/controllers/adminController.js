const organizationModel = require('../../Organization/models/organizationModel');
const teacherModel = require('../../Teacher/models/teacherModel');
const studentModel = require('../../Student/models/studentModel');
const { generateOrgCode, generatePassword, hashPassword } = require('../../Auth/services/authService');
const { sendEmail, emailTemplates } = require('../../utils/emailService');

exports.getPendingOrganizations = async (req, res) => {
  try {
    const organizations = await organizationModel.getAllPendingOrganizations();
    res.status(200).json({ organizations });
  } catch (error) {
    console.error('Error fetching pending organizations:', error);
    res.status(500).json({ message: 'Failed to fetch pending organizations' });
  }
};

exports.approveOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    const organization = await organizationModel.getOrganizationById(id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (organization.status !== 'pending') {
      return res.status(400).json({ message: 'Organization already processed' });
    }

    const orgCode = generateOrgCode(organization.orgName);
    const password = generatePassword();
    const hashedPassword = await hashPassword(password);

    await Promise.all([
      organizationModel.updateOrganizationStatus(id, 'approved', orgCode, hashedPassword),
      sendEmail(
        organization.email,
        emailTemplates.organizationApproved(
          organization.orgName,
          organization.email,
          password,
          orgCode
        ).subject,
        emailTemplates.organizationApproved(
          organization.orgName,
          organization.email,
          password,
          orgCode
        ).html
      ).catch(() => {})
    ]);

    res.status(200).json({ message: 'Organization approved successfully' });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ message: 'Approval failed' });
  }
};

exports.rejectOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const organization = await organizationModel.getOrganizationById(id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    if (organization.status !== 'pending') {
      return res.status(400).json({ message: 'Organization already processed' });
    }

    await Promise.all([
      organizationModel.updateOrganizationStatus(id, 'rejected', null, null),
      sendEmail(
        organization.email,
        emailTemplates.organizationRejected(organization.orgName, reason).subject,
        emailTemplates.organizationRejected(organization.orgName, reason).html
      ).catch(() => {})
    ]);

    res.status(200).json({ message: 'Organization rejected successfully' });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({ message: 'Rejection failed' });
  }
};

exports.getPendingTeachers = async (req, res) => {
  try {
    const { orgId } = req.params;
    const teachers = await teacherModel.getPendingTeachersByOrgId(orgId);
    res.status(200).json({ teachers });
  } catch (error) {
    console.error('Error fetching pending teachers:', error);
    res.status(500).json({ message: 'Failed to fetch pending teachers' });
  }
};

exports.approveTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await teacherModel.getTeacherById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.status !== 'pending') {
      return res.status(400).json({ message: 'Teacher already processed' });
    }

    const password = generatePassword();
    const [hashedPassword, organization] = await Promise.all([
      hashPassword(password),
      organizationModel.getOrganizationById(teacher.orgId)
    ]);

    await Promise.all([
      teacherModel.updateTeacherStatus(id, 'approved', hashedPassword),
      sendEmail(
        teacher.email,
        emailTemplates.teacherApproved(
          teacher.name,
          organization.orgName,
          teacher.email,
          password
        ).subject,
        emailTemplates.teacherApproved(
          teacher.name,
          organization.orgName,
          teacher.email,
          password
        ).html
      ).catch(() => {})
    ]);

    res.status(200).json({ message: 'Teacher approved successfully' });
  } catch (error) {
    console.error('Teacher approval error:', error);
    res.status(500).json({ message: 'Approval failed' });
  }
};

exports.rejectTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const teacher = await teacherModel.getTeacherById(id);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (teacher.status !== 'pending') {
      return res.status(400).json({ message: 'Teacher already processed' });
    }

    const organization = await organizationModel.getOrganizationById(teacher.orgId);

    await Promise.all([
      teacherModel.updateTeacherStatus(id, 'rejected', null),
      sendEmail(
        teacher.email,
        emailTemplates.teacherRejected(teacher.name, organization.orgName, reason).subject,
        emailTemplates.teacherRejected(teacher.name, organization.orgName, reason).html
      ).catch(() => {})
    ]);

    res.status(200).json({ message: 'Teacher rejected successfully' });
  } catch (error) {
    console.error('Teacher rejection error:', error);
    res.status(500).json({ message: 'Rejection failed' });
  }
};

exports.getPendingStudents = async (req, res) => {
  try {
    const { orgId } = req.params;
    const students = await studentModel.getPendingStudentsByOrgId(orgId);
    res.status(200).json({ students });
  } catch (error) {
    console.error('Error fetching pending students:', error);
    res.status(500).json({ message: 'Failed to fetch pending students' });
  }
};

exports.approveStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await studentModel.getStudentById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.status !== 'pending') {
      return res.status(400).json({ message: 'Student already processed' });
    }

    const password = generatePassword();
    const [hashedPassword, organization] = await Promise.all([
      hashPassword(password),
      organizationModel.getOrganizationById(student.orgId)
    ]);

    await Promise.all([
      studentModel.updateStudentStatus(id, 'approved', hashedPassword),
      sendEmail(
        student.email,
        emailTemplates.studentApproved(
          student.studentName,
          organization.orgName,
          student.email,
          password
        ).subject,
        emailTemplates.studentApproved(
          student.studentName,
          organization.orgName,
          student.email,
          password
        ).html
      ).catch(() => {})
    ]);

    res.status(200).json({ message: 'Student approved successfully' });
  } catch (error) {
    console.error('Student approval error:', error);
    res.status(500).json({ message: 'Approval failed' });
  }
};

exports.rejectStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const student = await studentModel.getStudentById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.status !== 'pending') {
      return res.status(400).json({ message: 'Student already processed' });
    }

    const organization = await organizationModel.getOrganizationById(student.orgId);

    await Promise.all([
      studentModel.updateStudentStatus(id, 'rejected', null),
      sendEmail(
        student.email,
        emailTemplates.studentRejected(student.studentName, organization.orgName, reason).subject,
        emailTemplates.studentRejected(student.studentName, organization.orgName, reason).html
      ).catch(() => {})
    ]);

    res.status(200).json({ message: 'Student rejected successfully' });
  } catch (error) {
    console.error('Student rejection error:', error);
    res.status(500).json({ message: 'Rejection failed' });
  }
};