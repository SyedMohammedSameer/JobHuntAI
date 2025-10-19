import axios from 'axios';
import { JobApiService, JobApiResponse, JobSearchParams } from './types';
import { rateLimiter } from '../../utils/rateLimiter';
import { logger } from '../../utils/logger';

class RemoteOKService implements JobApiService {
  private baseUrl = 'https://remoteok.com/api';

  async fetchJobs(params: JobSearchParams): Promise<JobApiResponse[]> {
    try {
      // Wait for rate limit slot
      await rateLimiter.waitForSlot('remoteok');

      // RemoteOK has a simple API - just fetch all recent jobs
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'JobHuntAI/1.0'
        },
        timeout: 10000
      });

      // First item is metadata, skip it
      const jobs = response.data.slice(1);
      
      logger.info(`Fetched ${jobs.length} jobs from RemoteOK`);

      // Filter based on params
      let filteredJobs = jobs;
      
      if (params.keywords) {
        const keywords = params.keywords.toLowerCase();
        filteredJobs = filteredJobs.filter((job: any) =>
          job.position?.toLowerCase().includes(keywords) ||
          job.description?.toLowerCase().includes(keywords) ||
          job.tags?.some((tag: string) => tag.toLowerCase().includes(keywords))
        );
      }

      if (params.location) {
        const location = params.location.toLowerCase();
        filteredJobs = filteredJobs.filter((job: any) =>
          job.location?.toLowerCase().includes(location)
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
      logger.error('Error fetching RemoteOK:', error.message);
      return [];
    }
  }

  private transformJob(job: any): JobApiResponse {
    // Handle date conversion safely
    let postedDate = new Date();
    if (job.date && !isNaN(job.date)) {
      const timestamp = job.date * 1000;
      const parsedDate = new Date(timestamp);
      if (!isNaN(parsedDate.getTime())) {
        postedDate = parsedDate;
      }
    }

    return {
      id: `remoteok-${job.id}`,
      title: job.position || 'Unknown Title',
      company: job.company || 'Unknown Company',
      location: job.location || 'Remote',
      description: job.description || '',
      url: job.url || `https://remoteok.com/remote-jobs/${job.id}`,
      postedDate: postedDate,
      salary: this.parseSalary(job),
      employmentType: job.employment_type || 'Full-time',
      remote: true, // All RemoteOK jobs are remote
      visaSponsorship: this.checkVisaSponsorship(job),
      skills: job.tags || [],
      source: 'remoteok'
    };
  }

  private parseSalary(job: any): any {
    if (job.salary_min || job.salary_max) {
      return {
        min: job.salary_min,
        max: job.salary_max,
        currency: 'USD'
      };
    }
    return undefined;
  }

  private checkVisaSponsorship(job: any): any {
    const description = (job.description || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    
    // Check for visa sponsorship keywords
    const h1bKeywords = ['h1b', 'visa sponsor', 'work authorization'];
    const optKeywords = ['opt', 'cpt', 'student visa'];
    
    const hasH1B = h1bKeywords.some(keyword => 
      description.includes(keyword) || company.includes(keyword)
    );
    
    const hasOPT = optKeywords.some(keyword => 
      description.includes(keyword)
    );

    return {
      h1b: hasH1B,
      opt: hasOPT || hasH1B, // If they sponsor H1B, likely OPT-friendly
      stemOpt: hasOPT || hasH1B
    };
  }

  async getJobDetails(jobId: string): Promise<JobApiResponse | null> {
    // RemoteOK doesn't have a separate detail endpoint
    return null;
  }
}

export default new RemoteOKService();