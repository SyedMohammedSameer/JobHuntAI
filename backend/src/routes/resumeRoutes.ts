import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as resumeController from '../controllers/resumeController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Multer configuration for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1 // Only 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const allowedExtensions = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload a new resume (PDF or DOCX)
 * @access  Private
 */
router.post('/upload', upload.single('resume'), resumeController.uploadResume);

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes for authenticated user
 * @query   page (number) - Page number for pagination (default: 1)
 * @query   limit (number) - Results per page (default: 10)
 * @query   type (string) - Filter by type: 'BASE' or 'TAILORED'
 * @access  Private
 */
router.get('/', resumeController.getResumes);

/**
 * @route   GET /api/resumes/:id
 * @desc    Get single resume by ID
 * @access  Private
 */
router.get('/:id', resumeController.getResumeById);

/**
 * @route   POST /api/resumes/:id/tailor
 * @desc    Tailor resume for specific job using AI
 * @body    { jobId: string }
 * @access  Private
 */
router.post('/:id/tailor', resumeController.tailorResume);

/**
 * @route   PUT /api/resumes/:id
 * @desc    Update resume content
 * @body    { content: string, metadata?: object }
 * @access  Private
 */
router.put('/:id', resumeController.updateResume);

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete resume
 * @access  Private
 */
router.delete('/:id', resumeController.deleteResume);

/**
 * @route   GET /api/resumes/:id/download
 * @desc    Download resume file
 * @access  Private
 */
router.get('/:id/download', resumeController.downloadResume);

export default router;