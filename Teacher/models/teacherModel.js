const { db, admin } = require('../../config/Firebase');

const teacherCollection = db.collection('teachers');
const courseCollection = db.collection('courses');
const resourceCollection = db.collection('resources');
const quizCollection = db.collection('quizzes');
const enrollmentCollection = db.collection('enrollments');

const subjectsList = [
  "AI",
  "VLSI",
  "Renewable Energy",
  "Others"
];

const createTeacher = async (teacherData) => {
  const teacherRef = teacherCollection.doc();
  const teacherId = teacherRef.id;

  const teacher = {
    teacherId,
    name: teacherData.name,
    orgId: teacherData.orgId,
    orgCode: teacherData.orgCode,
    subject: teacherData.subject,
    customSubject: teacherData.customSubject || null,
    email: teacherData.email,
    password: null,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await teacherRef.set(teacher);
  return { teacherId, ...teacher };
};

const getTeacherByEmail = async (email) => {
  const snapshot = await teacherCollection.where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

const getTeacherById = async (teacherId) => {
  const doc = await teacherCollection.doc(teacherId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const getPendingTeachersByOrgId = async (orgId) => {
  const snapshot = await teacherCollection
    .where('orgId', '==', orgId)
    .where('status', '==', 'pending')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getApprovedTeachersByOrgId = async (orgId) => {
  const snapshot = await teacherCollection
    .where('orgId', '==', orgId)
    .where('status', '==', 'approved')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const updateTeacherStatus = async (teacherId, status, hashedPassword, plainPassword) => {
  const updateData = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (hashedPassword) updateData.password = hashedPassword;
  if (plainPassword) updateData.plainPassword = plainPassword;

  await teacherCollection.doc(teacherId).update(updateData);
};

const getTeacherStats = async (teacherId) => {
  const teacher = await getTeacherById(teacherId);
  if (!teacher) return null;

  const studentCollection = db.collection('students');
  
  const [coursesSnap, resourcesSnap, quizzesSnap, studentsSnap] = await Promise.all([
    courseCollection.where('teacherId', '==', teacherId).count().get(),
    resourceCollection.where('teacherId', '==', teacherId).count().get(),
    quizCollection.where('teacherId', '==', teacherId).count().get(),
    studentCollection.where('orgId', '==', teacher.orgId).where('status', '==', 'approved').count().get()
  ]);

  return {
    coursesCount: coursesSnap.data().count,
    uploadsCount: resourcesSnap.data().count,
    quizzesCount: quizzesSnap.data().count,
    studentsCount: studentsSnap.data().count
  };
};

module.exports = {
  subjectsList,
  createTeacher,
  getTeacherByEmail,
  getTeacherById,
  getPendingTeachersByOrgId,
  getApprovedTeachersByOrgId,
  updateTeacherStatus,
  getTeacherStats
};