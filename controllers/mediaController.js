/**
 * Media Controller
 * Handles media upload operations
 */

const { uploadFileToFirebase } = require('../utils/firebaseStorage');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * @desc    Upload media to Firebase storage
 * @route   POST /api/media/upload
 * @access  Private/Admin
 */
const uploadMedia = asyncHandler(async (req, res) => {
  try {
    // Check if file exists in the request
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get file buffer and details
    const fileBuffer = req.file.buffer;
    const originalFilename = req.file.originalname;
    const mimeType = req.file.mimetype;

    // Validate file type
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    // Get folder from query params or use default
    const folder = req.query.folder || 'victoria-kids-products';

    // Upload to Firebase
    const downloadUrl = await uploadFileToFirebase(fileBuffer, originalFilename, folder);

    // Return the download URL
    res.status(201).json({
      message: 'File uploaded successfully',
      url: downloadUrl,
      filename: originalFilename,
      type: mimeType
    });
  } catch (error) {
    logger.error('Error in media upload:', error);
    res.status(500).json({ message: 'Failed to upload file', error: error.message });
  }
});

/**
 * @desc    Upload multiple media files to Firebase storage
 * @route   POST /api/media/upload-multiple
 * @access  Private/Admin
 */
const uploadMultipleMedia = asyncHandler(async (req, res) => {
  try {
    // Check if files exist in the request
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Get folder from query params or use default
    const folder = req.query.folder || 'victoria-kids-products';

    // Upload all files to Firebase
    const uploadPromises = req.files.map(async (file) => {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        throw new Error(`File ${file.originalname} is not an image`);
      }

      // Upload file
      const downloadUrl = await uploadFileToFirebase(file.buffer, file.originalname, folder);
      
      return {
        url: downloadUrl,
        filename: file.originalname,
        type: file.mimetype
      };
    });

    // Wait for all uploads to complete
    const uploadedFiles = await Promise.all(uploadPromises);

    // Return the download URLs
    res.status(201).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    logger.error('Error in multiple media upload:', error);
    res.status(500).json({ message: 'Failed to upload files', error: error.message });
  }
});

module.exports = {
  uploadMedia,
  uploadMultipleMedia
};
