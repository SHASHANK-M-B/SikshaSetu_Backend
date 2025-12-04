const admin = require('firebase-admin');
require('dotenv').config({ quiet: true });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const bucket = admin.storage().bucket();

module.exports = { admin, db, bucket };