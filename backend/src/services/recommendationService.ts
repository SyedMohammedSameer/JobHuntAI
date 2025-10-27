// backend/src/services/recommendationService.ts

import { Types } from 'mongoose';
import User from '../models/User';
import Job from '../models/Job';
import Application from '../models/Application';
import Resume from '../models/Resume';
import logger from '../utils/logger';

interface JobMatch {
  job: any;
  matchScore: number;
  matchBreakdown: {
    visaMatch: number;
    locationMatch: number;
    salaryMatch: number;
    experienceMatch: number;
    skillsMatch: number;
    preferencesMatch: number;
  };
  matchReasons: string[];
  missingRequirements: string[];
}

interface MatchScoreWeights {
  visaMatch: number;
  locationMatch: number;
  salaryMatch: number;
  experienceMatch: number;
  skillsMatch: number;
  preferencesMatch: number;
}

class RecommendationService {
  // Scoring weights (total = 100%)
  private weights: MatchScoreWeights = {
    visaMatch: 25,        // Critical for international students
    locationMatch: 15,    // Location preferences
    salaryMatch: 15,      // Salary expectations
    experienceMatch: 15,  // Experience level
    skillsMatch: 20,      // Skills match
    preferencesMatch: 10  // Job type, remote, etc.
  };

  /**
   * Get personalized job recommendations
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 20): Promise<JobMatch[]> {
    try {
      logger.info('Generating personalized recommendations', { userId, limit });

      // Get user profile
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's resume for skills extraction
      const resumes = await Resume.find({ userId, type: 'BASE' }).limit(1);
      const resume = resumes[0];

      // Get user's application history
      const applications = await Application.find({ userId: new Types.ObjectId(userId) });
      const appliedJobIds = applications.map(app => app.jobId.toString());

      // Get active jobs (exclude already applied)
      const jobs = await Job.find({
        isActive: true,
        _id: { $nin: appliedJobIds }
      }).limit(limit * 3); // Get more to filter and sort

      // Calculate match scores for each job
      const jobMatches: JobMatch[] = [];

      for (const job of jobs) {
        const match = this.calculateJobMatch(user, job, resume);
        if (match.matchScore >= 30) { // Minimum threshold
          jobMatches.push(match);
        }
      }

      // Sort by match score
      jobMatches.sort((a, b) => b.matchScore - a.matchScore);

      // Return top matches
      const recommendations = jobMatches.slice(0, limit);

      logger.info('Personalized recommendations generated', { 
        userId, 
        totalJobs: jobs.length,
        matches: recommendations.length 
      });

      return recommendations;
    } catch (error: any) {
      logger.error('Error generating recommendations', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  /**
   * Calculate match score for a specific job
   */
  calculateJobMatch(user: any, job: any, resume?: any): JobMatch {
    const breakdown = {
      visaMatch: this.calculateVisaMatch(user, job),
      locationMatch: this.calculateLocationMatch(user, job),
      salaryMatch: this.calculateSalaryMatch(user, job),
      experienceMatch: this.calculateExperienceMatch(user, job),
      skillsMatch: this.calculateSkillsMatch(user, job, resume),
      preferencesMatch: this.calculatePreferencesMatch(user, job)
    };

    // Calculate weighted total score
    const matchScore = Math.round(
      breakdown.visaMatch * this.weights.visaMatch / 100 +
      breakdown.locationMatch * this.weights.locationMatch / 100 +
      breakdown.salaryMatch * this.weights.salaryMatch / 100 +
      breakdown.experienceMatch * this.weights.experienceMatch / 100 +
      breakdown.skillsMatch * this.weights.skillsMatch / 100 +
      breakdown.preferencesMatch * this.weights.preferencesMatch / 100
    );

    // Generate match reasons
    const matchReasons: string[] = [];
    const missingRequirements: string[] = [];

    if (breakdown.visaMatch >= 80) {
      matchReasons.push('Offers visa sponsorship');
    } else if (breakdown.visaMatch === 0) {
      missingRequirements.push('No visa sponsorship available');
    }

    if (breakdown.locationMatch >= 80) {
      matchReasons.push('Matches your location preferences');
    }

    if (breakdown.salaryMatch >= 80) {
      matchReasons.push('Salary matches your expectations');
    }

    if (breakdown.skillsMatch >= 70) {
      matchReasons.push('Strong skills match');
    } else if (breakdown.skillsMatch < 40) {
      missingRequirements.push('Limited skills match - consider upskilling');
    }

    if (breakdown.experienceMatch >= 80) {
      matchReasons.push('Experience level matches');
    }

    return {
      job,
      matchScore,
      matchBreakdown: breakdown,
      matchReasons,
      missingRequirements
    };
  }

  /**
   * Calculate visa sponsorship match
   */
  private calculateVisaMatch(user: any, job: any): number {
    // If user doesn't need visa sponsorship (citizen, green card)
    if (user.visaType === 'CITIZEN' || user.visaType === 'GREEN_CARD') {
      return 100;
    }

    // Check if job offers required visa sponsorship
    const visa = job.visaSponsorship;
    if (!visa) return 0;

    if (user.visaType === 'F1' && (visa.opt || visa.stemOpt)) return 100;
    if (user.visaType === 'OPT' && (visa.opt || visa.stemOpt || visa.h1b)) return 100;
    if (user.visaType === 'STEM_OPT' && (visa.stemOpt || visa.h1b)) return 100;
    if (user.visaType === 'H1B' && visa.h1b) return 100;

    return 0;
  }

  /**
   * Calculate location match
   */
  private calculateLocationMatch(user: any, job: any): number {
    // If user prefers remote and job is remote
    if (user.jobPreferences?.remoteOnly && job.remote) {
      return 100;
    }

    // If no location preferences, neutral score
    if (!user.jobPreferences?.locations || user.jobPreferences.locations.length === 0) {
      return 50;
    }

    // Check if job location matches any preferred location
    const jobLocation = job.location.toLowerCase();
    const preferredLocations = user.jobPreferences.locations.map((l: string) => l.toLowerCase());

    for (const preferred of preferredLocations) {
      if (jobLocation.includes(preferred) || preferred.includes(jobLocation)) {
        return 100;
      }
    }

    // If remote job but user has location preferences
    if (job.remote) {
      return 70;
    }

    return 20;
  }

  /**
   * Calculate salary match
   */
  private calculateSalaryMatch(user: any, job: any): number {
    // If no salary preferences or no job salary info
    if (!user.jobPreferences?.salaryMin || !job.salaryMin || !job.salaryMax) {
      return 50; // Neutral score
    }

    const userMin = user.jobPreferences.salaryMin;
    const userMax = user.jobPreferences.salaryMax || userMin * 2;
    const jobMin = job.salaryMin;
    const jobMax = job.salaryMax;

    // Perfect match: job salary range overlaps with user expectations
    if (jobMax >= userMin && jobMin <= userMax) {
      // Calculate overlap percentage
      const overlapMin = Math.max(jobMin, userMin);
      const overlapMax = Math.min(jobMax, userMax);
      const overlap = overlapMax - overlapMin;
      const userRange = userMax - userMin;
      
      return Math.min(100, Math.round((overlap / userRange) * 100) + 20);
    }

    // Job salary below expectations
    if (jobMax < userMin) {
      const gap = userMin - jobMax;
      return Math.max(0, 50 - Math.round((gap / userMin) * 100));
    }

    // Job salary above expectations (still good!)
    return 80;
  }

  /**
   * Calculate experience level match
   */
  private calculateExperienceMatch(user: any, job: any): number {
    // If no graduation year, assume entry level
    if (!user.graduationYear) {
      return job.experienceLevel === 'ENTRY' ? 100 : 50;
    }

    const currentYear = new Date().getFullYear();
    const yearsExperience = Math.max(0, currentYear - user.graduationYear);

    const levelMap: Record<string, number[]> = {
      'ENTRY': [0, 2],
      'MID': [2, 5],
      'SENIOR': [5, 10],
      'LEAD': [8, 15],
      'EXECUTIVE': [10, 100]
    };

    const [minYears, maxYears] = levelMap[job.experienceLevel] || [0, 100];

    if (yearsExperience >= minYears && yearsExperience <= maxYears) {
      return 100;
    }

    if (yearsExperience < minYears) {
      const gap = minYears - yearsExperience;
      return Math.max(30, 100 - (gap * 20));
    }

    if (yearsExperience > maxYears) {
      return 70; // Overqualified but still good
    }

    return 50;
  }

  /**
   * Calculate skills match
   */
  private calculateSkillsMatch(user: any, job: any, resume?: any): number {
    // Extract skills from resume text
    let userSkills: string[] = [];
    
    if (resume?.originalText) {
      const text = resume.originalText.toLowerCase();
      userSkills = this.extractSkills(text);
    }

    // Extract required skills from job
    const jobSkills = [
      ...(job.skillsRequired || []),
      ...(job.requirements || [])
    ].map((s: string) => s.toLowerCase());

    if (jobSkills.length === 0) {
      return 50; // Neutral if no skills listed
    }

    // Calculate overlap
    let matchCount = 0;
    for (const skill of userSkills) {
      if (jobSkills.some((js: string) => js.includes(skill) || skill.includes(js))) {
        matchCount++;
      }
    }

    const matchPercentage = Math.min(100, Math.round((matchCount / jobSkills.length) * 100));
    return matchPercentage;
  }

  /**
   * Extract skills from resume text
   */
  private extractSkills(text: string): string[] {
    const commonSkills = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift',
      'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'rails',
      'sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
      'git', 'ci/cd', 'agile', 'scrum', 'rest', 'graphql', 'microservices',
      'machine learning', 'data science', 'ai', 'deep learning', 'nlp',
      'html', 'css', 'sass', 'tailwind', 'bootstrap',
      'testing', 'jest', 'pytest', 'junit', 'selenium'
    ];

    const skills: string[] = [];
    for (const skill of commonSkills) {
      if (text.includes(skill)) {
        skills.push(skill);
      }
    }

    return skills;
  }

  /**
   * Calculate job preferences match
   */
  private calculatePreferencesMatch(user: any, job: any): number {
    if (!user.jobPreferences) {
      return 50;
    }

    let score = 0;
    let factors = 0;

    // Job type match
    if (user.jobPreferences.jobTypes && user.jobPreferences.jobTypes.length > 0) {
      factors++;
      if (user.jobPreferences.jobTypes.includes(job.employmentType)) {
        score += 100;
      }
    }

    // Remote preference
    if (user.jobPreferences.remoteOnly !== undefined) {
      factors++;
      if (user.jobPreferences.remoteOnly === job.remote) {
        score += 100;
      }
    }

    // Visa sponsorship requirement
    if (user.jobPreferences.visaSponsorshipRequired) {
      factors++;
      const visa = job.visaSponsorship;
      if (visa && (visa.h1b || visa.opt || visa.stemOpt)) {
        score += 100;
      }
    }

    return factors > 0 ? Math.round(score / factors) : 50;
  }

  /**
   * Get match breakdown details
   */
  async getJobMatchBreakdown(userId: string, jobId: string) {
    try {
      logger.info('Calculating job match breakdown', { userId, jobId });

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const resumes = await Resume.find({ userId, type: 'BASE' }).limit(1);
      const match = this.calculateJobMatch(user, job, resumes[0]);

      logger.info('Job match breakdown calculated', { userId, jobId });

      return match;
    } catch (error: any) {
      logger.error('Error calculating job match breakdown', {
        userId,
        jobId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to calculate match breakdown: ${error.message}`);
    }
  }

  /**
   * Get similar jobs based on a reference job
   */
  async getSimilarJobs(jobId: string, limit: number = 10) {
    try {
      logger.info('Finding similar jobs', { jobId, limit });

      const referenceJob = await Job.findById(jobId);
      if (!referenceJob) {
        throw new Error('Job not found');
      }

      // Find similar jobs based on criteria
      const similarJobs = await Job.find({
        _id: { $ne: jobId },
        isActive: true,
        $or: [
          { company: referenceJob.company },
          { title: { $regex: referenceJob.title.split(' ')[0], $options: 'i' } },
          { location: referenceJob.location },
          { employmentType: referenceJob.employmentType }
        ]
      }).limit(limit);

      logger.info('Similar jobs found', { jobId, count: similarJobs.length });

      return similarJobs;
    } catch (error: any) {
      logger.error('Error finding similar jobs', {
        jobId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to find similar jobs: ${error.message}`);
    }
  }

  /**
   * Get daily top recommendations
   */
  async getDailyRecommendations(userId: string) {
    try {
      logger.info('Getting daily recommendations', { userId });

      // Get top 10 personalized recommendations
      const recommendations = await this.getPersonalizedRecommendations(userId, 10);

      logger.info('Daily recommendations retrieved', { 
        userId, 
        count: recommendations.length 
      });

      return recommendations;
    } catch (error: any) {
      logger.error('Error getting daily recommendations', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to get daily recommendations: ${error.message}`);
    }
  }
}

export default new RecommendationService();