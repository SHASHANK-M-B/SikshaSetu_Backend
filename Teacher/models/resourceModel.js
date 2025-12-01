const { db, admin } = require('../../config/Firebase');

const resourceCollection = db.collection('resources');

const RESOURCE_TYPES = [
  'PDF Notes',
  'Assignment Sheets',
  'Sample Question Papers',
  'External Reference Links',
  'Images (Diagrams)',
  'AI-Generated Summary Notes'
];

const createResource = async (resourceData) => {
  const resourceRef = resourceCollection.doc();
  const resourceId = resourceRef.id;

  const resource = {
    resourceId,
    teacherId: resourceData.teacherId,
    orgId: resourceData.orgId,
    courseId: resourceData.courseId || null,
    title: resourceData.title,
    resourceType: resourceData.resourceType,
    fileUrl: resourceData.fileUrl,
    filePath: resourceData.filePath,
    filename: resourceData.filename,
    fileSize: resourceData.fileSize,
    mimetype: resourceData.mimetype,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await resourceRef.set(resource);
  return { resourceId, ...resource };
};

const getResourcesByTeacherId = async (teacherId) => {
  const snapshot = await resourceCollection
    .where('teacherId', '==', teacherId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getResourceById = async (resourceId) => {
  const doc = await resourceCollection.doc(resourceId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const updateResource = async (resourceId, updateData) => {
  const data = {
    ...updateData,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await resourceCollection.doc(resourceId).update(data);
};

const deleteResource = async (resourceId) => {
  await resourceCollection.doc(resourceId).delete();
};

const getResourcesByCourseId = async (courseId) => {
  const snapshot = await resourceCollection
    .where('courseId', '==', courseId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

module.exports = {
  RESOURCE_TYPES,
  createResource,
  getResourcesByTeacherId,
  getResourceById,
  updateResource,
  deleteResource,
  getResourcesByCourseId
};