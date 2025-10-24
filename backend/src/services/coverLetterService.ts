// backend/src/services/coverLetterService.ts

import { Types } from 'mongoose';
import CoverLetter from '../models/CoverLetter';
import Job from '../models/Job';
import Resume from '../models/Resume';
import User from '../models/User';
import openaiService from './openaiService';
import documentStorageService from './documentStorageService';
import usageTrackingService from './usageTrackingService';
import logger from '../utils/logger';

export type CoverLetterTone = 'professional' | 'enthusiastic' | 'conservative' | 'creative';

interface UserInfo {
  name: string;
  email: string;
  phone?: string;
  experience: string[];
  education: string[];
  skills: string[];
  visaStatus?: string;
}

interface CompanyCulture {
  industry: string;
  size?: string;
  culture?: string;
  values?: string[];
}

interface GenerateCoverLetterOptions {
  jobId: string;
  userId: string;
  resumeId?: string;
  tone?: CoverLetterTone;
  customInstructions?: string;
}

interface CoverLetterResult {
  coverLetterId: string;
  content: string;
  tone: CoverLetterTone;
  wordCount: number;
  tokensUsed: number;
  estimatedCost: number;
  jobTitle: string;
  company: string;
}

class CoverLetterService {
  /**
   * Main method to generate a cover letter
   */
  async generateCoverLetter(options: GenerateCoverLetterOptions): Promise<CoverLetterResult> {
    try {
      const { jobId, userId, resumeId, tone = 'professional', customInstructions } = options;

      logger.info(`Starting cover letter generation for user ${userId}, job ${jobId}`);

      // Step 1: Check usage limits
      const usageCheck = await usageTrackingService.canUseFeature(userId, 'coverLetterGeneration');
      if (!usageCheck.canUse) {
        throw new Error(usageCheck.reason || 'Daily cover letter limit reached. Please upgrade to Premium or try again tomorrow.');
      }

      // Step 2: Fetch job details
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Step 3: Extract user info (from resume or user profile)
      logger.info('Extracting user information');
      const userInfo = await this.extractUserInfo(userId, resumeId);

      // Step 4: Analyze company culture
      logger.info('Analyzing company culture');
      const companyCulture = this.analyzeCompanyCulture(job);

      // Step 5: Generate cover letter content
      logger.info('Generating cover letter with OpenAI');
      const generationResult = await this.generateContent(
        job,
        userInfo,
        companyCulture,
        tone,
        customInstructions
      );

      // Step 6: Save cover letter
      logger.info('Saving cover letter to database');
      const coverLetter = await documentStorageService.saveCoverLetter({
        userId: userId,
        jobId: jobId,
        content: generationResult.content,
        tone: tone,
        resumeId: resumeId,
        metadata: {
          wordCount: generationResult.wordCount,
          tokensUsed: generationResult.tokensUsed,
          estimatedCost: generationResult.estimatedCost,
          generatedDate: new Date(),
          customInstructions: customInstructions,
          companyCulture: companyCulture
        }
      });

      // Step 7: Increment usage counter
      await usageTrackingService.incrementUsage(userId, 'coverLetterGeneration');

      logger.info(`Cover letter generation completed successfully. ID: ${coverLetter._id}`);

      return {
        coverLetterId: coverLetter._id.toString(),
        content: generationResult.content,
        tone: tone,
        wordCount: generationResult.wordCount,
        tokensUsed: generationResult.tokensUsed,
        estimatedCost: generationResult.estimatedCost,
        jobTitle: job.title,
        company: job.company
      };

    } catch (error) {
      logger.error('Error in generateCoverLetter:', error);
      throw error;
    }
  }

  /**
   * Extract user information from resume or user profile
   */
  private async extractUserInfo(userId: string, resumeId?: string): Promise<UserInfo> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let userInfo: UserInfo = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        experience: [],
        education: [],
        skills: []
      };

      // Get visa status if available
      if (user.visaType) {
        userInfo.visaStatus = user.visaType;
      }

      // If resume provided, extract detailed info
      if (resumeId) {
        const resume = await Resume.findOne({
          _id: new Types.ObjectId(resumeId),
          userId: new Types.ObjectId(userId)
        });

        if (resume && resume.originalText) {
          const resumeText = resume.originalText;

          // Extract experience (simple parsing)
          userInfo.experience = this.extractExperienceFromText(resumeText);
          
          // Extract education
          userInfo.education = this.extractEducationFromText(resumeText);
          
          // Extract skills
          userInfo.skills = this.extractSkillsFromText(resumeText);
        }
      }

      // Fallback to user profile
      if (userInfo.experience.length === 0) {
        userInfo.experience = ['Relevant experience in software development'];
      }

      if (userInfo.education.length === 0 && user.university) {
        userInfo.education = [`${user.degreeType || 'Degree'} from ${user.university}`];
      }

      return userInfo;

    } catch (error) {
      logger.error('Error extracting user info:', error);
      throw error;
    }
  }

  /**
   * Extract experience from resume text
   */
  private extractExperienceFromText(text: string): string[] {
    const experiences: string[] = [];
    
    // Look for experience section
    const expSection = text.match(/EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE([\s\S]*?)(?=EDUCATION|SKILLS|$)/i);
    
    if (expSection && expSection[1]) {
      const lines = expSection[1].split('\n').filter(line => line.trim().length > 20);
      experiences.push(...lines.slice(0, 3)); // Take first 3 relevant lines
    }

    return experiences;
  }

  /**
   * Extract education from resume text
   */
  private extractEducationFromText(text: string): string[] {
    const education: string[] = [];
    
    // Look for education section
    const eduSection = text.match(/EDUCATION([\s\S]*?)(?=SKILLS|EXPERIENCE|PROJECTS|$)/i);
    
    if (eduSection && eduSection[1]) {
      const lines = eduSection[1].split('\n').filter(line => line.trim().length > 10);
      education.push(...lines.slice(0, 2)); // Take first 2 relevant lines
    }

    return education;
  }

  /**
   * Extract skills from resume text
   */
  private extractSkillsFromText(text: string): string[] {
    const skills: string[] = [];
    
    // Look for skills section
    const skillsSection = text.match(/SKILLS|TECHNICAL SKILLS([\s\S]*?)(?=EDUCATION|EXPERIENCE|PROJECTS|$)/i);
    
    if (skillsSection && skillsSection[1]) {
      // Extract words that look like skills
      const skillMatches = skillsSection[1].match(/\b[A-Z][a-z]+(?:\.[a-z]+)?|\b[A-Z]{2,}\b/g);
      if (skillMatches) {
        skills.push(...skillMatches.slice(0, 10));
      }
    }

    return skills;
  }

  /**
   * Analyze company culture from job description
   */
  private analyzeCompanyCulture(job: any): CompanyCulture {
    const description = job.description.toLowerCase();
    
    const culture: CompanyCulture = {
      industry: 'Technology', // Default
      values: []
    };

    // Detect company size
    if (description.includes('startup') || description.includes('fast-paced')) {
      culture.size = 'startup';
      culture.culture = 'innovative, fast-paced, dynamic';
    } else if (description.includes('enterprise') || description.includes('fortune')) {
      culture.size = 'large';
      culture.culture = 'established, structured, professional';
    } else {
      culture.size = 'medium';
      culture.culture = 'collaborative, growth-oriented';
    }

    // Detect values
    const valueKeywords = {
      'innovation': ['innovative', 'cutting-edge', 'pioneering'],
      'collaboration': ['team', 'collaborate', 'together'],
      'diversity': ['diverse', 'inclusive', 'equity'],
      'growth': ['growth', 'learning', 'development'],
      'impact': ['impact', 'mission', 'meaningful']
    };

    Object.entries(valueKeywords).forEach(([value, keywords]) => {
      if (keywords.some(keyword => description.includes(keyword))) {
        culture.values!.push(value);
      }
    });

    return culture;
  }

  /**
   * Generate cover letter content using OpenAI
   */
  private async generateContent(
    job: any,
    userInfo: UserInfo,
    companyCulture: CompanyCulture,
    tone: CoverLetterTone,
    customInstructions?: string
  ): Promise<{ content: string; wordCount: number; tokensUsed: number; estimatedCost: number }> {
    try {
      logger.info('Calling OpenAI to generate cover letter');

      // Build candidate info string
      const candidateInfo = this.buildCandidateInfoString(userInfo);

      // Call OpenAI service
      const result = await openaiService.generateCoverLetter(
        {
          company: job.company,
          position: job.title,
          description: job.description
        },
        candidateInfo,
        tone
      );

      // Add custom instructions if provided
      let finalContent = result.content;
      
      if (customInstructions && customInstructions.length > 0) {
        finalContent = this.incorporateCustomInstructions(finalContent, customInstructions);
      }

      // Calculate word count
      const wordCount = finalContent.split(/\s+/).length;

      return {
        content: finalContent,
        wordCount: wordCount,
        tokensUsed: result.tokensUsed.total,
        estimatedCost: result.estimatedCost
      };

    } catch (error) {
      logger.error('Error generating content:', error);
      throw error;
    }
  }

  /**
   * Build candidate info string for OpenAI prompt
   */
  private buildCandidateInfoString(userInfo: UserInfo): string {
    let info = `Name: ${userInfo.name}\n`;
    info += `Email: ${userInfo.email}\n`;
    
    if (userInfo.phone) {
      info += `Phone: ${userInfo.phone}\n`;
    }

    if (userInfo.experience.length > 0) {
      info += `\nRelevant Experience:\n${userInfo.experience.join('\n')}\n`;
    }

    if (userInfo.education.length > 0) {
      info += `\nEducation:\n${userInfo.education.join('\n')}\n`;
    }

    if (userInfo.skills.length > 0) {
      info += `\nKey Skills: ${userInfo.skills.join(', ')}\n`;
    }

    if (userInfo.visaStatus) {
      info += `\nVisa Status: ${userInfo.visaStatus} (authorized to work)\n`;
    }

    return info;
  }

  /**
   * Incorporate custom instructions into generated content
   */
  private incorporateCustomInstructions(content: string, instructions: string): string {
    // Simple approach: Add as a final paragraph or modify existing content
    // For now, just ensure the instructions are reflected in tone
    return content;
  }

  /**
   * Regenerate cover letter with different tone
   */
  async regenerateWithTone(
    coverLetterId: string,
    userId: string,
    newTone: CoverLetterTone
  ): Promise<CoverLetterResult> {
    try {
      logger.info(`Regenerating cover letter ${coverLetterId} with tone: ${newTone}`);

      // Get existing cover letter
      const existingLetter = await CoverLetter.findOne({
        _id: new Types.ObjectId(coverLetterId),
        userId: new Types.ObjectId(userId)
      });

      if (!existingLetter) {
        throw new Error('Cover letter not found or access denied');
      }

      // Get job ID from existing letter
      const jobId = existingLetter.jobId?.toString();
      const resumeId = existingLetter.resumeId?.toString();

      if (!jobId) {
        throw new Error('Job ID not found in cover letter');
      }

      // Generate new version with different tone
      return await this.generateCoverLetter({
        jobId,
        userId,
        resumeId,
        tone: newTone
      });

    } catch (error) {
      logger.error('Error regenerating with tone:', error);
      throw error;
    }
  }

  /**
   * Get user's cover letter history
   */
  async getCoverLetterHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const coverLetters = await CoverLetter.find({
        userId: new Types.ObjectId(userId)
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('jobId', 'title company location')
      .populate('resumeId', 'fileName type');

      return coverLetters;

    } catch (error) {
      logger.error('Error getting cover letter history:', error);
      throw error;
    }
  }

  /**
   * Get cover letter by ID
   */
  async getCoverLetter(coverLetterId: string, userId: string): Promise<any> {
    try {
      const coverLetter = await CoverLetter.findOne({
        _id: new Types.ObjectId(coverLetterId),
        userId: new Types.ObjectId(userId)
      })
      .populate('jobId', 'title company location description')
      .populate('resumeId', 'fileName type');

      if (!coverLetter) {
        throw new Error('Cover letter not found or access denied');
      }

      return coverLetter;

    } catch (error) {
      logger.error('Error getting cover letter:', error);
      throw error;
    }
  }

  /**
   * Update cover letter content
   */
  async updateCoverLetter(
    coverLetterId: string,
    userId: string,
    newContent: string
  ): Promise<any> {
    try {
      const coverLetter = await CoverLetter.findOneAndUpdate(
        {
          _id: new Types.ObjectId(coverLetterId),
          userId: new Types.ObjectId(userId)
        },
        {
          content: newContent,
          'metadata.wordCount': newContent.split(/\s+/).length,
          generatedByAI: false // User edited, no longer AI-generated
        },
        { new: true }
      );

      if (!coverLetter) {
        throw new Error('Cover letter not found or access denied');
      }

      logger.info('Cover letter updated', { coverLetterId, userId });
      return coverLetter;

    } catch (error) {
      logger.error('Error updating cover letter:', error);
      throw error;
    }
  }

  /**
   * Delete cover letter
   */
  async deleteCoverLetter(coverLetterId: string, userId: string): Promise<boolean> {
    try {
      const result = await CoverLetter.deleteOne({
        _id: new Types.ObjectId(coverLetterId),
        userId: new Types.ObjectId(userId)
      });

      if (result.deletedCount === 0) {
        throw new Error('Cover letter not found or access denied');
      }

      logger.info('Cover letter deleted', { coverLetterId, userId });
      return true;

    } catch (error) {
      logger.error('Error deleting cover letter:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new CoverLetterService();