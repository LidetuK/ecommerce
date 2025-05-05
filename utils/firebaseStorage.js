const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const logger = require('./logger');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCkJk4gi5Z8uTmvdxA-kJUaJJv0BdjMO98",
  authDomain: "automotive-5f3b5.firebaseapp.com",
  projectId: "automotive-5f3b5",
  storageBucket: "automotive-5f3b5.firebasestorage.app",
  messagingSenderId: "958347590694",
  appId: "1:958347590694:web:748f45eb4a170a21a8fae7",
  measurementId: "G-LX9ZPTD8X3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

/**
 * Upload a file to Firebase Storage
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} originalFilename - Original filename
 * @param {string} folder - Storage folder (optional)
 * @returns {Promise<string>} - Download URL of the uploaded file
 */
const uploadFileToFirebase = async (fileBuffer, originalFilename, folder = 'victoria-kids-products') => {
  try {
    const fileExtension = originalFilename.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;
    
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, fileBuffer);
    
    const downloadUrl = await getDownloadURL(storageRef);
    logger.info(`File uploaded to Firebase: ${filePath}`);
    
    return downloadUrl;
  } catch (error) {
    logger.error('Error uploading file to Firebase:', error);
    throw new Error(`Failed to upload file to Firebase: ${error.message}`);
  }
};

module.exports = {
  uploadFileToFirebase,
  storage
};
