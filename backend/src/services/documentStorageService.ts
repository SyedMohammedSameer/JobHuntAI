import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';
import Resume from '../models/Resume';
import CoverLetter from '../models/CoverLetter';
import { Types } from 'mongoose';

interface SaveDocumentOptions {
  userId: string;
  type: 'resume' | 'coverLetter';
  filePath?: string;
  content?: string;
  metadata?: Record<string, any>;
  jobId?: string;
  resumeId?: string;
}

interface DocumentInfo {
  id: string;
  type: 'resume' | 'coverLetter';
  path?: string;
  content?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

class DocumentStorageService {
  private readonly UPLOAD_DIR: string;
  private readonly TEMP_DIR: string;

  constructor() {
    this.UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads/resumes';
    this.TEMP_DIR = 'uploads/temp';
  }

  /**
   * Ensure storage directories exist
   */
  public ensureDirectories(): void {
    const directories = [
      this.UPLOAD_DIR,
      this.TEMP_DIR,
      'uploads/tailored',
      'uploads/cover-letters'
    ];

    directories.forEach(dir => {
      const fullPath = path.resolve(dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        logger.info('Created directory', { path: fullPath });
      }
    });
  }

  /**
   * Save resume document to database
   */
  public async saveResume(options: {
    userId: string;
    filePath: string;
    originalText: string;
    type: 'BASE' | 'TAILORED';
    jobId?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      const resume = new Resume({
        user: new Types.ObjectId(options.userId),
        type: options.type,
        filePath: options.filePath,
        originalText: options.originalText,
        tailoredContent: options.type === 'TAILORED' ? options.originalText : undefined,
        job: options.jobId ? new Types.ObjectId(options.jobId) : undefined,
        metadata: options.metadata || {},
        version: 1
      });

      await resume.save();

      logger.info('Resume saved to database', {
        userId: options.userId,
        resumeId: resume._id,
        type: options.type
      });

      return resume;
    } catch (error: any) {
      logger.error('Error saving resume to database:', error);
      throw new Error(`Failed to save resume: ${error.message}`);
    }
  }

  /**
   * Save cover letter document to database
   */
  public async saveCoverLetter(options: {
    userId: string;
    jobId: string;
    content: string;
    tone: string;
    resumeId?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    try {
      const coverLetter = new CoverLetter({
        user: new Types.ObjectId(options.userId),
        job: new Types.ObjectId(options.jobId),
        resume: options.resumeId ? new Types.ObjectId(options.resumeId) : undefined,
        content: options.content,
        tone: options.tone,
        generatedByAI: true,
        metadata: options.metadata || {}
      });

      await coverLetter.save();

      logger.info('Cover letter saved to database', {
        userId: options.userId,
        coverLetterId: coverLetter._id,
        jobId: options.jobId
      });

      return coverLetter;
    } catch (error: any) {
      logger.error('Error saving cover letter to database:', error);
      throw new Error(`Failed to save cover letter: ${error.message}`);
    }
  }

  /**
   * Get resume by ID
   */
  public async getResume(resumeId: string, userId?: string): Promise<any> {
    try {
      const query: any = { _id: new Types.ObjectId(resumeId) };
      
      if (userId) {
        query.user = new Types.ObjectId(userId);
      }

      const resume = await Resume.findOne(query).populate('job', 'title company');

      if (!resume) {
        throw new Error('Resume not found');
      }

      return resume;
    } catch (error: any) {
      logger.error('Error getting resume:', error);
      throw new Error(`Failed to get resume: ${error.message}`);
    }
  }

  /**
   * Get cover letter by ID
   */
  public async getCoverLetter(coverLetterId: string, userId?: string): Promise<any> {
    try {
      const query: any = { _id: new Types.ObjectId(coverLetterId) };
      
      if (userId) {
        query.user = new Types.ObjectId(userId);
      }

      const coverLetter = await CoverLetter.findOne(query)
        .populate('job', 'title company')
        .populate('resume', 'type version');

      if (!coverLetter) {
        throw new Error('Cover letter not found');
      }

      return coverLetter;
    } catch (error: any) {
      logger.error('Error getting cover letter:', error);
      throw new Error(`Failed to get cover letter: ${error.message}`);
    }
  }

  /**
   * List user's resumes with pagination
   */
  public async listResumes(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: 'BASE' | 'TAILORED';
    } = {}
  ): Promise<{
    resumes: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const query: any = { user: new Types.ObjectId(userId) };
      
      if (options.type) {
        query.type = options.type;
      }

      const [resumes, total] = await Promise.all([
        Resume.find(query)
          .populate('job', 'title company')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Resume.countDocuments(query)
      ]);

      return {
        resumes,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      logger.error('Error listing resumes:', error);
      throw new Error(`Failed to list resumes: ${error.message}`);
    }
  }

  /**
   * List user's cover letters with pagination
   */
  public async listCoverLetters(
    userId: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    coverLetters: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const query = { user: new Types.ObjectId(userId) };

      const [coverLetters, total] = await Promise.all([
        CoverLetter.find(query)
          .populate('job', 'title company')
          .populate('resume', 'type version')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        CoverLetter.countDocuments(query)
      ]);

      return {
        coverLetters,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      logger.error('Error listing cover letters:', error);
      throw new Error(`Failed to list cover letters: ${error.message}`);
    }
  }

  /**
   * Update resume metadata
   */
  public async updateResume(
    resumeId: string,
    userId: string,
    updates: {
      metadata?: Record<string, any>;
      tailoredContent?: string;
    }
  ): Promise<any> {
    try {
      const resume = await Resume.findOneAndUpdate(
        {
          _id: new Types.ObjectId(resumeId),
          user: new Types.ObjectId(userId)
        },
        {
          $set: updates,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!resume) {
        throw new Error('Resume not found or unauthorized');
      }

      logger.info('Resume updated', { resumeId, userId });
      return resume;
    } catch (error: any) {
      logger.error('Error updating resume:', error);
      throw new Error(`Failed to update resume: ${error.message}`);
    }
  }

  /**
   * Update cover letter content
   */
  public async updateCoverLetter(
    coverLetterId: string,
    userId: string,
    updates: {
      content?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<any> {
    try {
      const coverLetter = await CoverLetter.findOneAndUpdate(
        {
          _id: new Types.ObjectId(coverLetterId),
          user: new Types.ObjectId(userId)
        },
        {
          $set: updates,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!coverLetter) {
        throw new Error('Cover letter not found or unauthorized');
      }

      logger.info('Cover letter updated', { coverLetterId, userId });
      return coverLetter;
    } catch (error: any) {
      logger.error('Error updating cover letter:', error);
      throw new Error(`Failed to update cover letter: ${error.message}`);
    }
  }

  /**
   * Delete resume (soft delete)
   */
  public async deleteResume(resumeId: string, userId: string): Promise<boolean> {
    try {
      const resume = await Resume.findOne({
        _id: new Types.ObjectId(resumeId),
        user: new Types.ObjectId(userId)
      }).lean();

      if (!resume) {
        throw new Error('Resume not found or unauthorized');
      }

      // Delete physical file if exists
      const resumeData = resume as any;
      if (resumeData.filePath && fs.existsSync(resumeData.filePath)) {
        fs.unlinkSync(resumeData.filePath);
        logger.info('Resume file deleted', { filePath: resumeData.filePath });
      }

      // Delete from database
      await Resume.deleteOne({ _id: new Types.ObjectId(resumeId) });

      logger.info('Resume deleted', { resumeId, userId });
      return true;
    } catch (error: any) {
      logger.error('Error deleting resume:', error);
      throw new Error(`Failed to delete resume: ${error.message}`);
    }
  }

  /**
   * Delete cover letter
   */
  public async deleteCoverLetter(coverLetterId: string, userId: string): Promise<boolean> {
    try {
      const result = await CoverLetter.deleteOne({
        _id: new Types.ObjectId(coverLetterId),
        user: new Types.ObjectId(userId)
      });

      if (result.deletedCount === 0) {
        throw new Error('Cover letter not found or unauthorized');
      }

      logger.info('Cover letter deleted', { coverLetterId, userId });
      return true;
    } catch (error: any) {
      logger.error('Error deleting cover letter:', error);
      throw new Error(`Failed to delete cover letter: ${error.message}`);
    }
  }

  /**
   * Get file from filesystem
   */
  public getFileContent(filePath: string): Buffer {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      return fs.readFileSync(filePath);
    } catch (error: any) {
      logger.error('Error reading file:', error);
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * Save file to filesystem
   */
  public saveFile(content: Buffer | string, fileName: string, subdirectory?: string): string {
    try {
      const directory = subdirectory 
        ? path.join(this.UPLOAD_DIR, subdirectory)
        : this.UPLOAD_DIR;

      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      const filePath = path.join(directory, fileName);
      
      if (typeof content === 'string') {
        fs.writeFileSync(filePath, content, 'utf-8');
      } else {
        fs.writeFileSync(filePath, content);
      }

      logger.info('File saved to filesystem', { filePath });
      return filePath;
    } catch (error: any) {
      logger.error('Error saving file:', error);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  /**
   * Generate download URL/path for document
   */
  public generateDownloadPath(documentId: string, type: 'resume' | 'coverLetter'): string {
    // This will be used in controller to construct the download URL
    return `/api/${type === 'resume' ? 'resumes' : 'cover-letters'}/${documentId}/download`;
  }

  /**
   * Get storage statistics for user
   */
  public async getUserStorageStats(userId: string): Promise<{
    totalResumes: number;
    baseResumes: number;
    tailoredResumes: number;
    totalCoverLetters: number;
    storageUsed: number; // in bytes
  }> {
    try {
      const [
        totalResumes,
        baseResumes,
        tailoredResumes,
        totalCoverLetters
      ] = await Promise.all([
        Resume.countDocuments({ user: new Types.ObjectId(userId) }),
        Resume.countDocuments({ user: new Types.ObjectId(userId), type: 'BASE' }),
        Resume.countDocuments({ user: new Types.ObjectId(userId), type: 'TAILORED' }),
        CoverLetter.countDocuments({ user: new Types.ObjectId(userId) })
      ]);

      // Calculate storage used (rough estimate)
      const resumes = await Resume.find({ user: new Types.ObjectId(userId) }).lean();
      let storageUsed = 0;

      resumes.forEach((resume: any) => {
        if (resume.filePath && fs.existsSync(resume.filePath)) {
          const stats = fs.statSync(resume.filePath);
          storageUsed += stats.size;
        }
        // Add text content size
        if (resume.originalText) {
          storageUsed += Buffer.byteLength(resume.originalText, 'utf-8');
        }
        if (resume.tailoredContent) {
          storageUsed += Buffer.byteLength(resume.tailoredContent, 'utf-8');
        }
      });

      return {
        totalResumes,
        baseResumes,
        tailoredResumes,
        totalCoverLetters,
        storageUsed
      };
    } catch (error: any) {
      logger.error('Error getting storage stats:', error);
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }

  /**
   * Clean up orphaned files (files without database records)
   */
  public async cleanupOrphanedFiles(): Promise<number> {
    try {
      let deletedCount = 0;
      const uploadDir = path.resolve(this.UPLOAD_DIR);

      if (!fs.existsSync(uploadDir)) {
        return 0;
      }

      const files = fs.readdirSync(uploadDir);

      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        
        // Check if file has a corresponding database record
        const resumeExists = await Resume.findOne({ filePath });
        
        if (!resumeExists) {
          // File is orphaned, delete it
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info('Deleted orphaned file', { filePath });
        }
      }

      return deletedCount;
    } catch (error: any) {
      logger.error('Error cleaning up orphaned files:', error);
      return 0;
    }
  }
}

// Export singleton instance
export default new DocumentStorageService();