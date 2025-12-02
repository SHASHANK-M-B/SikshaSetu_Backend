const { db, admin } = require('../../config/Firebase');

const studentCollection = db.collection('students');

const subjectsList = [
  "AI",
  "VLSI",
  "Renewable Energy",
  "Others"
];

const createStudent = async (studentData) => {
  const studentRef = studentCollection.doc();
  const studentId = studentRef.id;

  const student = {
    studentId,
    studentName: studentData.studentName,
    orgId: studentData.orgId,
    orgCode: studentData.orgCode,
    subject: studentData.subject,
    email: studentData.email,
    password: null,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await studentRef.set(student);
  return { studentId, ...student };
};

const getStudentByEmail = async (email) => {
  const snapshot = await studentCollection.where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

const getStudentById = async (studentId) => {
  const doc = await studentCollection.doc(studentId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const getPendingStudentsByOrgId = async (orgId) => {
  const snapshot = await studentCollection
    .where('orgId', '==', orgId)
    .where('status', '==', 'pending')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getApprovedStudentsByOrgId = async (orgId) => {
  const snapshot = await studentCollection
    .where('orgId', '==', orgId)
    .where('status', '==', 'approved')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const updateStudentStatus = async (studentId, status, hashedPassword, plainPassword) => {
  const updateData = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (hashedPassword) updateData.password = hashedPassword;
  if (plainPassword) updateData.plainPassword = plainPassword;

  await studentCollection.doc(studentId).update(updateData);
};

module.exports = {
  subjectsList,
  createStudent,
  getStudentByEmail,
  getStudentById,
  getPendingStudentsByOrgId,
  getApprovedStudentsByOrgId,
  updateStudentStatus
};