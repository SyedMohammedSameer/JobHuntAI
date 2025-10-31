// backend/src/routes/visaRoutes.ts
// Visa Tracker Routes - Task 3

import express from 'express';
import * as visaController from '../controllers/visaController';
import { authenticateToken } from '../middlewares/auth';

const router = express.Router();

// ==================== ALL ROUTES REQUIRE AUTHENTICATION ====================
router.use(authenticateToken);

// ==================== VISA STATUS ROUTES ====================

/**
 * @route   GET /api/visa/status
 * @desc    Get current visa status and details
 * @access  Private
 */
router.get('/status', visaController.getVisaStatus);

/**
 * @route   PUT /api/visa/update
 * @desc    Update visa information
 * @body    { currentType, startDate, endDate, gracePeriodDays, i20Number, eadNumber, sevisId }
 * @access  Private
 */
router.put('/update', visaController.updateVisaInfo);

/**
 * @route   GET /api/visa/timeline
 * @desc    Get visa history timeline
 * @access  Private
 */
router.get('/timeline', visaController.getVisaTimeline);

/**
 * @route   GET /api/visa/recommendations
 * @desc    Get smart visa recommendations based on status
 * @access  Private
 */
router.get('/recommendations', visaController.getVisaRecommendations);

// ==================== IMPORTANT DATES ROUTES ====================

/**
 * @route   GET /api/visa/important-dates
 * @desc    Get all important dates
 * @access  Private
 */
router.get('/important-dates', visaController.getImportantDates);

/**
 * @route   POST /api/visa/important-dates
 * @desc    Add new important date
 * @body    { type, title, date, reminder, reminderDays, notes }
 * @access  Private
 */
router.post('/important-dates', visaController.addImportantDate);

/**
 * @route   PUT /api/visa/important-dates/:id
 * @desc    Update important date
 * @body    { type, title, date, reminder, reminderDays, notes }
 * @access  Private
 */
router.put('/important-dates/:id', visaController.updateImportantDate);

/**
 * @route   DELETE /api/visa/important-dates/:id
 * @desc    Delete important date
 * @access  Private
 */
router.delete('/important-dates/:id', visaController.deleteImportantDate);

export default router;
