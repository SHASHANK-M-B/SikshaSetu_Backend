const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
};

const emailTemplates = {
  organizationPendingApproval: (orgName) => ({
    subject: 'Registration Received - Pending Approval',
    html: `
      <h2>Welcome to SikshaSetu!</h2>
      <p>Dear ${orgName},</p>
      <p>Your registration request has been received and is pending admin approval.</p>
      <p>You will receive another email once your organization is reviewed.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  }),

  organizationApproved: (orgName, email, password, orgCode) => ({
    subject: 'Organization Approved - Login Credentials',
    html: `
      <h2>Congratulations!</h2>
      <p>Dear ${orgName},</p>
      <p>Your organization has been approved by the admin.</p>
      <p><strong>Your Login Credentials:</strong></p>
      <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Organization Code:</td>
          <td style="padding: 8px; color: #4CAF50; font-size: 18px;">${orgCode}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Email:</td>
          <td style="padding: 8px;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Password:</td>
          <td style="padding: 8px;">${password}</td>
        </tr>
      </table>
      <p><strong>Important:</strong> Share your Organization Code with teachers and students for registration.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  }),

  organizationRejected: (orgName, reason) => ({
    subject: 'Organization Registration Rejected',
    html: `
      <h2>Registration Update</h2>
      <p>Dear ${orgName},</p>
      <p>We regret to inform you that your organization registration has been rejected.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have questions, please contact our support team.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  }),

  teacherPendingApproval: (name, orgName) => ({
    subject: 'Registration Received - Pending Organization Approval',
    html: `
      <h2>Welcome to SikshaSetu!</h2>
      <p>Dear ${name},</p>
      <p>Your registration request for <strong>${orgName}</strong> has been received and is pending organization approval.</p>
      <p>You will receive another email once your request is reviewed.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  }),

  teacherApproved: (name, orgName, email, password) => ({
    subject: 'Registration Approved - Login Credentials',
    html: `
      <h2>Congratulations!</h2>
      <p>Dear ${name},</p>
      <p>Your registration has been approved by <strong>${orgName}</strong>.</p>
      <p><strong>Your Login Credentials:</strong></p>
      <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Email:</td>
          <td style="padding: 8px;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Password:</td>
          <td style="padding: 8px;">${password}</td>
        </tr>
      </table>
      <p>You can now login to your account.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  }),

  teacherRejected: (name, orgName, reason) => ({
    subject: 'Registration Declined',
    html: `
      <h2>Registration Update</h2>
      <p>Dear ${name},</p>
      <p>Your registration request for <strong>${orgName}</strong> has been declined.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have questions, please contact the organization.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  }),

  studentPendingApproval: (name, orgName) => ({
    subject: 'Registration Received - Pending Organization Approval',
    html: `
      <h2>Welcome to SikshaSetu!</h2>
      <p>Dear ${name},</p>
      <p>Your registration request for <strong>${orgName}</strong> has been received and is pending organization approval.</p>
      <p>You will receive another email once your request is reviewed.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  }),

  studentApproved: (name, orgName, email, password) => ({
    subject: 'Registration Approved - Login Credentials',
    html: `
      <h2>Congratulations!</h2>
      <p>Dear ${name},</p>
      <p>Your registration has been approved by <strong>${orgName}</strong>.</p>
      <p><strong>Your Login Credentials:</strong></p>
      <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Email:</td>
          <td style="padding: 8px;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Password:</td>
          <td style="padding: 8px;">${password}</td>
        </tr>
      </table>
      <p>You can now login to your account.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  }),

  studentRejected: (name, orgName, reason) => ({
    subject: 'Registration Declined',
    html: `
      <h2>Registration Update</h2>
      <p>Dear ${name},</p>
      <p>Your registration request for <strong>${orgName}</strong> has been declined.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>If you have questions, please contact the organization.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  }),

  loginOTP: (name, otp) => ({
    subject: 'Your Login OTP',
    html: `
      <h2>Login OTP</h2>
      <p>Dear ${name},</p>
      <p>Your OTP for login is:</p>
      <h3 style="color: #4CAF50;">${otp}</h3>
      <p>This OTP is valid for 15 minutes.</p>
      <br>
      <p>Best regards,<br>SikshaSetu Team</p>
    `
  })
};

module.exports = { sendEmail, emailTemplates };