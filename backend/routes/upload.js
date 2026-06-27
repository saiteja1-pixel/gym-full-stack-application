const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const supabase = require('../utils/supabase');
const { authenticateJWT } = require('../middleware/auth');

// Configure multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit: 5MB
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (JPEG/JPG/PNG) and PDFs are allowed.'));
  }
});

// Helper to upload file buffer to Supabase bucket
async function uploadToSupabase(bucketName, file) {
  const fileExt = path.extname(file.originalname).toLowerCase();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) {
    throw error;
  }

  // Get public URL for public bucket (like avatars) or return path
  if (bucketName === 'avatars') {
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  } else {
    // For private bucket (like id-proofs), return the reference path
    return filePath;
  }
}

// POST /api/upload/avatar — Authenticated user can upload an avatar
router.post('/avatar', authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const publicUrl = await uploadToSupabase('avatars', req.file);
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Failed to upload avatar.', details: err.message });
  }
});

// POST /api/upload/id-proof — Authenticated user can upload id-proof
router.post('/id-proof', authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const filePath = await uploadToSupabase('id-proofs', req.file);
    res.json({ success: true, url: filePath }); // return path as the reference url
  } catch (err) {
    console.error('ID proof upload error:', err);
    res.status(500).json({ error: 'Failed to upload ID proof.', details: err.message });
  }
});

module.exports = router;
