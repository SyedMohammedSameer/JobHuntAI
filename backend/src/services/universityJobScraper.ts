// backend/src/services/universityJobScraper.ts
// University Job Scraper Service - Scrapes jobs from major university career portals

import axios from 'axios';
import * as cheerio from 'cheerio';
import Job from '../models/Job';
import logger from '../utils/logger';
import visaDetectionService from './visaDetection';

/**
 * University Job Scraper Service
 * Scrapes jobs from major university career portals that are friendly to international students
 */

interface UniversityJobListing {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  postedDate: Date;
  university: string;
}

interface ScrapeResult {
  university: string;
  jobsScraped: number;
  jobsSaved: number;
  errors: string[];
}

class UniversityJobScraperService {
  // Top universities known for international student support
  private readonly UNIVERSITIES = [
    {
      name: 'MIT',
      url: 'https://careers.mit.edu',
      enabled: true
    },
    {
      name: 'Stanford',
      url: 'https://careereducation.stanford.edu',
      enabled: true
    },
    {
      name: 'Carnegie Mellon',
      url: 'https://www.cmu.edu/career',
      enabled: true
    },
    {
      name: 'UC Berkeley',
      url: 'https://career.berkeley.edu',
      enabled: true
    },
    {
      name: 'University of Illinois',
      url: 'https://ecs.engineering.illinois.edu',
      enabled: true
    }
  ];

  /**
   * Main scraping method - scrapes all enabled universities
   */
  async scrapeAllUniversities(): Promise<{
    totalScraped: number;
    totalSaved: number;
    results: ScrapeResult[];
  }> {
    logger.info('🏫 Starting university job scraping...');

    const results: ScrapeResult[] = [];
    let totalScraped = 0;
    let totalSaved = 0;

    for (const university of this.UNIVERSITIES) {
      if (!university.enabled) {
        logger.info(`Skipping ${university.name} (disabled)`);
        continue;
      }

      try {
        logger.info(`Scraping ${university.name}...`);
        const result = await this.scrapeUniversity(university.name);
        results.push(result);
        totalScraped += result.jobsScraped;
        totalSaved += result.jobsSaved;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error scraping ${university.name}:`, errorMessage);
        results.push({
          university: university.name,
          jobsScraped: 0,
          jobsSaved: 0,
          errors: [errorMessage]
        });
      }
    }

    logger.info(`✅ University scraping complete: ${totalScraped} scraped, ${totalSaved} saved`);

    return {
      totalScraped,
      totalSaved,
      results
    };
  }

  /**
   * Scrape a specific university
   */
  private async scrapeUniversity(universityName: string): Promise<ScrapeResult> {
    const result: ScrapeResult = {
      university: universityName,
      jobsScraped: 0,
      jobsSaved: 0,
      errors: []
    };

    try {
      // For demo purposes, we'll create mock data
      // In production, you'd implement actual scraping for each university
      const mockJobs = await this.getMockUniversityJobs(universityName);

      result.jobsScraped = mockJobs.length;

      // Save jobs to database
      for (const jobData of mockJobs) {
        try {
          await this.saveUniversityJob(jobData);
          result.jobsSaved++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to save job: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
    }

    return result;
  }

  /**
   * Save university job to database
   */
  private async saveUniversityJob(jobData: UniversityJobListing): Promise<void> {
    // Check if job already exists
    const existingJob = await Job.findOne({
      source: 'UNIVERSITY',
      sourceJobId: `${jobData.university}-${jobData.title}-${jobData.company}`
    });

    if (existingJob) {
      // Update existing job
      existingJob.title = jobData.title;
      existingJob.company = jobData.company;
      existingJob.location = jobData.location;
      existingJob.description = jobData.description;
      existingJob.sourceUrl = jobData.url;
      existingJob.updatedAt = new Date();
      await existingJob.save();
      logger.debug(`Updated university job: ${jobData.title} at ${jobData.company}`);
    } else {
      // Analyze visa sponsorship
      const visaAnalysis = visaDetectionService.detectVisaSponsorship(
        jobData.title,
        jobData.description,
        jobData.company
      );

      // Create new job
      const newJob = new Job({
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        description: jobData.description,
        employmentType: 'FULL_TIME',
        remote: jobData.location.toLowerCase().includes('remote'),
        visaSponsorship: {
          h1b: visaAnalysis.h1b,
          opt: visaAnalysis.opt,
          stemOpt: visaAnalysis.stemOpt
        },
        source: 'UNIVERSITY',
        sourceJobId: `${jobData.university}-${jobData.title}-${jobData.company}`,
        sourceUrl: jobData.url,
        postedDate: jobData.postedDate,
        isActive: true,
        skills: this.extractSkills(jobData.description),
        metadata: {
          university: jobData.university,
          scrapedAt: new Date()
        }
      });

      await newJob.save();
      logger.debug(`Saved new university job: ${jobData.title} at ${jobData.company}`);
    }
  }

  /**
   * Extract skills from job description
   */
  private extractSkills(description: string): string[] {
    const skillKeywords = [
      'javascript', 'typescript', 'python', 'java', 'react', 'node.js',
      'angular', 'vue', 'sql', 'mongodb', 'aws', 'azure', 'docker',
      'kubernetes', 'machine learning', 'ai', 'data science', 'devops',
      'c++', 'c#', 'golang', 'rust', 'swift', 'kotlin', 'flutter'
    ];

    const descriptionLower = description.toLowerCase();
    const foundSkills: string[] = [];

    skillKeywords.forEach(skill => {
      if (descriptionLower.includes(skill)) {
        foundSkills.push(skill);
      }
    });

    return foundSkills;
  }

  /**
   * Get mock university jobs (for demonstration)
   * In production, implement actual scraping logic for each university
   */
  private async getMockUniversityJobs(universityName: string): Promise<UniversityJobListing[]> {
    // Mock data - represents typical university job board listings
    const mockJobs: UniversityJobListing[] = [
      {
        title: 'Software Engineer - New Grad',
        company: 'Google',
        location: 'Mountain View, CA',
        description: `Join Google as a Software Engineer! We welcome international students with F-1 OPT status. 
        
        Responsibilities:
        - Design and develop scalable software solutions
        - Collaborate with cross-functional teams
        - Write clean, maintainable code
        
        Requirements:
        - BS/MS in Computer Science or related field
        - Strong programming skills in Python, Java, or C++
        - Understanding of data structures and algorithms
        
        We sponsor H1B visas for qualified candidates. OPT and STEM OPT students are encouraged to apply.`,
        url: `https://${universityName.toLowerCase()}.edu/careers/google-swe`,
        postedDate: new Date(),
        university: universityName
      },
      {
        title: 'Data Scientist - Entry Level',
        company: 'Microsoft',
        location: 'Seattle, WA',
        description: `Microsoft is seeking talented Data Scientists. International students welcome!
        
        What you'll do:
        - Build machine learning models
        - Analyze large datasets
        - Present insights to stakeholders
        
        Qualifications:
        - MS in Computer Science, Statistics, or related field
        - Experience with Python, R, SQL
        - Knowledge of ML frameworks (TensorFlow, PyTorch)
        
        H1B sponsorship available. OPT/STEM OPT candidates encouraged to apply.`,
        url: `https://${universityName.toLowerCase()}.edu/careers/microsoft-ds`,
        postedDate: new Date(),
        university: universityName
      },
      {
        title: 'Full Stack Developer',
        company: 'Amazon',
        location: 'Remote',
        description: `Join Amazon's engineering team! Open to international students.
        
        Key Responsibilities:
        - Develop front-end and back-end solutions
        - Work with React, Node.js, AWS
        - Participate in agile development
        
        Requirements:
        - Bachelor's degree in CS or equivalent
        - Proficiency in JavaScript/TypeScript
        - Experience with cloud technologies
        
        Visa sponsorship available for qualified candidates. F-1 OPT students welcome.`,
        url: `https://${universityName.toLowerCase()}.edu/careers/amazon-fullstack`,
        postedDate: new Date(),
        university: universityName
      },
      {
        title: 'Machine Learning Engineer',
        company: 'Meta',
        location: 'Menlo Park, CA',
        description: `Meta is hiring ML Engineers. International students are encouraged to apply.
        
        Role:
        - Design and implement ML systems
        - Optimize model performance
        - Collaborate with research teams
        
        Qualifications:
        - MS/PhD in Computer Science or related field
        - Strong Python and ML skills
        - Publications or projects in ML/AI
        
        We provide H1B sponsorship. STEM OPT candidates strongly encouraged.`,
        url: `https://${universityName.toLowerCase()}.edu/careers/meta-mle`,
        postedDate: new Date(),
        university: universityName
      },
      {
        title: 'DevOps Engineer',
        company: 'Stripe',
        location: 'San Francisco, CA',
        description: `Stripe seeks DevOps Engineers. Open to OPT/CPT students.
        
        Responsibilities:
        - Manage CI/CD pipelines
        - Automate infrastructure
        - Monitor system performance
        
        Requirements:
        - BS in Computer Science or related field
        - Experience with Docker, Kubernetes, Terraform
        - Knowledge of AWS/GCP
        
        H1B visa sponsorship available. International students welcome.`,
        url: `https://${universityName.toLowerCase()}.edu/careers/stripe-devops`,
        postedDate: new Date(),
        university: universityName
      }
    ];

    return mockJobs;
  }

  /**
   * Get university job statistics
   */
  async getUniversityJobStats(): Promise<{
    totalJobs: number;
    jobsByUniversity: { [university: string]: number };
    recentJobs: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalJobs, jobsByUniversity, recentJobs] = await Promise.all([
      Job.countDocuments({ source: 'UNIVERSITY' }),
      Job.aggregate([
        { $match: { source: 'UNIVERSITY' } },
        { $group: { _id: '$metadata.university', count: { $sum: 1 } } }
      ]),
      Job.countDocuments({
        source: 'UNIVERSITY',
        createdAt: { $gte: sevenDaysAgo }
      })
    ]);

    const universityMap = jobsByUniversity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as { [university: string]: number });

    return {
      totalJobs,
      jobsByUniversity: universityMap,
      recentJobs
    };
  }

  /**
   * Real scraping implementation example (for reference)
   * Implement similar methods for each university
   */
  private async scrapeWithCheerio(url: string): Promise<UniversityJobListing[]> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const jobs: UniversityJobListing[] = [];

      // Example selector structure - adjust based on actual website
      $('.job-listing').each((index, element) => {
        const $element = $(element);
        
        const job: UniversityJobListing = {
          title: $element.find('.job-title').text().trim(),
          company: $element.find('.company-name').text().trim(),
          location: $element.find('.job-location').text().trim(),
          description: $element.find('.job-description').text().trim(),
          url: $element.find('a').attr('href') || '',
          postedDate: new Date(),
          university: 'Unknown'
        };

        if (job.title && job.company) {
          jobs.push(job);
        }
      });

      return jobs;
    } catch (error) {
      logger.error('Error scraping with Cheerio:', error);
      return [];
    }
  }
}

export default new UniversityJobScraperService();