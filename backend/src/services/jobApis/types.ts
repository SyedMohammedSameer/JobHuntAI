// Common types for all job API services

export interface JobApiResponse {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    url: string;
    postedDate: Date;
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    employmentType?: string;
    remote?: boolean;
    visaSponsorship?: {
      h1b?: boolean;
      opt?: boolean;
      stemOpt?: boolean;
    };
    skills?: string[];
    source: string;
  }
  
  export interface JobSearchParams {
    keywords?: string;
    location?: string;
    remote?: boolean;
    page?: number;
    limit?: number;
  }
  
  export interface JobApiService {
    fetchJobs(params: JobSearchParams): Promise<JobApiResponse[]>;
    getJobDetails?(jobId: string): Promise<JobApiResponse | null>;
  }
  
  export interface ApiRateLimit {
    requestsPerMinute: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  }