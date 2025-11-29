const { db, admin } = require('../../config/Firebase');

const organizationCollection = db.collection('organizations');

const createOrganization = async (orgData) => {
  const orgRef = organizationCollection.doc();
  const orgId = orgRef.id;

  const organization = {
    orgId,
    orgName: orgData.orgName,
    email: orgData.email,
    phone: orgData.phone,
    state: orgData.state,
    city: orgData.city,
    address: orgData.address,
    orgCode: null,
    password: null,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await orgRef.set(organization);
  return { orgId, ...organization };
};

const getOrganizationByEmail = async (email) => {
  const snapshot = await organizationCollection.where('email', '==', email).limit(1).get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

const getOrganizationById = async (orgId) => {
  const doc = await organizationCollection.doc(orgId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const getOrganizationByOrgCode = async (orgCode) => {
  const snapshot = await organizationCollection.where('orgCode', '==', orgCode).limit(1).get();
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

const updateOrganizationStatus = async (orgId, status, orgCode, hashedPassword) => {
  const updateData = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (orgCode) updateData.orgCode = orgCode;
  if (hashedPassword) updateData.password = hashedPassword;

  await organizationCollection.doc(orgId).update(updateData);
};

const getAllPendingOrganizations = async () => {
  const snapshot = await organizationCollection.where('status', '==', 'pending').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const getAllApprovedOrganizations = async () => {
  const snapshot = await organizationCollection.where('status', '==', 'approved').get();
  return snapshot.docs.map(doc => ({ 
    orgId: doc.id, 
    orgName: doc.data().orgName,
    orgCode: doc.data().orgCode
  }));
};

module.exports = {
  createOrganization,
  getOrganizationByEmail,
  getOrganizationById,
  getOrganizationByOrgCode,
  updateOrganizationStatus,
  getAllPendingOrganizations,
  getAllApprovedOrganizations
};