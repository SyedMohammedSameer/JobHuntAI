import express from 'express';
import * as coverLetterController from '../controllers/coverLetterController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/cover-letters/generate
 * @desc    Generate a new cover letter using AI
 * @body    { jobId: string, resumeId?: string, tone?: string, customInstructions?: string }
 * @access  Private
 */
router.post('/generate', coverLetterController.generateCoverLetter);

/**
 * @route   GET /api/cover-letters
 * @desc    Get all cover letters for authenticated user
 * @query   page (number) - Page number for pagination (default: 1)
 * @query   limit (number) - Results per page (default: 10)
 * @access  Private
 */
router.get('/', coverLetterController.getCoverLetters);

/**
 * @route   GET /api/cover-letters/:id
 * @desc    Get single cover letter by ID with full content
 * @access  Private
 */
router.get('/:id', coverLetterController.getCoverLetterById);

/**
 * @route   PUT /api/cover-letters/:id
 * @desc    Update cover letter content manually
 * @body    { content: string }
 * @access  Private
 */
router.put('/:id', coverLetterController.updateCoverLetter);

/**
 * @route   POST /api/cover-letters/:id/regenerate
 * @desc    Regenerate cover letter with different tone using AI
 * @body    { tone: string } - Must be: professional, enthusiastic, conservative, or creative
 * @access  Private
 */
router.post('/:id/regenerate', coverLetterController.regenerateCoverLetter);

/**
 * @route   DELETE /api/cover-letters/:id
 * @desc    Delete cover letter
 * @access  Private
 */
router.delete('/:id', coverLetterController.deleteCoverLetter);

/**
 * @route   GET /api/cover-letters/:id/download
 * @desc    Download cover letter as text file
 * @access  Private
 */
router.get('/:id/download', coverLetterController.downloadCoverLetter);

export default router;