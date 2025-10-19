import Job from '../models/Job';
import { JobApiResponse, JobSearchParams } from './jobApis/types';
import usajobsService from './jobApis/usajobs';
import remoteokService from './jobApis/remoteok';
import { logger } from '../utils/logger';

class JobAggregatorService {
  private services = [
    { name: 'usajobs', service: usajobsService },
    { name: 'remoteok', service: remoteokService },
    // Add more services as we build them
  ];

  /**
   * Fetch jobs from all sources and save to database
   */
  async aggregateJobs(params: JobSearchParams = {}): Promise<number> {
    let totalSaved = 0;

    for (const { name, service } of this.services) {
      try {
        logger.info(`Fetching jobs from ${name}...`);
        const jobs = await service.fetchJobs(params);
        
        // Save each job to database
        for (const jobData of jobs) {
          await this.saveJob(jobData);
          totalSaved++;
        }
        
        logger.info(`Saved ${jobs.length} jobs from ${name}`);
      } catch (error: any) {
        logger.error(`Error aggregating from ${name}:`, error.message);
      }
    }

    logger.info(`Total jobs aggregated: ${totalSaved}`);
    return totalSaved;
  }

  /**
   * Save or update a job in the database
   */
  private async saveJob(jobData: JobApiResponse): Promise<void> {
    try {
      // Check if job already exists
      const existingJob = await Job.findOne({ 
        source: jobData.source.toUpperCase(),
        sourceJobId: jobData.id 
      });

      const jobDoc = {
        title: jobData.title || 'Untitled Position',
        company: jobData.company || 'Unknown Company',
        location: jobData.location || 'Not Specified',
        description: jobData.description || '',
        requirements: [], // Will be extracted later with AI
        responsibilities: [], // Will be extracted later with AI
        employmentType: this.mapEmploymentType(jobData.employmentType),
        remote: jobData.remote || false,
        salaryMin: jobData.salary?.min,
        salaryMax: jobData.salary?.max,
        salaryCurrency: jobData.salary?.currency || 'USD',
        visaSponsorship: jobData.visaSponsorship || {
          h1b: false,
          opt: false,
          stemOpt: false
        },
        source: jobData.source.toUpperCase(),
        sourceJobId: jobData.id,
        sourceUrl: jobData.url || '',
        isUniversityJob: false,
        postedDate: jobData.postedDate || new Date(),
        applicationUrl: jobData.url || '',
        skillsRequired: jobData.skills || [],
        industryTags: [],
        isActive: true,
        isFeatured: false,
        lastRefreshed: new Date()
      };

      if (existingJob) {
        // Update existing job
        await Job.findByIdAndUpdate(existingJob._id, jobDoc);
      } else {
        // Create new job
        await Job.create(jobDoc);
      }
    } catch (error: any) {
      logger.error(`Error saving job ${jobData.id}: ${error.message}`);
    }
  }

  /**
   * Map employment type string to enum value
   */
  private mapEmploymentType(type?: string): string {
    if (!type) return 'FULL_TIME';
    
    const typeUpper = type.toUpperCase();
    if (typeUpper.includes('FULL')) return 'FULL_TIME';
    if (typeUpper.includes('PART')) return 'PART_TIME';
    if (typeUpper.includes('CONTRACT')) return 'CONTRACT';
    if (typeUpper.includes('INTERN')) return 'INTERNSHIP';
    if (typeUpper.includes('TEMP')) return 'TEMPORARY';
    
    return 'FULL_TIME';
  }

  /**
   * Search jobs in database with filters
   */
  async searchJobs(filters: any = {}, page = 1, limit = 20) {
    const query: any = { isActive: true };

    // Text search
    if (filters.keywords) {
      query.$text = { $search: filters.keywords };
    }

    // Location filter
    if (filters.location) {
      query.location = { $regex: filters.location, $options: 'i' };
    }

    // Remote filter
    if (filters.remote !== undefined) {
      query.remote = filters.remote;
    }

    // Visa sponsorship filters
    if (filters.h1b) {
      query['visaSponsorship.h1b'] = true;
    }
    if (filters.opt) {
      query['visaSponsorship.opt'] = true;
    }
    if (filters.stemOpt) {
      query['visaSponsorship.stemOpt'] = true;
    }

    // Employment type
    if (filters.employmentType) {
      query.employmentType = filters.employmentType;
    }

    // Skills
    if (filters.skills && filters.skills.length > 0) {
      query.skills = { $in: filters.skills };
    }

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ postedDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query)
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a single job by ID
   */
  async getJobById(jobId: string) {
    return await Job.findById(jobId).lean();
  }

  /**
   * Remove old/expired jobs (older than 30 days)
   */
  async cleanupOldJobs(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Job.updateMany(
      { postedDate: { $lt: thirtyDaysAgo }, isActive: true },
      { isActive: false }
    );

    logger.info(`Deactivated ${result.modifiedCount} old jobs`);
    return result.modifiedCount;
  }

  /**
   * Get job statistics
   */
  async getStats() {
    const [total, active, bySource] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Job.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$source', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total,
      active,
      bySource: bySource.reduce((acc: any, item: any) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}

export default new JobAggregatorService();