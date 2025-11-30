import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  addFeedback,
  incrementDownload
} from '../controllers/resourceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resource-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Validation rules
const resourceValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('fileUrl').notEmpty().withMessage('File URL is required')
];

const feedbackValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim()
];

// Public routes
router.get('/', getAllResources);
router.get('/:id', getResourceById);

// Protected routes
router.post('/:id/feedback', protect, feedbackValidation, addFeedback);
router.put('/:id/download', protect, incrementDownload);

// Admin only routes
router.post('/upload', protect, admin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    res.status(200).json({
      success: true,
      fileUrl: `http://localhost:${process.env.PORT || 5000}${fileUrl}`,
      fileName,
      fileSize,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});
router.post('/', protect, admin, resourceValidation, createResource);
router.put('/:id', protect, admin, resourceValidation, updateResource);
router.delete('/:id', protect, admin, deleteResource);

export default router;
