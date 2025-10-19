import axios from 'axios';
import { JobApiService, JobApiResponse, JobSearchParams } from './types';
import { rateLimiter } from '../../utils/rateLimiter';
import { logger } from '../../utils/logger';

class ArbeitnowService implements JobApiService {
  private baseUrl = 'https://arbeitnow.com/api/job-board-api';

  async fetchJobs(params: JobSearchParams): Promise<JobApiResponse[]> {
    try {
      // Wait for rate limit slot
      await rateLimiter.waitForSlot('arbeitnow');

      const response = await axios.get(this.baseUrl, {
        timeout: 10000
      });

      const jobs = response.data?.data || [];
      
      logger.info(`Fetched ${jobs.length} jobs from Arbeitnow`);

      // Filter based on params if provided
      let filteredJobs = jobs;
      
      if (params.keywords) {
        const keywords = params.keywords.toLowerCase();
        filteredJobs = filteredJobs.filter((job: any) =>
          job.title?.toLowerCase().includes(keywords) ||
          job.description?.toLowerCase().includes(keywords)
        );
      }

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 50;
      const start = (page - 1) * limit;
      const end = start + limit;
      
      filteredJobs = filteredJobs.slice(start, end);

      return filteredJobs.map((job: any) => this.transformJob(job));
    } catch (error: any) {
      logger.error('Error fetching Arbeitnow:', error.message);
      return [];
    }
  }

  private transformJob(job: any): JobApiResponse {
    return {
      id: `arbeitnow-${job.slug}`,
      title: job.title || 'Unknown Title',
      company: job.company_name || 'Unknown Company',
      location: job.location || 'Europe/Remote',
      description: job.description || '',
      url: job.url || `https://arbeitnow.com/jobs/${job.slug}`,
      postedDate: new Date(job.created_at),
      salary: undefined, // Arbeitnow doesn't provide salary
      employmentType: this.parseEmploymentType(job.job_types),
      remote: job.remote || false,
      visaSponsorship: this.checkVisaSponsorship(job),
      skills: job.tags || [],
      source: 'arbeitnow'
    };
  }

  private parseEmploymentType(jobTypes: string[]): string {
    if (!jobTypes || jobTypes.length === 0) return 'Full-time';
    
    const type = jobTypes[0].toLowerCase();
    if (type.includes('full')) return 'Full-time';
    if (type.includes('part')) return 'Part-time';
    if (type.includes('contract')) return 'Contract';
    if (type.includes('intern')) return 'Internship';
    
    return 'Full-time';
  }

  private checkVisaSponsorship(job: any): any {
    const description = (job.description || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    
    // Check for visa keywords
    const hasVisa = description.includes('visa') || 
                   description.includes('sponsorship') ||
                   description.includes('work permit');
    
    return {
      h1b: hasVisa,
      opt: hasVisa,
      stemOpt: hasVisa
    };
  }

  async getJobDetails(jobId: string): Promise<JobApiResponse | null> {
    return null;
  }
}

export default new ArbeitnowService();