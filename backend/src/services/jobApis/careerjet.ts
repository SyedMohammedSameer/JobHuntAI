import axios from 'axios';
import { JobApiService, JobApiResponse, JobSearchParams } from './types';
import { rateLimiter } from '../../utils/rateLimiter';
import { logger } from '../../utils/logger';

class CareerjetService implements JobApiService {
  private baseUrl = 'https://public.api.careerjet.net/search';

  private getAffiliateId() {
    return process.env.CAREERJET_AFFILIATE_ID || '';
  }

  async fetchJobs(params: JobSearchParams): Promise<JobApiResponse[]> {
    try {
      const affiliateId = this.getAffiliateId();
      
      if (!affiliateId) {
        logger.warn('Careerjet affiliate ID not configured - skipping');
        return [];
      }

      // Wait for rate limit slot
      await rateLimiter.waitForSlot('careerjet');

      const searchParams = new URLSearchParams({
        affid: affiliateId,
        keywords: params.keywords || 'software engineer',
        location: params.location || 'USA',
        pagesize: String(params.limit || 50),
        page: String(params.page || 1),
        sort: 'date',
        user_ip: '11.22.33.44', // Required but can be placeholder
        user_agent: 'Mozilla/5.0'
      });

      const response = await axios.get(`${this.baseUrl}?${searchParams.toString()}`, {
        timeout: 10000
      });

      const jobs = response.data?.jobs || [];
      
      logger.info(`Fetched ${jobs.length} jobs from Careerjet`);

      return jobs.map((job: any) => this.transformJob(job));
    } catch (error: any) {
      if (error.response?.status === 403) {
        logger.error('Careerjet API 403 - Check your affiliate ID');
      } else {
        logger.error('Error fetching Careerjet:', error.message);
      }
      return [];
    }
  }

  private transformJob(job: any): JobApiResponse {
    return {
      id: `careerjet-${Buffer.from(job.url).toString('base64').substring(0, 20)}`,
      title: job.title || 'Unknown Title',
      company: job.company || 'Unknown Company',
      location: job.locations || 'Not Specified',
      description: job.description || '',
      url: job.url || '',
      postedDate: this.parseDate(job.date),
      salary: job.salary ? { min: undefined, max: undefined, currency: 'USD' } : undefined,
      employmentType: this.parseEmploymentType(job.contract_type),
      remote: this.checkRemote(job),
      visaSponsorship: this.checkVisaSponsorship(job),
      skills: [],
      source: 'careerjet'
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

  private parseEmploymentType(contractType: string): string {
    if (!contractType) return 'Full-time';
    
    const type = contractType.toLowerCase();
    if (type.includes('full')) return 'Full-time';
    if (type.includes('part')) return 'Part-time';
    if (type.includes('contract')) return 'Contract';
    if (type.includes('temporary')) return 'Temporary';
    
    return 'Full-time';
  }

  private checkRemote(job: any): boolean {
    const title = (job.title || '').toLowerCase();
    const locations = (job.locations || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    
    return title.includes('remote') || 
           locations.includes('remote') || 
           description.includes('remote');
  }

  private checkVisaSponsorship(job: any): any {
    const description = (job.description || '').toLowerCase();
    
    const hasVisa = description.includes('visa') || 
                   description.includes('sponsorship') ||
                   description.includes('h1b') ||
                   description.includes('opt');
    
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

export default new CareerjetService();