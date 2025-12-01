const { bucket } = require('../../config/Firebase');
const path = require('path');

const uploadToStorage = async (buffer, filename, mimetype, folder = 'resources') => {
  const filePath = `${folder}/${Date.now()}_${filename}`;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
      metadata: {
        firebaseStorageDownloadTokens: generateToken()
      }
    },
    resumable: false
  });

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '01-01-2030'
  });

  return {
    url,
    filePath,
    filename,
    size: buffer.length,
    mimetype
  };
};

const uploadMultipleToStorage = async (files, folder = 'resources') => {
  const uploadPromises = files.map(file => 
    uploadToStorage(file.buffer, file.filename, file.mimetype, folder)
  );
  return await Promise.all(uploadPromises);
};

const deleteFromStorage = async (filePath) => {
  try {
    const file = bucket.file(filePath);
    await file.delete();
    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
};

const deleteMultipleFromStorage = async (filePaths) => {
  const deletePromises = filePaths.map(filePath => deleteFromStorage(filePath));
  return await Promise.all(deletePromises);
};

const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

module.exports = {
  uploadToStorage,
  uploadMultipleToStorage,
  deleteFromStorage,
  deleteMultipleFromStorage
};