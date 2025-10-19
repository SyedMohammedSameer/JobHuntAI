import axios from 'axios';
import { JobApiService, JobApiResponse, JobSearchParams } from './types';
import { rateLimiter } from '../../utils/rateLimiter';
import { logger } from '../../utils/logger';

class USAJobsService implements JobApiService {
  private baseUrl = 'https://data.usajobs.gov/api/search';

  constructor() {
    // Don't read env vars in constructor - they might not be loaded yet!
  }

  private getCredentials() {
    return {
      apiKey: process.env.USAJOBS_API_KEY || '',
      userAgent: process.env.USAJOBS_USER_AGENT || ''
    };
  }

  async fetchJobs(params: JobSearchParams): Promise<JobApiResponse[]> {
    try {
      const { apiKey, userAgent } = this.getCredentials();
      
      // Check if API credentials are configured
      if (!apiKey || !userAgent) {
        logger.warn('USAJOBS API credentials not configured - skipping');
        return [];
      }

      // Wait for rate limit slot
      await rateLimiter.waitForSlot('usajobs');

      const searchParams = new URLSearchParams();
      
      if (params.keywords) {
        searchParams.append('Keyword', params.keywords);
      }
      
      if (params.location) {
        searchParams.append('LocationName', params.location);
      }
      
      searchParams.append('ResultsPerPage', String(params.limit || 50));
      searchParams.append('Page', String(params.page || 1));

      const response = await axios.get(`${this.baseUrl}?${searchParams.toString()}`, {
        headers: {
          'Host': 'data.usajobs.gov',
          'User-Agent': userAgent,
          'Authorization-Key': apiKey,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      const jobs = response.data?.SearchResult?.SearchResultItems || [];
      
      logger.info(`Fetched ${jobs.length} jobs from USAJOBS`);

      return jobs.map((item: any) => this.transformJob(item));
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error('USAJOBS API 401 Unauthorized - Check your API key and email in .env file');
      } else {
        logger.error('Error fetching USAJOBS:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
      }
      return [];
    }
  }

  private transformJob(item: any): JobApiResponse {
    const job = item.MatchedObjectDescriptor;
    
    return {
      id: `usajobs-${job.PositionID}`,
      title: job.PositionTitle || 'Unknown Title',
      company: job.OrganizationName || 'US Government',
      location: job.PositionLocationDisplay || 'Not Specified',
      description: job.UserArea?.Details?.JobSummary || job.QualificationSummary || '',
      url: job.PositionURI || '',
      postedDate: new Date(job.PublicationStartDate),
      salary: this.parseSalary(job.PositionRemuneration),
      employmentType: this.parseEmploymentType(job.PositionSchedule),
      remote: this.isRemote(job),
      visaSponsorship: {
        h1b: false, // Government jobs typically don't sponsor
        opt: true,  // Government jobs can be OPT-friendly
        stemOpt: true
      },
      skills: this.extractSkills(job),
      source: 'usajobs'
    };
  }

  private parseSalary(remuneration: any): any {
    if (!remuneration || !Array.isArray(remuneration) || remuneration.length === 0) {
      return undefined;
    }
    
    const salary = remuneration[0];
    return {
      min: parseInt(salary.MinimumRange) || undefined,
      max: parseInt(salary.MaximumRange) || undefined,
      currency: 'USD'
    };
  }

  private parseEmploymentType(schedule: any): string {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return 'Full-time';
    }
    return schedule[0].Name || 'Full-time';
  }

  private isRemote(job: any): boolean {
    // Check PositionLocationDisplay (string)
    const locationDisplay = job.PositionLocationDisplay || '';
    if (locationDisplay.toLowerCase().includes('remote') || 
        locationDisplay.toLowerCase().includes('telework')) {
      return true;
    }
    
    // Check PositionLocation array
    const locations = job.PositionLocation || [];
    if (Array.isArray(locations)) {
      return locations.some((loc: any) => 
        loc.LocationName?.toLowerCase().includes('remote') ||
        loc.LocationName?.toLowerCase().includes('telework')
      );
    }
    
    return false;
  }

  private extractSkills(job: any): string[] {
    const skills: string[] = [];
    
    // Extract from qualifications
    const qualifications = job.QualificationSummary || '';
    const keywords = ['Python', 'Java', 'JavaScript', 'React', 'Node.js', 
                     'AWS', 'Azure', 'Docker', 'Kubernetes', 'SQL'];
    
    keywords.forEach(keyword => {
      if (qualifications.toLowerCase().includes(keyword.toLowerCase())) {
        skills.push(keyword);
      }
    });
    
    return skills;
  }

  async getJobDetails(jobId: string): Promise<JobApiResponse | null> {
    // USAJOBS doesn't have a separate detail endpoint
    // Details are included in search results
    return null;
  }
}

export default new USAJobsService();