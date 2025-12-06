const { db, admin } = require('../../config/Firebase');

const liveSessionCollection = db.collection('liveSessions');

const createLiveSession = async (sessionData) => {
  const sessionRef = liveSessionCollection.doc();
  const sessionId = sessionRef.id;

  const session = {
    sessionId,
    teacherId: sessionData.teacherId,
    sessionTitle: sessionData.sessionTitle,
    shortDescription: sessionData.shortDescription,
    courseId: sessionData.courseId || null,
    sessionHeading: sessionData.sessionHeading,
    scheduledDate: sessionData.scheduledDate,
    scheduledTime: sessionData.scheduledTime,
    isActive: false,
    startedAt: null,
    endedAt: null,
    participants: [],
    understoodCount: 0,
    materials: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await sessionRef.set(session);
  return { sessionId, ...session };
};

const getLiveSessionById = async (sessionId) => {
  const doc = await liveSessionCollection.doc(sessionId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const getLiveSessionsByTeacherId = async (teacherId) => {
  const snapshot = await liveSessionCollection
    .where('teacherId', '==', teacherId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const updateLiveSession = async (sessionId, updateData) => {
  await liveSessionCollection.doc(sessionId).update({
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const startLiveSession = async (sessionId) => {
  await liveSessionCollection.doc(sessionId).update({
    isActive: true,
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const endLiveSession = async (sessionId) => {
  await liveSessionCollection.doc(sessionId).update({
    isActive: false,
    endedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const addMaterial = async (sessionId, material) => {
  await liveSessionCollection.doc(sessionId).update({
    materials: admin.firestore.FieldValue.arrayUnion(material),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const addParticipant = async (sessionId, participantId) => {
  await liveSessionCollection.doc(sessionId).update({
    participants: admin.firestore.FieldValue.arrayUnion(participantId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const incrementUnderstoodCount = async (sessionId) => {
  await liveSessionCollection.doc(sessionId).update({
    understoodCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const deleteLiveSession = async (sessionId) => {
  await liveSessionCollection.doc(sessionId).delete();
};

module.exports = {
  createLiveSession,
  getLiveSessionById,
  getLiveSessionsByTeacherId,
  updateLiveSession,
  startLiveSession,
  endLiveSession,
  addMaterial,
  addParticipant,
  incrementUnderstoodCount,
  deleteLiveSession
};