const { db, admin } = require('../../config/Firebase');

const discussionCollection = db.collection('discussions');
const discussionReplyCollection = db.collection('discussionReplies');

const createDiscussion = async (discussionData) => {
  const discussionRef = discussionCollection.doc();
  const discussionId = discussionRef.id;

  const discussion = {
    discussionId,
    studentId: discussionData.studentId,
    studentName: discussionData.studentName,
    courseId: discussionData.courseId || null,
    subject: discussionData.subject,
    title: discussionData.title,
    description: discussionData.description,
    attachments: discussionData.attachments || [],
    status: 'unresolved',
    replyCount: 0,
    lastReplyAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await discussionRef.set(discussion);
  return { discussionId, ...discussion };
};

const getDiscussionById = async (discussionId) => {
  const doc = await discussionCollection.doc(discussionId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const getAllDiscussions = async (filters = {}) => {
  let query = discussionCollection.orderBy('createdAt', 'desc');

  if (filters.courseId) {
    query = query.where('courseId', '==', filters.courseId);
  }

  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }

  if (filters.studentId) {
    query = query.where('studentId', '==', filters.studentId);
  }

  const snapshot = await query.limit(100).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const updateDiscussionStatus = async (discussionId, status) => {
  await discussionCollection.doc(discussionId).update({
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const incrementReplyCount = async (discussionId) => {
  await discussionCollection.doc(discussionId).update({
    replyCount: admin.firestore.FieldValue.increment(1),
    lastReplyAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

const deleteDiscussion = async (discussionId) => {
  await discussionCollection.doc(discussionId).delete();
};

const createReply = async (replyData) => {
  const replyRef = discussionReplyCollection.doc();
  const replyId = replyRef.id;

  const reply = {
    replyId,
    discussionId: replyData.discussionId,
    userId: replyData.userId,
    userName: replyData.userName,
    role: replyData.role,
    messageText: replyData.messageText,
    attachments: replyData.attachments || [],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await replyRef.set(reply);
  await incrementReplyCount(replyData.discussionId);
  
  return { replyId, ...reply };
};

const getRepliesByDiscussionId = async (discussionId) => {
  const snapshot = await discussionReplyCollection
    .where('discussionId', '==', discussionId)
    .orderBy('createdAt', 'asc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const deleteReply = async (replyId) => {
  await discussionReplyCollection.doc(replyId).delete();
};

module.exports = {
  createDiscussion,
  getDiscussionById,
  getAllDiscussions,
  updateDiscussionStatus,
  deleteDiscussion,
  createReply,
  getRepliesByDiscussionId,
  deleteReply
};