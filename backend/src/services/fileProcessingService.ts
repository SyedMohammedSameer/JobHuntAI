import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import logger from '../utils/logger';

// Define Multer File interface manually to avoid type issues
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination?: string;
  filename?: string;
  path?: string;
  size: number;
  buffer?: Buffer;
}

interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    extension: string;
  };
}

interface ExtractedContent {
  text: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    characterCount: number;
    extractedAt: Date;
    fileType: string;
  };
}

class FileProcessingService {
  private readonly MAX_FILE_SIZE: number;
  private readonly ALLOWED_TYPES: string[];
  private readonly UPLOAD_DIR: string;

  constructor() {
    this.MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default
    this.ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 
      'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      .split(',');
    this.UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads/resumes';
  }

  /**
   * Validate uploaded file
   */
  public validateFile(file: UploadedFile): FileValidationResult {
    try {
      // Check if file exists
      if (!file) {
        return {
          valid: false,
          error: 'No file provided'
        };
      }

      // Check file size
      if (file.size > this.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File size exceeds maximum limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`
        };
      }

      // Check file type
      if (!this.ALLOWED_TYPES.includes(file.mimetype)) {
        return {
          valid: false,
          error: `Invalid file type. Allowed types: PDF, DOCX`
        };
      }

      // Check file extension
      const extension = path.extname(file.originalname).toLowerCase();
      const validExtensions = ['.pdf', '.docx'];
      
      if (!validExtensions.includes(extension)) {
        return {
          valid: false,
          error: `Invalid file extension. Allowed: ${validExtensions.join(', ')}`
        };
      }

      // Check if file is empty
      if (file.size === 0) {
        return {
          valid: false,
          error: 'File is empty'
        };
      }

      logger.info('File validation successful', {
        filename: file.originalname,
        size: file.size,
        type: file.mimetype
      });

      return {
        valid: true,
        fileInfo: {
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          extension
        }
      };
    } catch (error: any) {
      logger.error('File validation error:', error);
      return {
        valid: false,
        error: `File validation failed: ${error.message}`
      };
    }
  }

  /**
   * Extract text from PDF file
   */
  public async extractTextFromPDF(filePath: string): Promise<ExtractedContent> {
    try {
      logger.info('Extracting text from PDF', { filePath });

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file buffer
      const dataBuffer = fs.readFileSync(filePath);

      // Parse PDF
      const data = await pdfParse(dataBuffer);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF appears to be empty or text could not be extracted');
      }

      // Clean extracted text
      const cleanedText = this.cleanExtractedText(data.text);

      const metadata = {
        pageCount: data.numpages,
        wordCount: this.countWords(cleanedText),
        characterCount: cleanedText.length,
        extractedAt: new Date(),
        fileType: 'pdf'
      };

      logger.info('PDF text extraction successful', {
        filePath,
        pageCount: metadata.pageCount,
        wordCount: metadata.wordCount
      });

      return {
        text: cleanedText,
        metadata
      };
    } catch (error: any) {
      logger.error('PDF extraction error:', {
        filePath,
        error: error.message
      });
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX file
   */
  public async extractTextFromDOCX(filePath: string): Promise<ExtractedContent> {
    try {
      logger.info('Extracting text from DOCX', { filePath });

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Extract text using mammoth
      const result = await mammoth.extractRawText({ path: filePath });

      if (!result.value || result.value.trim().length === 0) {
        throw new Error('DOCX appears to be empty or text could not be extracted');
      }

      // Clean extracted text
      const cleanedText = this.cleanExtractedText(result.value);

      const metadata = {
        wordCount: this.countWords(cleanedText),
        characterCount: cleanedText.length,
        extractedAt: new Date(),
        fileType: 'docx'
      };

      logger.info('DOCX text extraction successful', {
        filePath,
        wordCount: metadata.wordCount
      });

      return {
        text: cleanedText,
        metadata
      };
    } catch (error: any) {
      logger.error('DOCX extraction error:', {
        filePath,
        error: error.message
      });
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  /**
   * Extract text from file (auto-detect type)
   */
  public async extractText(filePath: string): Promise<ExtractedContent> {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
      case '.pdf':
        return this.extractTextFromPDF(filePath);
      case '.docx':
        return this.extractTextFromDOCX(filePath);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  /**
   * Clean and normalize extracted text
   */
  public cleanExtractedText(text: string): string {
    let cleaned = text;

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Remove multiple blank lines (keep max 2 consecutive newlines)
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Trim leading/trailing whitespace
    cleaned = cleaned.trim();

    // Remove special characters that might cause issues (but keep common punctuation)
    cleaned = cleaned.replace(/[^\w\s.,!?;:()\-–—"'@#$%&*+=\[\]{}|\\/<>\n]/g, '');

    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n');

    // Remove page numbers (common pattern: "Page 1 of 2")
    cleaned = cleaned.replace(/Page \d+ of \d+/gi, '');

    // Remove headers/footers (common patterns)
    cleaned = cleaned.replace(/\n\d+\n/g, '\n'); // Standalone page numbers

    return cleaned;
  }

  /**
   * Count words in text
   */
  public countWords(text: string): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }

    // Split by whitespace and filter out empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Get file metadata without extracting full text
   */
  public async getFileMetadata(filePath: string): Promise<{
    name: string;
    size: number;
    extension: string;
    mimeType: string;
    exists: boolean;
  }> {
    try {
      const stats = fs.statSync(filePath);
      const extension = path.extname(filePath).toLowerCase();
      const name = path.basename(filePath);

      const mimeTypeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };

      return {
        name,
        size: stats.size,
        extension,
        mimeType: mimeTypeMap[extension] || 'application/octet-stream',
        exists: true
      };
    } catch (error: any) {
      logger.error('Error getting file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Ensure upload directory exists
   */
  public ensureUploadDirectory(): void {
    const uploadPath = path.resolve(this.UPLOAD_DIR);
    const tempPath = path.resolve('uploads/temp');

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      logger.info('Created upload directory', { path: uploadPath });
    }

    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
      logger.info('Created temp directory', { path: tempPath });
    }
  }

  /**
   * Delete file safely
   */
  public deleteFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('File deleted successfully', { filePath });
        return true;
      }
      return false;
    } catch (error: any) {
      logger.error('Error deleting file:', {
        filePath,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Generate unique filename
   */
  public generateUniqueFilename(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const sanitizedName = path.basename(originalName, extension)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);

    return `${userId}_${sanitizedName}_${timestamp}_${random}${extension}`;
  }

  /**
   * Check if file is potentially corrupted
   */
  public async isFileCorrupted(filePath: string): Promise<boolean> {
    try {
      const extension = path.extname(filePath).toLowerCase();

      if (extension === '.pdf') {
        // Try to parse PDF
        const dataBuffer = fs.readFileSync(filePath);
        await pdfParse(dataBuffer);
        return false;
      } else if (extension === '.docx') {
        // Try to extract text from DOCX
        await mammoth.extractRawText({ path: filePath });
        return false;
      }

      return false;
    } catch (error) {
      logger.warn('File appears to be corrupted', { filePath, error });
      return true;
    }
  }

  /**
   * Extract key sections from resume text
   */
  public extractResumeSections(text: string): {
    experience?: string;
    education?: string;
    skills?: string;
    summary?: string;
  } {
    const sections: any = {};

    // Common section headers
    const patterns = {
      experience: /(?:EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY|PROFESSIONAL EXPERIENCE)(.*?)(?=EDUCATION|SKILLS|PROJECTS|$)/is,
      education: /(?:EDUCATION|ACADEMIC BACKGROUND)(.*?)(?=EXPERIENCE|SKILLS|PROJECTS|$)/is,
      skills: /(?:SKILLS|TECHNICAL SKILLS|CORE COMPETENCIES)(.*?)(?=EXPERIENCE|EDUCATION|PROJECTS|$)/is,
      summary: /(?:SUMMARY|PROFESSIONAL SUMMARY|PROFILE|OBJECTIVE)(.*?)(?=EXPERIENCE|EDUCATION|SKILLS|$)/is
    };

    for (const [section, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match && match[1]) {
        sections[section] = match[1].trim();
      }
    }

    return sections;
  }
}

// Export singleton instance
export default new FileProcessingService();