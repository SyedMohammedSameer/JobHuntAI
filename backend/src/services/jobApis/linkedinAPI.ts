import axios, { AxiosError } from 'axios';
import logger from '../../utils/logger';

const RAPIDAPI_HOST = 'linkedin-job-search-api.p.rapidapi.com';
const RAPIDAPI_URL = `https://${RAPIDAPI_HOST}`;

interface LinkedInJob {
  job_id: string;
  job_title: string;
  company_name: string;
  company_logo?: string;
  location: string;
  posted_time: string;
  job_type?: string;
  work_type?: string;
  job_description?: string;
  application_url: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  seniority_level?: string;
}

interface LinkedInApiResponse {
  status: string;
  request_id: string;
  data: LinkedInJob[];
}

interface TransformedJob {
  sourceJobId: string;
  source: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  remote: boolean;
  employmentType: string;
  postedDate: Date;
  applicationUrl: string;
  experienceLevel?: string;
  skills?: string[];
}

let cache: {
  data: TransformedJob[] | null;
  timestamp: number | null;
} = {
  data: null,
  timestamp: null,
};

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Fetch jobs from LinkedIn via RapidAPI
 */
export const fetchLinkedInJobs = async (
  keywords: string = 'software engineer intern',
  location: string = 'United States',
  options: {
    datePosted?: 'anyTime' | 'pastWeek' | 'pastMonth' | 'past24Hours';
    jobType?: string; // F, P, C, T, I (Full-time, Part-time, Contract, Temporary, Internship)
    experienceLevel?: string;
    onsiteRemote?: string;
  } = {}
): Promise<TransformedJob[]> => {
  // Check if API key exists
  if (!process.env.RAPIDAPI_KEY) {
    logger.warn('⚠️  LinkedIn RapidAPI key not configured, using mock data');
    return getMockLinkedInJobs();
  }

  // Check cache
  const now = Date.now();
  const cacheKey = `${keywords}-${location}`;
  if (cache.data && cache.timestamp && now - cache.timestamp < CACHE_DURATION) {
    logger.info('✓ Returning cached LinkedIn jobs');
    return cache.data;
  }

  try {
    logger.info(`Fetching LinkedIn jobs: ${keywords} in ${location}`);

    const response = await axios.get<LinkedInApiResponse>(`${RAPIDAPI_URL}/active-jb-1h`, {
      params: {
        offset: 0,
        description_type: 'text',
      },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
      },
      timeout: 15000,
    });

    if (!response.data || !response.data.data) {
      logger.warn('No jobs returned from LinkedIn API');
      return [];
    }

    const transformedJobs = transformLinkedInJobs(response.data.data);

    // Update cache
    cache = {
      data: transformedJobs,
      timestamp: now,
    };

    logger.info(
      `✅ Successfully fetched ${transformedJobs.length} jobs from LinkedIn`
    );
    return transformedJobs;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      logger.error(
        `❌ LinkedIn API error: ${axiosError.message}`,
        axiosError.response?.data
      );
    } else {
      logger.error('❌ LinkedIn API error:', error);
    }

    // Fallback to mock data on error
    logger.info('Falling back to mock LinkedIn jobs');
    return getMockLinkedInJobs();
  }
};

/**
 * Fetch multiple job types from LinkedIn (all levels)
 */
export const fetchLinkedInMultiple = async (): Promise<TransformedJob[]> => {
  const searches = [
    // Entry-level & Internships (for university students)
    {
      keywords: 'software engineer intern',
      location: 'United States',
      jobType: 'I',
      experienceLevel: '1',
    },
    {
      keywords: 'data science intern',
      location: 'United States',
      jobType: 'I',
      experienceLevel: '1',
    },
    {
      keywords: 'frontend developer entry level',
      location: 'United States',
      jobType: 'F',
      experienceLevel: '1',
    },
    // Regular/Mid-level positions
    {
      keywords: 'software engineer',
      location: 'United States',
      jobType: 'F',
      experienceLevel: '2', // Associate/Mid-level
    },
    {
      keywords: 'full stack developer',
      location: 'United States',
      jobType: 'F',
      experienceLevel: '2',
    },
    {
      keywords: 'backend engineer',
      location: 'Remote',
      jobType: 'F',
      experienceLevel: '2',
      onsiteRemote: '2', // Remote
    },
    {
      keywords: 'product manager',
      location: 'United States',
      jobType: 'F',
      experienceLevel: '2',
    },
    // Senior positions
    {
      keywords: 'senior software engineer',
      location: 'United States',
      jobType: 'F',
      experienceLevel: '3', // Senior
    },
    {
      keywords: 'DevOps engineer',
      location: 'Remote',
      jobType: 'F',
      onsiteRemote: '2', // Remote
    },
  ];

  const allJobs: TransformedJob[] = [];

  for (const search of searches) {
    try {
      const jobs = await fetchLinkedInJobs(
        search.keywords,
        search.location,
        {
          jobType: search.jobType,
          experienceLevel: search.experienceLevel,
          onsiteRemote: search.onsiteRemote,
          datePosted: 'pastMonth',
        }
      );
      allJobs.push(...jobs);

      // Delay between API calls to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      logger.error(`Error fetching LinkedIn jobs for ${search.keywords}:`, error);
    }
  }

  // Remove duplicates based on sourceJobId
  const uniqueJobs = Array.from(
    new Map(allJobs.map((job) => [job.sourceJobId, job])).values()
  );

  return uniqueJobs;
};

/**
 * Transform LinkedIn API response to our job schema
 */
const transformLinkedInJobs = (data: LinkedInJob[]): TransformedJob[] => {
  return data.map((job) => {
    const employmentType = mapJobType(job.job_type || job.work_type);
    const experienceLevel = mapExperienceLevel(job.seniority_level);

    return {
      sourceJobId: job.job_id,
      source: 'LINKEDIN',
      title: job.job_title,
      company: job.company_name,
      companyLogo: job.company_logo,
      location: job.location || 'Not specified',
      description: job.job_description || '',
      salaryMin: job.salary?.min,
      salaryMax: job.salary?.max,
      salaryCurrency: job.salary?.currency || 'USD',
      remote:
        job.work_type?.toLowerCase().includes('remote') ||
        job.location?.toLowerCase().includes('remote') ||
        false,
      employmentType,
      postedDate: parsePostedDate(job.posted_time),
      applicationUrl: job.application_url,
      experienceLevel,
      skills: [], // LinkedIn API might not provide skills directly
    };
  });
};

/**
 * Map LinkedIn job type to our standard types
 */
const mapJobType = (jobType?: string): string => {
  if (!jobType) return 'FULL_TIME';

  const type = jobType.toUpperCase();
  if (type.includes('INTERN')) return 'INTERNSHIP';
  if (type.includes('PART')) return 'PART_TIME';
  if (type.includes('CONTRACT')) return 'CONTRACT';
  if (type.includes('TEMP')) return 'TEMPORARY';
  if (type.includes('FULL') || type === 'F') return 'FULL_TIME';
  if (type === 'I') return 'INTERNSHIP';
  if (type === 'P') return 'PART_TIME';
  if (type === 'C') return 'CONTRACT';

  return 'FULL_TIME';
};

/**
 * Map experience level to standard format
 */
const mapExperienceLevel = (level?: string): string => {
  if (!level) return 'ENTRY';

  const normalized = level.toLowerCase();
  if (
    normalized.includes('entry') ||
    normalized.includes('junior') ||
    normalized === '1'
  )
    return 'ENTRY';
  if (
    normalized.includes('mid') ||
    normalized.includes('associate') ||
    normalized === '2'
  )
    return 'MID';
  if (
    normalized.includes('senior') ||
    normalized.includes('lead') ||
    normalized === '3' ||
    normalized === '4'
  )
    return 'SENIOR';
  if (normalized.includes('executive') || normalized === '5') return 'EXECUTIVE';

  return 'ENTRY';
};

/**
 * Parse LinkedIn posted time to Date
 */
const parsePostedDate = (postedTime: string): Date => {
  // LinkedIn returns relative time like "2 days ago", "1 week ago"
  const now = new Date();

  if (!postedTime) return now;

  const match = postedTime.match(/(\d+)\s+(minute|hour|day|week|month)s?\s+ago/i);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'minute':
        return new Date(now.getTime() - value * 60 * 1000);
      case 'hour':
        return new Date(now.getTime() - value * 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
    }
  }

  return now;
};

/**
 * Get mock LinkedIn jobs when API is unavailable
 */
const getMockLinkedInJobs = (): TransformedJob[] => {
  const mockJobs: TransformedJob[] = [
    {
      sourceJobId: 'mock-linkedin-1',
      source: 'LINKEDIN-MOCK',
      title: 'Software Engineering Intern - Summer 2025',
      company: 'Microsoft',
      location: 'Redmond, WA',
      description:
        'Join our team as a Software Engineering Intern. Work on real projects that impact millions of users. Requirements: CS major, proficiency in C#, Java, or Python.',
      salaryMin: 30,
      salaryMax: 45,
      salaryCurrency: 'USD',
      remote: false,
      employmentType: 'INTERNSHIP',
      postedDate: new Date(),
      applicationUrl: 'https://example.com/jobs/1',
      experienceLevel: 'ENTRY',
      skills: ['C#', 'Java', 'Python', 'Azure'],
    },
    {
      sourceJobId: 'mock-linkedin-2',
      source: 'LINKEDIN-MOCK',
      title: 'Product Management Intern',
      company: 'Google',
      location: 'Mountain View, CA',
      description:
        'Work alongside experienced Product Managers to define product strategy and roadmap. Perfect for MBA or CS students with strong analytical skills.',
      salaryMin: 35,
      salaryMax: 50,
      salaryCurrency: 'USD',
      remote: false,
      employmentType: 'INTERNSHIP',
      postedDate: new Date(),
      applicationUrl: 'https://example.com/jobs/2',
      experienceLevel: 'ENTRY',
      skills: ['Product Management', 'SQL', 'Analytics'],
    },
    {
      sourceJobId: 'mock-linkedin-3',
      source: 'LINKEDIN-MOCK',
      title: 'Frontend Developer - Remote',
      company: 'Shopify',
      location: 'Remote',
      description:
        'Build beautiful, performant user interfaces for our e-commerce platform. Work with React, TypeScript, and modern web technologies.',
      salaryMin: 80,
      salaryMax: 120,
      salaryCurrency: 'USD',
      remote: true,
      employmentType: 'FULL_TIME',
      postedDate: new Date(),
      applicationUrl: 'https://example.com/jobs/3',
      experienceLevel: 'ENTRY',
      skills: ['React', 'TypeScript', 'CSS', 'GraphQL'],
    },
  ];

  return mockJobs;
};

export default {
  fetchLinkedInJobs,
  fetchLinkedInMultiple,
};
