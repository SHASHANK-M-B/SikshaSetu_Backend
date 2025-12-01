const { db, admin } = require('../../config/Firebase');

const courseCollection = db.collection('courses');

const createCourse = async (courseData) => {
  const courseRef = courseCollection.doc();
  const courseId = courseRef.id;

  const course = {
    courseId,
    teacherId: courseData.teacherId,
    orgId: courseData.orgId,
    courseName: courseData.courseName,
    courseCode: courseData.courseCode,
    shortDescription: courseData.shortDescription,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await courseRef.set(course);
  return { courseId, ...course };
};

const getCoursesByTeacherId = async (teacherId) => {
  const snapshot = await courseCollection
    .where('teacherId', '==', teacherId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getCourseById = async (courseId) => {
  const doc = await courseCollection.doc(courseId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const updateCourse = async (courseId, updateData) => {
  const data = {
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await courseCollection.doc(courseId).update(data);
};

const deleteCourse = async (courseId) => {
  await courseCollection.doc(courseId).delete();
};

const getCourseByCode = async (teacherId, courseCode) => {
  const snapshot = await courseCollection
    .where('teacherId', '==', teacherId)
    .where('courseCode', '==', courseCode)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

module.exports = {
  createCourse,
  getCoursesByTeacherId,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseByCode
};