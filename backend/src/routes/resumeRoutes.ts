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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `resume-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const allowedExtensions = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX allowed.'));
    }
  }
});

// ==================== ALL ROUTES REQUIRE AUTHENTICATION ====================
router.use(authenticateToken);

// ==================== SPECIFIC ROUTES FIRST ====================

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload a new resume (PDF or DOCX)
 * @access  Private
 */
router.post('/upload', upload.single('resume'), resumeController.uploadResume);

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes for authenticated user
 * @query   page, limit, type
 * @access  Private
 */
router.get('/', resumeController.getResumes);

// ==================== PARAMETERIZED ROUTES ====================

/**
 * @route   POST /api/resumes/:id/tailor
 * @desc    Tailor resume for specific job using AI
 * @body    { jobId: string }
 * @access  Private
 */
router.post('/:id/tailor', resumeController.tailorResume);

/**
 * @route   GET /api/resumes/:id/download
 * @desc    Download resume file
 * @access  Private
 */
router.get('/:id/download', resumeController.downloadResume);

/**
 * @route   GET /api/resumes/:id
 * @desc    Get single resume by ID
 * @access  Private
 */
router.get('/:id', resumeController.getResumeById);

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

export default router;