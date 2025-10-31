import { Request, Response } from 'express';
import { Types } from 'mongoose';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';
import fileProcessingService from '../services/fileProcessingService';
import documentStorageService from '../services/documentStorageService';
import resumeTailoringService from '../services/resumeTailoringService';
import usageTrackingService from '../services/usageTrackingService';
import Resume from '../models/Resume';
import Job from '../models/Job';

/**
 * Upload Resume - POST /api/resumes/upload
 * Accepts PDF/DOCX file, validates, extracts text, and saves to database
 */
export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded. Please provide a PDF or DOCX file.'
      });
      return;
    }

    const file = req.file;
    logger.info(`Resume upload initiated for user ${userId}`, {
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype
    });

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      // Clean up temp file
      fs.unlinkSync(file.path);
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF and DOCX files are allowed.'
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      fs.unlinkSync(file.path);
      res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
      return;
    }

    // Extract text from file using fileProcessingService
    const extractionResult = await fileProcessingService.extractText(file.path);
    
    if (!extractionResult.text || extractionResult.text.trim().length === 0) {
      fs.unlinkSync(file.path);
      res.status(400).json({
        success: false,
        message: 'Could not extract text from file. The file may be corrupted or empty.'
      });
      return;
    }

    // Move file from temp to permanent storage
    const uploadsDir = path.join(__dirname, '../../uploads/resumes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueFileName = `${Date.now()}-${file.originalname}`;
    const permanentPath = path.join(uploadsDir, uniqueFileName);
    fs.renameSync(file.path, permanentPath);

    // Save to database using documentStorageService
    // FIXED: Pass fileName in metadata, not as direct parameter
    const resume = await documentStorageService.saveResume({
      userId: userId, // STRING
      filePath: permanentPath,
      originalText: extractionResult.text,
      type: 'BASE',
      metadata: {
        fileName: file.originalname, // ✅ fileName goes in metadata
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadDate: new Date(),
        ...extractionResult.metadata
      }
    });

    logger.info(`Resume uploaded successfully`, {
      userId,
      resumeId: resume._id,
      fileName: file.originalname,
      textLength: extractionResult.text.length
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resume: {
          _id: resume._id,  // ✅ Return full resume object
          fileName: resume.fileName,
          type: resume.type,
          originalText: resume.originalText,
          createdAt: resume.createdAt,
          updatedAt: resume.updatedAt,
          metadata: resume.metadata
        }
      }
    });

  } catch (error: any) {
    logger.error('Resume upload error', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    // Clean up temp file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload resume. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get Resumes - GET /api/resumes
 * Get all resumes for authenticated user with pagination and filtering
 */
export const getResumes = async (req: Request, res: Response): Promise<void> => {
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
    const type = req.query.type as string; // 'BASE' or 'TAILORED'
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (type && ['BASE', 'TAILORED'].includes(type)) {
      filter.type = type;
    }

    // Get resumes with pagination
    const resumes = await Resume.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('jobId', 'title company location')
      .lean();

    const totalCount = await Resume.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    logger.info(`Resumes fetched for user ${userId}`, {
      page,
      limit,
      type,
      count: resumes.length,
      totalCount
    });

    res.status(200).json({
      success: true,
      data: {
        resumes: resumes.map(resume => ({
          _id: resume._id,  // ✅ Changed from 'id' to '_id'
          fileName: resume.fileName,
          type: resume.type,
          originalText: resume.originalText,  // ✅ Added for viewing
          tailoredContent: resume.tailoredContent,  // ✅ Added for viewing
          jobId: resume.jobId,
          jobDetails: (resume as any).jobId ? {
            title: (resume as any).jobId.title,
            company: (resume as any).jobId.company,
            location: (resume as any).jobId.location
          } : null,
          createdAt: resume.createdAt,
          updatedAt: resume.updatedAt,
          metadata: resume.metadata
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
    logger.error('Get resumes error', {
      userId: req.user?.userId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch resumes. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get Resume By ID - GET /api/resumes/:id
 * Get single resume details with ownership verification
 */
export const getResumeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const resumeId = req.params.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate resume ID
    if (!Types.ObjectId.isValid(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID format'
      });
      return;
    }

    // Get resume and verify ownership
    const resume = await Resume.findById(resumeId)
      .populate('jobId', 'title company location description requirements')
      .lean();

    if (!resume) {
      res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
      return;
    }

    // Verify ownership
    if (resume.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this resume.'
      });
      return;
    }

    logger.info(`Resume fetched`, {
      userId,
      resumeId,
      type: resume.type
    });

    res.status(200).json({
      success: true,
      data: {
        id: resume._id,
        fileName: resume.fileName,
        filePath: resume.filePath,
        originalText: resume.originalText,
        type: resume.type,
        jobId: resume.jobId,
        jobDetails: (resume as any).jobId,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
        metadata: resume.metadata
      }
    });

  } catch (error: any) {
    logger.error('Get resume by ID error', {
      userId: req.user?.userId,
      resumeId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch resume. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Tailor Resume - POST /api/resumes/:id/tailor
 * Tailor resume for specific job using AI
 */
export const tailorResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const resumeId = req.params.id;
    const { jobId } = req.body;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate IDs
    if (!Types.ObjectId.isValid(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID format'
      });
      return;
    }

    if (!jobId || !Types.ObjectId.isValid(jobId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid or missing job ID'
      });
      return;
    }

    // Verify resume ownership
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
      return;
    }

    if (resume.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this resume.'
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
      userId, // Pass as STRING
      'resumeTailoring'
    );

    if (!usageCheck.canUse) {
      res.status(429).json({
        success: false,
        message: usageCheck.reason || 'Resume tailoring limit reached',
        limitInfo: {
          feature: 'resumeTailoring',
          reason: usageCheck.reason
        }
      });
      return;
    }

    logger.info(`Resume tailoring initiated`, {
      userId,
      resumeId,
      jobId,
      jobTitle: job.title,
      company: job.company
    });

    // Call resume tailoring service
    // FIXED: Pass as STRINGS (service expects string parameters)
    const tailoringResult = await resumeTailoringService.tailorResumeForJob(
      resumeId,
      jobId,
      userId
    );

    // Fetch the newly created tailored resume to get fileName
    const tailoredResume = await Resume.findById(tailoringResult.resumeId);

    logger.info(`Resume tailored successfully`, {
      userId,
      resumeId,
      jobId,
      tailoredResumeId: tailoringResult.resumeId,
      atsScore: tailoringResult.atsScore.overallScore,
      tokensUsed: tailoringResult.tokensUsed
    });

    res.status(200).json({
      success: true,
      message: 'Resume tailored successfully',
      data: {
        resume: {  // ✅ Return full resume object to match frontend
          _id: tailoredResume?._id,
          fileName: tailoredResume?.fileName || 'tailored_resume.pdf',
          type: tailoredResume?.type || 'TAILORED',
          originalText: tailoredResume?.originalText,
          tailoredContent: tailoredResume?.tailoredContent,
          createdAt: tailoredResume?.createdAt,
          updatedAt: tailoredResume?.updatedAt,
          metadata: tailoredResume?.metadata
        },
        tokensUsed: tailoringResult.tokensUsed,
        estimatedCost: tailoringResult.estimatedCost,
        atsScore: tailoringResult.atsScore.overallScore,
        atsBreakdown: {
          overall: tailoringResult.atsScore.overallScore,
          keywordMatch: tailoringResult.atsScore.keywordMatch,
          skillsMatch: tailoringResult.atsScore.skillsMatch,
          experienceMatch: tailoringResult.atsScore.experienceMatch,
          educationMatch: tailoringResult.atsScore.educationMatch
        },
        matchedKeywords: tailoringResult.atsScore.matchedKeywords.slice(0, 10),
        missingKeywords: tailoringResult.atsScore.missingKeywords.slice(0, 5),
        improvements: tailoringResult.improvements,
        jobDetails: {
          title: job.title,
          company: job.company,
          location: job.location
        }
      }
    });

  } catch (error: any) {
    logger.error('Resume tailoring error', {
      userId: req.user?.userId,
      resumeId: req.params.id,
      jobId: req.body.jobId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to tailor resume. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update Resume - PUT /api/resumes/:id
 * Update resume content manually
 */
/**
 * Update Resume - PUT /api/resumes/:id
 * Update resume content manually
 */
export const updateResume = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const resumeId = req.params.id;
      const { content } = req.body;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }
  
      // Validate resume ID
      if (!Types.ObjectId.isValid(resumeId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid resume ID format'
        });
        return;
      }
  
      // Validate content
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Resume content is required'
        });
        return;
      }
  
      // Get resume and verify ownership
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
        return;
      }
  
      if (resume.userId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resume.'
        });
        return;
      }
  
      // Update ONLY the content field using findByIdAndUpdate
      // This bypasses the strict metadata validation
      const updatedResume = await Resume.findByIdAndUpdate(
        resumeId,
        {
          $set: {
            originalText: content,
            'metadata.lastModified': new Date()
          }
        },
        { 
          new: true,
          runValidators: false  // Skip validation to avoid metadata issues
        }
      );
  
      logger.info(`Resume updated`, {
        userId,
        resumeId,
        contentLength: content.length
      });
  
      res.status(200).json({
        success: true,
        message: 'Resume updated successfully',
        data: {
          id: updatedResume!._id,
          fileName: updatedResume!.fileName,
          type: updatedResume!.type,
          updatedAt: updatedResume!.updatedAt,
          contentLength: content.length
        }
      });
  
    } catch (error: any) {
      logger.error('Resume update error', {
        userId: req.user?.userId,
        resumeId: req.params.id,
        error: error.message,
        stack: error.stack
      });
  
      res.status(500).json({
        success: false,
        message: 'Failed to update resume. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

/**
 * Delete Resume - DELETE /api/resumes/:id
 * Delete resume from database and filesystem
 */
export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const resumeId = req.params.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate resume ID
    if (!Types.ObjectId.isValid(resumeId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid resume ID format'
      });
      return;
    }

    // Get resume and verify ownership
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
      return;
    }

    if (resume.userId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this resume.'
      });
      return;
    }

    // Delete file from filesystem
    if (resume.filePath && fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
      logger.info(`Resume file deleted from filesystem`, {
        userId,
        resumeId,
        filePath: resume.filePath
      });
    }

    // Delete from database
    await Resume.findByIdAndDelete(resumeId);

    logger.info(`Resume deleted successfully`, {
      userId,
      resumeId,
      fileName: resume.fileName
    });

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully',
      data: {
        deletedResumeId: resumeId
      }
    });

  } catch (error: any) {
    logger.error('Resume delete error', {
      userId: req.user?.userId,
      resumeId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to delete resume. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Download Resume - GET /api/resumes/:id/download
 * Download resume file with proper headers
 */
/**
 * Download Resume - GET /api/resumes/:id/download
 * Download resume file with proper headers
 */
export const downloadResume = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const resumeId = req.params.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }
  
      // Validate resume ID
      if (!Types.ObjectId.isValid(resumeId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid resume ID format'
        });
        return;
      }
  
      // Get resume and verify ownership
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        res.status(404).json({
          success: false,
          message: 'Resume not found'
        });
        return;
      }
  
      if (resume.userId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You do not own this resume.'
        });
        return;
      }
  
      // Check if physical file exists
      const fileExists = resume.filePath && fs.existsSync(resume.filePath);
  
      // For TAILORED resumes or resumes without physical files, 
      // return the text content as a .txt file
      if (resume.type === 'TAILORED' || !fileExists) {
        // Generate filename
        const sanitizedFileName = resume.fileName
          .replace(/\.[^/.]+$/, '') // Remove extension
          .replace(/[^a-z0-9]/gi, '_'); // Replace special chars
        const filename = `${sanitizedFileName}.txt`;
  
        // Set headers for text download
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(resume.originalText, 'utf-8'));
  
        // Send text content
        res.send(resume.originalText);
  
        logger.info(`Resume downloaded as text`, {
          userId,
          resumeId,
          fileName: filename,
          type: resume.type
        });
  
        return;
      }
  
      // For BASE resumes with physical files, stream the actual file
      // Determine content type
      const ext = path.extname(resume.fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (ext === '.docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
  
      // Set headers for file download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
      res.setHeader('Content-Length', fs.statSync(resume.filePath).size);
  
      // Stream file to response
      const fileStream = fs.createReadStream(resume.filePath);
      fileStream.pipe(res);
  
      fileStream.on('end', () => {
        logger.info(`Resume file downloaded`, {
          userId,
          resumeId,
          fileName: resume.fileName,
          type: resume.type
        });
      });
  
      fileStream.on('error', (error) => {
        logger.error('Resume download stream error', {
          userId,
          resumeId,
          error: error.message
        });
        
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to download resume'
          });
        }
      });
  
    } catch (error: any) {
      logger.error('Resume download error', {
        userId: req.user?.userId,
        resumeId: req.params.id,
        error: error.message,
        stack: error.stack
      });
  
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to download resume. Please try again.',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    }
  };