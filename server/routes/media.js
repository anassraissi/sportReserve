import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import MediaAsset from '../models/MediaAsset.js';
import { authenticate, authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer storage - organized by entity type (user, ressource)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine entity type based on request
    // If resourceId is provided, it's a resource upload, otherwise it's a user upload
    const entityType = req.body.resourceId ? 'ressource' : 'user';
    const uploadPath = path.join(__dirname, '../uploads', entityType);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const router = express.Router();

// Upload single file
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine entity type for URL
    const entityType = req.body.resourceId ? 'ressource' : 'user';

    const mediaAsset = new MediaAsset({
      resourceId: req.body.resourceId || null,
      userId: req.user._id,
      mediaType: req.body.mediaType || 'image',
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      extension: path.extname(req.file.originalname),
      originalUrl: `/uploads/${entityType}/${req.file.filename}`,
      purpose: req.body.purpose || 'gallery',
      category: req.body.category,
      description: req.body.description,
      altText: req.body.altText,
      uploadedBy: req.user._id,
    });

    await mediaAsset.save();

    res.status(201).json({ message: 'File uploaded', mediaAsset });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload multiple files
router.post('/upload/batch', authenticate, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Determine entity type for URL
    const entityType = req.body.resourceId ? 'ressource' : 'user';

    const mediaAssets = await Promise.all(
      req.files.map(file => {
        const mediaAsset = new MediaAsset({
          resourceId: req.body.resourceId || null,
          userId: req.user._id,
          mediaType: req.body.mediaType || 'image',
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          extension: path.extname(file.originalname),
          originalUrl: `/uploads/${entityType}/${file.filename}`,
          purpose: req.body.purpose || 'gallery',
          uploadedBy: req.user._id,
        });
        return mediaAsset.save();
      })
    );

    res.status(201).json({ message: 'Files uploaded', mediaAssets });
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get media by ID
router.get('/:id', async (req, res) => {
  try {
    const mediaAsset = await MediaAsset.findById(req.params.id)
      .populate('resourceId', 'name')
      .populate('uploadedBy', 'firstName lastName');

    if (!mediaAsset) {
      return res.status(404).json({ message: 'Media asset not found' });
    }

    res.json({ mediaAsset });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get media by resource
router.get('/resource/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { mediaType, purpose, isApproved } = req.query;

    const filter = { resourceId };
    if (mediaType) filter.mediaType = mediaType;
    if (purpose) filter.purpose = purpose;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

    const mediaAssets = await MediaAsset.find(filter)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ isPrimary: -1, createdAt: -1 });

    res.json({ mediaAssets });
  } catch (error) {
    console.error('Get resource media error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete media
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const mediaAsset = await MediaAsset.findById(req.params.id);
    if (!mediaAsset) {
      return res.status(404).json({ message: 'Media asset not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && mediaAsset.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await mediaAsset.deleteOne();

    res.json({ message: 'Media asset deleted' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

