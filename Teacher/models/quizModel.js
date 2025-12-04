const { db, admin } = require('../../config/Firebase');

const quizCollection = db.collection('quizzes');
const quizResponseCollection = db.collection('quizResponses');

const createQuiz = async (quizData) => {
  const quizRef = quizCollection.doc();
  const quizId = quizRef.id;

  const quiz = {
    quizId,
    teacherId: quizData.teacherId,
    quizTitle: quizData.quizTitle,
    courseId: quizData.courseId || null,
    timeLimit: quizData.timeLimit || 30,
    questions: quizData.questions || [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await quizRef.set(quiz);
  return { quizId, ...quiz };
};

const getQuizById = async (quizId) => {
  const doc = await quizCollection.doc(quizId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const getQuizzesByTeacherId = async (teacherId) => {
  const snapshot = await quizCollection
    .where('teacherId', '==', teacherId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getQuizzesByCourseId = async (courseId) => {
  const snapshot = await quizCollection
    .where('courseId', '==', courseId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getAllQuizzes = async () => {
  const snapshot = await quizCollection
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const updateQuiz = async (quizId, updateData) => {
  await quizCollection.doc(quizId).update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const deleteQuiz = async (quizId) => {
  await quizCollection.doc(quizId).delete();
};

const createQuizResponse = async (responseData) => {
  const responseRef = quizResponseCollection.doc();
  const responseId = responseRef.id;

  const response = {
    responseId,
    quizId: responseData.quizId,
    studentId: responseData.studentId,
    studentName: responseData.studentName,
    answers: responseData.answers,
    score: responseData.score,
    totalQuestions: responseData.totalQuestions,
    correctAnswers: responseData.correctAnswers,
    submittedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await responseRef.set(response);
  return { responseId, ...response };
};

const getQuizResponsesByQuizId = async (quizId) => {
  const snapshot = await quizResponseCollection
    .where('quizId', '==', quizId)
    .orderBy('submittedAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getQuizResponsesByStudentId = async (studentId) => {
  const snapshot = await quizResponseCollection
    .where('studentId', '==', studentId)
    .orderBy('submittedAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getStudentQuizResponse = async (quizId, studentId) => {
  const snapshot = await quizResponseCollection
    .where('quizId', '==', quizId)
    .where('studentId', '==', studentId)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

const deleteQuizResponse = async (responseId) => {
  await quizResponseCollection.doc(responseId).delete();
};

module.exports = {
  createQuiz,
  getQuizById,
  getQuizzesByTeacherId,
  getQuizzesByCourseId,
  getAllQuizzes,
  updateQuiz,
  deleteQuiz,
  createQuizResponse,
  getQuizResponsesByQuizId,
  getQuizResponsesByStudentId,
  getStudentQuizResponse,
  deleteQuizResponse
};