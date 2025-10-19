import axios from 'axios';
import { JobApiService, JobApiResponse, JobSearchParams } from './types';
import { rateLimiter } from '../../utils/rateLimiter';
import { logger } from '../../utils/logger';

class JoobleService implements JobApiService {
  private baseUrl = 'https://jooble.org/api';

  private getApiKey() {
    return process.env.JOOBLE_API_KEY || '';
  }

  async fetchJobs(params: JobSearchParams): Promise<JobApiResponse[]> {
    try {
      const apiKey = this.getApiKey();
      
      if (!apiKey) {
        logger.warn('Jooble API key not configured - skipping');
        return [];
      }

      // Wait for rate limit slot
      await rateLimiter.waitForSlot('jooble');

      const requestBody = {
        keywords: params.keywords || 'software',
        location: params.location || 'USA',
        page: (params.page || 1).toString(),
        resultsPerPage: (params.limit || 50).toString()
      };

      const response = await axios.post(
        `${this.baseUrl}/${apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const jobs = response.data?.jobs || [];
      
      logger.info(`Fetched ${jobs.length} jobs from Jooble`);

      return jobs.map((job: any) => this.transformJob(job));
    } catch (error: any) {
      if (error.response?.status === 403) {
        logger.error('Jooble API 403 - Check your API key');
      } else {
        logger.error('Error fetching Jooble:', error.message);
      }
      return [];
    }
  }

  private transformJob(job: any): JobApiResponse {
    return {
      id: `jooble-${Buffer.from(job.link).toString('base64').substring(0, 20)}`,
      title: job.title || 'Unknown Title',
      company: job.company || 'Unknown Company',
      location: job.location || 'Not Specified',
      description: job.snippet || '',
      url: job.link || '',
      postedDate: this.parseDate(job.updated),
      salary: job.salary ? { min: undefined, max: undefined, currency: 'USD' } : undefined,
      employmentType: job.type || 'Full-time',
      remote: this.checkRemote(job),
      visaSponsorship: this.checkVisaSponsorship(job),
      skills: [],
      source: 'jooble'
    };
  }

  private parseDate(dateString: string): Date {
    if (!dateString) return new Date();
    
    try {
      return new Date(dateString);
    } catch {
      return new Date();
    }
  }

  private checkRemote(job: any): boolean {
    const title = (job.title || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    const snippet = (job.snippet || '').toLowerCase();
    
    return title.includes('remote') || 
           location.includes('remote') || 
           snippet.includes('remote');
  }

  private checkVisaSponsorship(job: any): any {
    const snippet = (job.snippet || '').toLowerCase();
    
    const hasVisa = snippet.includes('visa') || 
                   snippet.includes('sponsorship') ||
                   snippet.includes('h1b') ||
                   snippet.includes('opt');
    
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

export default new JoobleService();