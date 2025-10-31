import { Request, Response } from 'express';
import { Types } from 'mongoose';
import logger from '../utils/logger';
import coverLetterService from '../services/coverLetterService';
import usageTrackingService from '../services/usageTrackingService';
import CoverLetter from '../models/CoverLetter';
import Job from '../models/Job';

// Valid tone types
type CoverLetterTone = 'professional' | 'enthusiastic' | 'conservative' | 'creative';

/**
 * Generate Cover Letter - POST /api/cover-letters/generate
 * Generate AI-powered cover letter for a job
 */
export const generateCoverLetter = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { jobId, resumeId, tone, customInstructions } = req.body;

    // Validate required fields
    if (!jobId) {
      res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
      return;
    }

    if (!Types.ObjectId.isValid(jobId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
      return;
    }

    // Validate tone if provided
    const validTones: CoverLetterTone[] = ['professional', 'enthusiastic', 'conservative', 'creative'];
    if (tone && !validTones.includes(tone)) {
      res.status(400).json({
        success: false,
        message: `Invalid tone. Must be one of: ${validTones.join(', ')}`
      });
      return;
    }

    // Validate resumeId if provided
    if (resumeId && !Types.ObjectId.isValid(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID format'
      });
      return;
    }

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    // Check usage limits BEFORE calling AI service
    const usageCheck = await usageTrackingService.canUseFeature(
      userId, // STRING
      'coverLetterGeneration'
    );

    if (!usageCheck.canUse) {
      res.status(429).json({
        success: false,
        message: usageCheck.reason || 'Cover letter generation limit reached',
        limitInfo: {
          feature: 'coverLetterGeneration',
          reason: usageCheck.reason
        }
      });
      return;
    }

    logger.info(`Cover letter generation initiated`, {
      userId,
      jobId,
      tone: tone || 'professional',
      hasResumeId: !!resumeId
    });

    // Call cover letter service
    const result = await coverLetterService.generateCoverLetter({
      jobId,
      userId,
      resumeId,
      tone: tone || 'professional',
      customInstructions
    });

    logger.info(`Cover letter generated successfully`, {
      userId,
      jobId,
      coverLetterId: result.coverLetterId,
      wordCount: result.wordCount,
      tokensUsed: result.tokensUsed
    });

    // Fetch the full cover letter to return
    const coverLetter = await CoverLetter.findById(result.coverLetterId).lean();

    res.status(201).json({
      success: true,
      message: 'Cover letter generated successfully',
      data: {
        coverLetter: {  // ✅ Return full cover letter object
          _id: coverLetter?._id,
          content: result.content,
          jobTitle: result.jobTitle,
          company: result.company,
          tone: result.tone,
          generatedByAI: true,
          aiModel: coverLetter?.aiModel,
          jobId: coverLetter?.jobId,
          resumeId: coverLetter?.resumeId,
          metadata: {
            wordCount: result.wordCount,
            tokensUsed: result.tokensUsed,
            estimatedCost: result.estimatedCost,
            qualityScore: coverLetter?.metadata?.qualityScore
          },
          createdAt: coverLetter?.createdAt,
          updatedAt: coverLetter?.updatedAt
        },
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost
      }
    });

  } catch (error: any) {
    logger.error('Cover letter generation error', {
      userId: req.user?.userId,
      jobId: req.body.jobId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate cover letter. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get Cover Letters - GET /api/cover-letters
 * Get all cover letters for authenticated user with pagination
 */
export const getCoverLetters = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { userId: new Types.ObjectId(userId) };

    // Get cover letters with pagination
    const coverLetters = await CoverLetter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('jobId', 'title company location')
      .populate('resumeId', 'fileName type')
      .lean();

    const totalCount = await CoverLetter.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    logger.info(`Cover letters fetched for user ${userId}`, {
      page,
      limit,
      count: coverLetters.length,
      totalCount
    });

    res.status(200).json({
      success: true,
      data: {
        coverLetters: coverLetters.map(letter => ({
          _id: letter._id,  // ✅ Changed from 'id' to '_id'
          content: letter.content,  // ✅ Added content field
          jobTitle: letter.jobTitle,  // ✅ Added jobTitle
          company: letter.company,  // ✅ Added company
          tone: letter.tone,
          generatedByAI: letter.generatedByAI,
          aiModel: letter.aiModel,
          jobId: letter.jobId,
          resumeId: letter.resumeId,
          metadata: letter.metadata,  // ✅ Added metadata
          createdAt: letter.createdAt,
          updatedAt: letter.updatedAt
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasMore: page < totalPages
        }
      }
    });

  } catch (error: any) {
    logger.error('Get cover letters error', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch cover letters. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get Cover Letter By ID - GET /api/cover-letters/:id
 * Get single cover letter with full content
 */
export const getCoverLetterById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const coverLetterId = req.params.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate cover letter ID
    if (!Types.ObjectId.isValid(coverLetterId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid cover letter ID format'
      });
      return;
    }

    // Get cover letter using service
    const coverLetter = await coverLetterService.getCoverLetter(coverLetterId, userId);

    if (!coverLetter) {
      res.status(404).json({
        success: false,
        message: 'Cover letter not found'
      });
      return;
    }

    logger.info(`Cover letter fetched`, {
      userId,
      coverLetterId,
      tone: coverLetter.tone
    });

    res.status(200).json({
      success: true,
      data: {
        id: coverLetter._id,
        content: coverLetter.content,
        tone: coverLetter.tone,
        generatedByAI: coverLetter.generatedByAI,
        jobTitle: coverLetter.jobTitle,
        company: coverLetter.company,
        jobId: coverLetter.jobId,
        jobDetails: coverLetter.jobId,
        resumeId: coverLetter.resumeId,
        metadata: coverLetter.metadata,
        createdAt: coverLetter.createdAt,
        updatedAt: coverLetter.updatedAt
      }
    });

  } catch (error: any) {
    logger.error('Get cover letter by ID error', {
      userId: req.user?.userId,
      coverLetterId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch cover letter. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update Cover Letter - PUT /api/cover-letters/:id
 * Update cover letter content manually
 */
export const updateCoverLetter = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const coverLetterId = req.params.id;
    const { content } = req.body;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate cover letter ID
    if (!Types.ObjectId.isValid(coverLetterId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid cover letter ID format'
      });
      return;
    }

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Cover letter content is required'
      });
      return;
    }

    // Update using service
    const updatedLetter = await coverLetterService.updateCoverLetter(
      coverLetterId,
      userId,
      content
    );

    logger.info(`Cover letter updated`, {
      userId,
      coverLetterId,
      contentLength: content.length
    });

    res.status(200).json({
      success: true,
      message: 'Cover letter updated successfully',
      data: {
        id: updatedLetter._id,
        content: updatedLetter.content,
        tone: updatedLetter.tone,
        generatedByAI: updatedLetter.generatedByAI,
        wordCount: updatedLetter.metadata?.wordCount,
        updatedAt: updatedLetter.updatedAt
      }
    });

  } catch (error: any) {
    logger.error('Cover letter update error', {
      userId: req.user?.userId,
      coverLetterId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update cover letter. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Regenerate Cover Letter - POST /api/cover-letters/:id/regenerate
 * Regenerate cover letter with different tone using AI
 */
export const regenerateCoverLetter = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const coverLetterId = req.params.id;
    const { tone } = req.body;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate cover letter ID
    if (!Types.ObjectId.isValid(coverLetterId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid cover letter ID format'
      });
      return;
    }

    // Validate tone
    const validTones: CoverLetterTone[] = ['professional', 'enthusiastic', 'conservative', 'creative'];
    if (!tone || !validTones.includes(tone)) {
      res.status(400).json({
        success: false,
        message: `Tone is required. Must be one of: ${validTones.join(', ')}`
      });
      return;
    }

    // Check usage limits BEFORE calling AI service
    const usageCheck = await usageTrackingService.canUseFeature(
      userId, // STRING
      'coverLetterGeneration'
    );

    if (!usageCheck.canUse) {
      res.status(429).json({
        success: false,
        message: usageCheck.reason || 'Cover letter generation limit reached',
        limitInfo: {
          feature: 'coverLetterGeneration',
          reason: usageCheck.reason
        }
      });
      return;
    }

    logger.info(`Cover letter regeneration initiated`, {
      userId,
      coverLetterId,
      newTone: tone
    });

    // Regenerate with new tone
    const result = await coverLetterService.regenerateWithTone(
      coverLetterId,
      userId,
      tone
    );

    logger.info(`Cover letter regenerated successfully`, {
      userId,
      originalCoverLetterId: coverLetterId,
      newCoverLetterId: result.coverLetterId,
      tone: result.tone,
      tokensUsed: result.tokensUsed
    });

    res.status(200).json({
      success: true,
      message: 'Cover letter regenerated successfully',
      data: {
        coverLetterId: result.coverLetterId,
        content: result.content,
        tone: result.tone,
        wordCount: result.wordCount,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
        jobDetails: {
          title: result.jobTitle,
          company: result.company
        }
      }
    });

  } catch (error: any) {
    logger.error('Cover letter regeneration error', {
      userId: req.user?.userId,
      coverLetterId: req.params.id,
      tone: req.body.tone,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to regenerate cover letter. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete Cover Letter - DELETE /api/cover-letters/:id
 * Delete cover letter from database
 */
export const deleteCoverLetter = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const coverLetterId = req.params.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate cover letter ID
    if (!Types.ObjectId.isValid(coverLetterId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid cover letter ID format'
      });
      return;
    }

    // Delete using service
    await coverLetterService.deleteCoverLetter(coverLetterId, userId);

    logger.info(`Cover letter deleted successfully`, {
      userId,
      coverLetterId
    });

    res.status(200).json({
      success: true,
      message: 'Cover letter deleted successfully',
      data: {
        deletedCoverLetterId: coverLetterId
      }
    });

  } catch (error: any) {
    logger.error('Cover letter delete error', {
      userId: req.user?.userId,
      coverLetterId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete cover letter. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Download Cover Letter - GET /api/cover-letters/:id/download
 * Download cover letter as text/document file
 */
export const downloadCoverLetter = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const coverLetterId = req.params.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate cover letter ID
    if (!Types.ObjectId.isValid(coverLetterId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid cover letter ID format'
      });
      return;
    }

    // Get cover letter using service
    const coverLetter = await coverLetterService.getCoverLetter(coverLetterId, userId);

    if (!coverLetter) {
      res.status(404).json({
        success: false,
        message: 'Cover letter not found'
      });
      return;
    }

    // Generate filename
    const sanitizedCompany = coverLetter.company.replace(/[^a-z0-9]/gi, '_');
    const sanitizedTitle = coverLetter.jobTitle.replace(/[^a-z0-9]/gi, '_');
    const filename = `CoverLetter_${sanitizedCompany}_${sanitizedTitle}.txt`;

    // Set headers for download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(coverLetter.content, 'utf-8'));

    // Send content
    res.send(coverLetter.content);

    logger.info(`Cover letter downloaded`, {
      userId,
      coverLetterId,
      filename
    });

  } catch (error: any) {
    logger.error('Cover letter download error', {
      userId: req.user?.userId,
      coverLetterId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download cover letter. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};