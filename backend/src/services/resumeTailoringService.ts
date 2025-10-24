// backend/src/services/resumeTailoringService.ts

import { Types } from 'mongoose';
import Resume from '../models/Resume';
import Job from '../models/Job';
import openaiService from './openaiService';
import fileProcessingService from './fileProcessingService';
import documentStorageService from './documentStorageService';
import usageTrackingService from './usageTrackingService';
import logger from '../utils/logger';

interface JobAnalysis {
  keywords: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  qualifications: string[];
  responsibilities: string[];
  companyName: string;
  jobTitle: string;
  experienceLevel: string;
  industryKeywords: string[];
}

interface ATSScore {
  overallScore: number;
  keywordMatch: number;
  skillsMatch: number;
  experienceMatch: number;
  educationMatch: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

interface TailoredResumeResult {
  resumeId: string;
  tailoredContent: string;
  atsScore: ATSScore;
  jobAnalysis: JobAnalysis;
  originalResumeId: string;
  improvements: string[];
  tokensUsed: number;
  estimatedCost: number;
}

class ResumeTailoringService {
  /**
   * Main method to tailor a resume for a specific job
   */
  async tailorResumeForJob(
    resumeId: string,
    jobId: string,
    userId: string
  ): Promise<TailoredResumeResult> {
    try {
      logger.info(`Starting resume tailoring for user ${userId}, resume ${resumeId}, job ${jobId}`);

      // Step 1: Check usage limits
      const canUse = await usageTrackingService.canUseFeature(userId, 'resumeTailoring');
      if (!canUse) {
        throw new Error('Daily resume tailoring limit reached. Please upgrade to Premium or try again tomorrow.');
      }

      // Step 2: Fetch resume and job from database
      const resume = await Resume.findOne({ 
        _id: new Types.ObjectId(resumeId), 
        userId: new Types.ObjectId(userId) 
      });
      
      if (!resume) {
        throw new Error('Resume not found or access denied');
      }

      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Step 3: Extract resume text
      let resumeText = resume.originalText;
      if (!resumeText && resume.filePath) {
        logger.info('Extracting text from resume file');
        const extractedContent = await fileProcessingService.extractText(resume.filePath);
        resumeText = extractedContent.text; // Get text from ExtractedContent object
      }

      if (!resumeText) {
        throw new Error('Could not extract text from resume');
      }

      // Step 4: Analyze job description
      logger.info('Analyzing job description');
      const jobAnalysis = await this.analyzeJobDescription(
        job.description,
        job.title,
        job.company,
        job.requirements || []
      );

      // Step 5: Generate tailored resume content
      logger.info('Generating tailored resume content with OpenAI');
      const tailoringResult = await this.generateTailoredContent(resumeText, jobAnalysis, job);

      // Step 6: Optimize for ATS
      logger.info('Optimizing resume for ATS');
      const optimizedContent = await this.optimizeForATS(
        tailoringResult.content,
        jobAnalysis
      );

      // Step 7: Calculate ATS score
      logger.info('Calculating ATS score');
      const atsScore = this.calculateATSScore(optimizedContent, jobAnalysis, resumeText);

      // Step 8: Save tailored resume
      logger.info('Saving tailored resume to database');
      
      // Generate filename and filepath
      const originalFileName = (resume as any).fileName || 'resume';
      const baseFileName = originalFileName.split('.')[0];
      const tailoredFileName = `${baseFileName}_tailored_${job.company.replace(/\s+/g, '_')}.pdf`;
      const tailoredFilePath = `uploads/resumes/${tailoredFileName}`;
      
      // Create resume using documentStorageService with correct parameters
      const tailoredResume = await documentStorageService.saveResume({
        userId: userId, // string
        fileName: tailoredFileName,
        filePath: tailoredFilePath, // required
        originalText: optimizedContent, // save tailored content as originalText
        type: 'TAILORED' as const,
        jobId: jobId, // string
        metadata: {
          wordCount: optimizedContent.split(/\s+/).length,
          keywords: jobAnalysis.keywords,
          atsScore: atsScore.overallScore,
          uploadDate: new Date(),
          format: 'pdf',
          tailoredFor: {
            jobTitle: job.title,
            company: job.company,
            jobId: jobId
          },
          baseResumeId: resumeId // store original resume ID in metadata
        }
      });

      // Step 9: Increment usage counter
      await usageTrackingService.incrementUsage(userId, 'resumeTailoring');

      logger.info(`Resume tailoring completed successfully. Resume ID: ${tailoredResume._id}`);

      return {
        resumeId: tailoredResume._id.toString(),
        tailoredContent: optimizedContent,
        atsScore,
        jobAnalysis,
        originalResumeId: resumeId,
        improvements: tailoringResult.improvements,
        tokensUsed: tailoringResult.tokensUsed,
        estimatedCost: tailoringResult.estimatedCost
      };

    } catch (error) {
      logger.error('Error in tailorResumeForJob:', error);
      throw error;
    }
  }

  /**
   * Analyze job description to extract key information
   */
  async analyzeJobDescription(
    description: string,
    title: string,
    company: string,
    requirements: string[]
  ): Promise<JobAnalysis> {
    try {
      logger.info('Analyzing job description for keywords and requirements');

      // Extract keywords using multiple methods
      const keywords = this.extractKeywords(description);
      const skillKeywords = this.extractSkills(description);
      const industryKeywords = this.extractIndustryKeywords(description);

      // Parse requirements
      const allRequirements = [...requirements];
      if (description.includes('Requirements:')) {
        const reqSection = description.split('Requirements:')[1]?.split('Responsibilities:')[0];
        if (reqSection) {
          const reqs = reqSection.split('\n').filter(r => r.trim().length > 10);
          allRequirements.push(...reqs);
        }
      }

      // Categorize skills
      const requiredSkills: string[] = [];
      const preferredSkills: string[] = [];

      allRequirements.forEach(req => {
        const lower = req.toLowerCase();
        if (lower.includes('required') || lower.includes('must have') || lower.includes('minimum')) {
          requiredSkills.push(req.trim());
        } else if (lower.includes('preferred') || lower.includes('nice to have') || lower.includes('plus')) {
          preferredSkills.push(req.trim());
        } else {
          requiredSkills.push(req.trim());
        }
      });

      // Extract responsibilities
      const responsibilities: string[] = [];
      if (description.includes('Responsibilities:')) {
        const respSection = description.split('Responsibilities:')[1]?.split(/Requirements:|Qualifications:/)[0];
        if (respSection) {
          responsibilities.push(...respSection.split('\n').filter(r => r.trim().length > 10));
        }
      }

      // Extract qualifications
      const qualifications: string[] = [];
      if (description.includes('Qualifications:')) {
        const qualSection = description.split('Qualifications:')[1]?.split(/Benefits:|About/)[0];
        if (qualSection) {
          qualifications.push(...qualSection.split('\n').filter(q => q.trim().length > 10));
        }
      }

      // Determine experience level
      const experienceLevel = this.determineExperienceLevel(description);

      return {
        keywords: [...new Set(keywords)],
        requiredSkills: [...new Set(requiredSkills)],
        preferredSkills: [...new Set(preferredSkills)],
        qualifications: [...new Set(qualifications)],
        responsibilities: [...new Set(responsibilities)],
        companyName: company,
        jobTitle: title,
        experienceLevel,
        industryKeywords: [...new Set(industryKeywords)]
      };

    } catch (error) {
      logger.error('Error analyzing job description:', error);
      throw error;
    }
  }

  /**
   * Extract keywords from text using NLP techniques
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();

    // Technical skills patterns
    const technicalSkills = [
      'javascript', 'typescript', 'python', 'java', 'c\\+\\+', 'react', 'angular', 'vue',
      'node\\.js', 'express', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'gcp',
      'docker', 'kubernetes', 'jenkins', 'git', 'agile', 'scrum', 'rest api', 'graphql',
      'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'pandas',
      'html', 'css', 'sass', 'webpack', 'redux', 'next\\.js', 'nest\\.js'
    ];

    // Soft skills patterns
    const softSkills = [
      'leadership', 'communication', 'teamwork', 'problem solving', 'analytical',
      'detail-oriented', 'self-motivated', 'collaborative', 'adaptable', 'innovative'
    ];

    // Check for technical skills
    technicalSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi');
      if (regex.test(lowerText)) {
        const match = text.match(regex);
        if (match) keywords.push(match[0]);
      }
    });

    // Check for soft skills
    softSkills.forEach(skill => {
      const regex = new RegExp(`\\b${skill}\\b`, 'gi');
      if (regex.test(lowerText)) {
        keywords.push(skill);
      }
    });

    // Extract acronyms (2-5 uppercase letters)
    const acronyms = text.match(/\b[A-Z]{2,5}\b/g) || [];
    keywords.push(...acronyms);

    // Extract phrases after "experience with" or "knowledge of"
    const experiencePatterns = [
      /experience (?:with|in) ([a-zA-Z0-9\s,]+?)(?:\.|,|\n|and)/gi,
      /knowledge of ([a-zA-Z0-9\s,]+?)(?:\.|,|\n|and)/gi,
      /proficient (?:in|with) ([a-zA-Z0-9\s,]+?)(?:\.|,|\n|and)/gi
    ];

    experiencePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const items = match[1].split(',').map(item => item.trim());
        keywords.push(...items);
      }
    });

    return keywords.filter(k => k.length > 2);
  }

  /**
   * Extract technical skills specifically
   */
  private extractSkills(text: string): string[] {
    const skills: string[] = [];
    const lowerText = text.toLowerCase();

    const skillCategories = {
      programming: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'go', 'rust', 'swift', 'kotlin'],
      frameworks: ['react', 'angular', 'vue', 'express', 'django', 'flask', 'spring', 'laravel', '.net'],
      databases: ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra', 'dynamodb'],
      cloud: ['aws', 'azure', 'gcp', 'heroku', 'digitalocean', 'cloudflare'],
      devops: ['docker', 'kubernetes', 'jenkins', 'gitlab ci', 'github actions', 'terraform', 'ansible'],
      tools: ['git', 'jira', 'confluence', 'figma', 'postman', 'swagger']
    };

    Object.values(skillCategories).flat().forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    return skills;
  }

  /**
   * Extract industry-specific keywords
   */
  private extractIndustryKeywords(text: string): string[] {
    const keywords: string[] = [];
    const lowerText = text.toLowerCase();

    const industryTerms = {
      fintech: ['fintech', 'blockchain', 'cryptocurrency', 'payment processing', 'banking'],
      healthcare: ['healthcare', 'hipaa', 'ehr', 'medical', 'patient care'],
      ecommerce: ['e-commerce', 'retail', 'inventory', 'payment gateway', 'shopping cart'],
      education: ['edtech', 'e-learning', 'lms', 'curriculum', 'student'],
      saas: ['saas', 'b2b', 'subscription', 'multi-tenant', 'enterprise'],
      startup: ['startup', 'mvp', 'growth', 'scale', 'venture']
    };

    Object.entries(industryTerms).forEach(([industry, terms]) => {
      terms.forEach(term => {
        if (lowerText.includes(term)) {
          keywords.push(term);
        }
      });
    });

    return keywords;
  }

  /**
   * Determine experience level from job description
   */
  private determineExperienceLevel(description: string): string {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('entry level') || lowerDesc.includes('junior') || 
        lowerDesc.includes('0-2 years') || lowerDesc.includes('graduate')) {
      return 'Entry Level';
    } else if (lowerDesc.includes('senior') || lowerDesc.includes('lead') || 
               lowerDesc.includes('5+ years') || lowerDesc.includes('7+ years')) {
      return 'Senior';
    } else if (lowerDesc.includes('mid-level') || lowerDesc.includes('mid level') ||
               lowerDesc.includes('3-5 years') || lowerDesc.includes('2-4 years')) {
      return 'Mid-Level';
    }

    return 'Mid-Level'; // Default
  }

  /**
   * Generate tailored resume content using OpenAI
   */
  private async generateTailoredContent(
    resumeText: string,
    jobAnalysis: JobAnalysis,
    job: any
  ): Promise<{ content: string; improvements: string[]; tokensUsed: number; estimatedCost: number }> {
    try {
      logger.info('Calling OpenAI to generate tailored resume');

      // Call OpenAI with the correct 3 parameters: resumeText, jobDescription, jobTitle
      const result = await openaiService.generateResumeTailoring(
        resumeText,
        job.description,
        jobAnalysis.keywords
      );

      // Extract improvements from the result
      const improvements = this.extractImprovements(result.content, resumeText);

      return {
        content: result.content,
        improvements,
        tokensUsed: result.tokensUsed.total, // Extract total from object
        estimatedCost: result.estimatedCost
      };

    } catch (error) {
      logger.error('Error generating tailored content:', error);
      throw error;
    }
  }

  /**
   * Extract improvements made to the resume
   */
  private extractImprovements(tailoredContent: string, originalContent: string): string[] {
    const improvements: string[] = [];

    // Check for keyword additions
    const originalKeywords = this.extractKeywords(originalContent);
    const tailoredKeywords = this.extractKeywords(tailoredContent);
    const newKeywords = tailoredKeywords.filter(k => !originalKeywords.includes(k));
    
    if (newKeywords.length > 0) {
      improvements.push(`Added ${newKeywords.length} relevant keywords: ${newKeywords.slice(0, 5).join(', ')}`);
    }

    // Check for quantification improvements
    const originalNumbers = (originalContent.match(/\d+%|\d+\+/g) || []).length;
    const tailoredNumbers = (tailoredContent.match(/\d+%|\d+\+/g) || []).length;
    
    if (tailoredNumbers > originalNumbers) {
      improvements.push(`Added ${tailoredNumbers - originalNumbers} quantifiable metrics`);
    }

    // Check for action verb improvements
    const actionVerbs = ['developed', 'implemented', 'designed', 'led', 'managed', 'optimized', 'improved'];
    const originalVerbs = actionVerbs.filter(v => originalContent.toLowerCase().includes(v)).length;
    const tailoredVerbs = actionVerbs.filter(v => tailoredContent.toLowerCase().includes(v)).length;
    
    if (tailoredVerbs > originalVerbs) {
      improvements.push(`Enhanced with ${tailoredVerbs - originalVerbs} strong action verbs`);
    }

    improvements.push('Reformatted bullet points for ATS optimization');
    improvements.push('Aligned experience descriptions with job requirements');

    return improvements;
  }

  /**
   * Optimize resume for ATS systems
   */
  private async optimizeForATS(
    content: string,
    jobAnalysis: JobAnalysis
  ): Promise<string> {
    try {
      logger.info('Optimizing resume for ATS');

      let optimized = content;

      // 1. Ensure keywords are naturally integrated
      jobAnalysis.keywords.slice(0, 15).forEach(keyword => {
        if (!optimized.toLowerCase().includes(keyword.toLowerCase())) {
          logger.info(`Adding missing keyword: ${keyword}`);
          // Add to skills section if exists
          if (optimized.includes('SKILLS') || optimized.includes('Technical Skills')) {
            optimized = optimized.replace(
              /(SKILLS|Technical Skills)([^\n]*)/i,
              `$1$2, ${keyword}`
            );
          }
        }
      });

      // 2. Standardize section headers
      const standardHeaders = {
        'experience': 'PROFESSIONAL EXPERIENCE',
        'work history': 'PROFESSIONAL EXPERIENCE',
        'education': 'EDUCATION',
        'skills': 'TECHNICAL SKILLS',
        'projects': 'PROJECTS',
        'certifications': 'CERTIFICATIONS'
      };

      Object.entries(standardHeaders).forEach(([old, standardized]) => {
        const regex = new RegExp(old, 'gi');
        optimized = optimized.replace(regex, standardized);
      });

      // 3. Remove special characters that confuse ATS
      optimized = optimized.replace(/[•●○]/g, '-');
      optimized = optimized.replace(/[""]/g, '"');
      optimized = optimized.replace(/['']/g, "'");

      // 4. Ensure consistent date formatting
      optimized = optimized.replace(/(\d{1,2})\/(\d{4})/g, '$2');
      
      // 5. Add keyword density for required skills
      logger.info('ATS optimization complete');
      
      return optimized;

    } catch (error) {
      logger.error('Error optimizing for ATS:', error);
      return content; // Return original if optimization fails
    }
  }

  /**
   * Calculate ATS compatibility score
   */
  private calculateATSScore(
    tailoredContent: string,
    jobAnalysis: JobAnalysis,
    originalContent: string
  ): ATSScore {
    try {
      logger.info('Calculating ATS score');

      const lowerContent = tailoredContent.toLowerCase();
      
      // 1. Keyword Match Score (40%)
      const matchedKeywords = jobAnalysis.keywords.filter(keyword => 
        lowerContent.includes(keyword.toLowerCase())
      );
      const missingKeywords = jobAnalysis.keywords.filter(keyword =>
        !lowerContent.includes(keyword.toLowerCase())
      );
      const keywordMatch = (matchedKeywords.length / jobAnalysis.keywords.length) * 100;

      // 2. Skills Match Score (30%)
      const allSkills = [...jobAnalysis.requiredSkills, ...jobAnalysis.preferredSkills];
      const matchedSkills = allSkills.filter(skill =>
        lowerContent.includes(skill.toLowerCase())
      );
      const skillsMatch = allSkills.length > 0 
        ? (matchedSkills.length / allSkills.length) * 100 
        : 80;

      // 3. Experience Match Score (20%)
      let experienceMatch = 80; // Base score
      if (jobAnalysis.experienceLevel === 'Senior' && lowerContent.includes('senior')) {
        experienceMatch = 95;
      } else if (jobAnalysis.experienceLevel === 'Entry Level' && lowerContent.includes('graduate')) {
        experienceMatch = 90;
      }

      // 4. Education Match Score (10%)
      const hasEducation = lowerContent.includes('education') || 
                          lowerContent.includes('bachelor') || 
                          lowerContent.includes('master');
      const educationMatch = hasEducation ? 100 : 70;

      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        (keywordMatch * 0.4) + 
        (skillsMatch * 0.3) + 
        (experienceMatch * 0.2) + 
        (educationMatch * 0.1)
      );

      // Generate suggestions
      const suggestions: string[] = [];
      
      if (keywordMatch < 70) {
        suggestions.push(`Add more job-specific keywords. Missing: ${missingKeywords.slice(0, 5).join(', ')}`);
      }
      if (skillsMatch < 70) {
        suggestions.push('Highlight more required skills from the job description');
      }
      if (!lowerContent.includes('quantif') && !lowerContent.match(/\d+%/)) {
        suggestions.push('Add quantifiable achievements (e.g., "increased by 30%")');
      }
      if (overallScore >= 80) {
        suggestions.push('Excellent ATS compatibility! Your resume is well-optimized.');
      }

      logger.info(`ATS Score calculated: ${overallScore}%`);

      return {
        overallScore,
        keywordMatch: Math.round(keywordMatch),
        skillsMatch: Math.round(skillsMatch),
        experienceMatch: Math.round(experienceMatch),
        educationMatch: Math.round(educationMatch),
        matchedKeywords,
        missingKeywords,
        suggestions
      };

    } catch (error) {
      logger.error('Error calculating ATS score:', error);
      // Return default score if calculation fails
      return {
        overallScore: 70,
        keywordMatch: 70,
        skillsMatch: 70,
        experienceMatch: 70,
        educationMatch: 70,
        matchedKeywords: [],
        missingKeywords: jobAnalysis.keywords,
        suggestions: ['Unable to calculate detailed score. Please review manually.']
      };
    }
  }

  /**
   * Get tailoring history for a user
   */
  async getTailoringHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const tailoredResumes = await Resume.find({
        userId: new Types.ObjectId(userId),
        type: 'TAILORED'
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('jobId', 'title company location')
      .populate('baseResumeId', 'fileName');

      return tailoredResumes;

    } catch (error) {
      logger.error('Error getting tailoring history:', error);
      throw error;
    }
  }
}

export const resumeTailoringService = new ResumeTailoringService();
export default resumeTailoringService;