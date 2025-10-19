// backend/src/services/visaDetection.ts

import logger from '../utils/logger';

/**
 * Enhanced Visa Sponsorship Detection Service
 * Detects H1B, OPT, and STEM-OPT sponsorship from job descriptions
 */

interface VisaSponsorshipResult {
  h1b: boolean;
  opt: boolean;
  stemOpt: boolean;
  confidence: {
    h1b: number;
    opt: number;
    stemOpt: number;
  };
  detectedKeywords: string[];
}

// Known H1B sponsor companies (top 100+ based on USCIS data)
const KNOWN_H1B_SPONSORS = new Set([
  'amazon', 'google', 'microsoft', 'meta', 'facebook', 'apple', 'netflix',
  'tesla', 'nvidia', 'adobe', 'salesforce', 'oracle', 'ibm', 'intel',
  'cisco', 'qualcomm', 'broadcom', 'vmware', 'servicenow', 'workday',
  'deloitte', 'accenture', 'pwc', 'ey', 'kpmg', 'cognizant', 'infosys',
  'tcs', 'wipro', 'hcl', 'tech mahindra', 'capgemini', 'jpmorgan', 'goldman sachs',
  'morgan stanley', 'bank of america', 'wells fargo', 'citigroup', 'capital one',
  'uber', 'lyft', 'airbnb', 'stripe', 'square', 'paypal', 'spotify',
  'twitter', 'snap', 'pinterest', 'reddit', 'zoom', 'slack', 'dropbox',
  'atlassian', 'twilio', 'docusign', 'okta', 'cloudflare', 'datadog',
  'snowflake', 'databricks', 'mongodb', 'elastic', 'confluent', 'hashicorp',
  'github', 'gitlab', 'jenkins', 'docker', 'kubernetes', 'red hat',
  'dell', 'hp', 'lenovo', 'samsung', 'lg', 'sony', 'bosch', 'siemens',
  'ge', 'honeywell', 'lockheed martin', 'boeing', 'raytheon', 'northrop grumman',
  'johnson & johnson', 'pfizer', 'merck', 'abbvie', 'bristol myers squibb',
  'eli lilly', 'amgen', 'gilead', 'biogen', 'regeneron', 'moderna',
  'walmart', 'target', 'costco', 'home depot', 'cvs', 'walgreens',
  'fedex', 'ups', 'dhl', 'usps', 'at&t', 'verizon', 't-mobile', 'sprint'
]);

// H1B positive keywords (weighted by importance)
const H1B_KEYWORDS = {
  explicit: [
    'h1b', 'h-1b', 'h 1b', 'visa sponsorship', 'sponsor visa',
    'work authorization', 'employment authorization', 'sponsor work visa',
    'immigration sponsorship', 'green card sponsorship'
  ],
  strong: [
    'sponsorship available', 'visa transfer', 'cap-exempt', 'h1b transfer',
    'f1 opt', 'stem opt', 'cpt', 'curricular practical training',
    'optional practical training', 'accept opt', 'opt eligible'
  ],
  moderate: [
    'international students', 'international candidates',
    'work permit', 'employment visa', 'valid work authorization',
    'eligible to work', 'authorized to work', 'right to work'
  ]
};

// OPT positive keywords
const OPT_KEYWORDS = {
  explicit: [
    'opt', 'o.p.t', 'optional practical training', 'f1 opt', 'f-1 opt',
    'stem opt', 'stem extension', 'opt extension', 'cpt', 'curricular practical training'
  ],
  strong: [
    'accept opt', 'opt eligible', 'opt candidates', 'opt students',
    'international students welcome', 'recent graduates', 'new graduates',
    'entry level international', 'university graduates'
  ]
};

// STEM-OPT specific keywords
const STEM_OPT_KEYWORDS = {
  explicit: [
    'stem opt', 'stem extension', 'stem eligible', 'stem designated',
    'stem degree', 'stem major'
  ],
  strong: [
    'computer science', 'software engineering', 'data science', 'machine learning',
    'artificial intelligence', 'cybersecurity', 'information technology',
    'electrical engineering', 'mechanical engineering', 'mathematics',
    'statistics', 'physics', 'chemistry', 'biology', 'biotech'
  ]
};

// Negative keywords that indicate NO sponsorship
const NEGATIVE_KEYWORDS = [
  'no sponsorship', 'no visa sponsorship', 'cannot sponsor', 'will not sponsor',
  'us citizen only', 'us citizens only', 'citizenship required',
  'must be authorized to work', 'must have work authorization',
  'permanent work authorization', 'must be legally authorized',
  'security clearance required', 'must possess security clearance',
  'us person', 'usc/gc only', 'gc holder', 'green card holder only'
];

class VisaDetectionService {
  /**
   * Main detection method - analyzes job title, description, and company
   */
  detectVisaSponsorship(
    title: string,
    description: string,
    company: string
  ): VisaSponsorshipResult {
    const combinedText = `${title} ${description} ${company}`.toLowerCase();

    // Check for negative keywords first (immediate disqualification)
    const hasNegativeKeywords = this.hasNegativeIndicators(combinedText);
    if (hasNegativeKeywords) {
      logger.debug(`Negative visa keywords found in job: ${title}`);
      return {
        h1b: false,
        opt: false,
        stemOpt: false,
        confidence: { h1b: 0, opt: 0, stemOpt: 0 },
        detectedKeywords: []
      };
    }

    // Detect each visa type
    const h1bResult = this.detectH1B(combinedText, company);
    const optResult = this.detectOPT(combinedText);
    const stemOptResult = this.detectSTEMOPT(combinedText);

    return {
      h1b: h1bResult.detected,
      opt: optResult.detected,
      stemOpt: stemOptResult.detected,
      confidence: {
        h1b: h1bResult.confidence,
        opt: optResult.confidence,
        stemOpt: stemOptResult.confidence
      },
      detectedKeywords: [
        ...h1bResult.keywords,
        ...optResult.keywords,
        ...stemOptResult.keywords
      ]
    };
  }

  /**
   * Check for negative indicators
   */
  private hasNegativeIndicators(text: string): boolean {
    return NEGATIVE_KEYWORDS.some(keyword => text.includes(keyword));
  }

  /**
   * Detect H1B sponsorship with confidence scoring
   */
  private detectH1B(
    text: string,
    company: string
  ): { detected: boolean; confidence: number; keywords: string[] } {
    let score = 0;
    const detectedKeywords: string[] = [];

    // Check explicit keywords (100 points each)
    H1B_KEYWORDS.explicit.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 100;
        detectedKeywords.push(keyword);
      }
    });

    // Check strong keywords (50 points each)
    H1B_KEYWORDS.strong.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 50;
        detectedKeywords.push(keyword);
      }
    });

    // Check moderate keywords (25 points each)
    H1B_KEYWORDS.moderate.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 25;
        detectedKeywords.push(keyword);
      }
    });

    // Check if company is known H1B sponsor (50 points bonus)
    const isKnownSponsor = this.isKnownH1BSponsor(company);
    if (isKnownSponsor) {
      score += 50;
      detectedKeywords.push(`known_h1b_sponsor:${company}`);
    }

    // Calculate confidence (0-100%)
    const confidence = Math.min(100, score);

    // Decision threshold: 50+ points = likely H1B sponsor
    const detected = confidence >= 50;

    return { detected, confidence, keywords: detectedKeywords };
  }

  /**
   * Detect OPT acceptance
   */
  private detectOPT(
    text: string
  ): { detected: boolean; confidence: number; keywords: string[] } {
    let score = 0;
    const detectedKeywords: string[] = [];

    // Check explicit OPT keywords (100 points)
    OPT_KEYWORDS.explicit.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 100;
        detectedKeywords.push(keyword);
      }
    });

    // Check strong OPT keywords (60 points)
    OPT_KEYWORDS.strong.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 60;
        detectedKeywords.push(keyword);
      }
    });

    const confidence = Math.min(100, score);
    const detected = confidence >= 60; // Higher threshold for OPT

    return { detected, confidence, keywords: detectedKeywords };
  }

  /**
   * Detect STEM-OPT eligibility
   */
  private detectSTEMOPT(
    text: string
  ): { detected: boolean; confidence: number; keywords: string[] } {
    let score = 0;
    const detectedKeywords: string[] = [];

    // Check explicit STEM-OPT keywords (100 points)
    STEM_OPT_KEYWORDS.explicit.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 100;
        detectedKeywords.push(keyword);
      }
    });

    // Check STEM field keywords (40 points each)
    STEM_OPT_KEYWORDS.strong.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 40;
        detectedKeywords.push(keyword);
      }
    });

    const confidence = Math.min(100, score);
    const detected = confidence >= 70; // Higher threshold for STEM

    return { detected, confidence, keywords: detectedKeywords };
  }

  /**
   * Check if company is a known H1B sponsor
   */
  private isKnownH1BSponsor(company: string): boolean {
    const normalizedCompany = company.toLowerCase().trim();
    
    // Direct match
    if (KNOWN_H1B_SPONSORS.has(normalizedCompany)) {
      return true;
    }

    // Partial match (e.g., "Google LLC" matches "google")
    return Array.from(KNOWN_H1B_SPONSORS).some(sponsor =>
      normalizedCompany.includes(sponsor) || sponsor.includes(normalizedCompany)
    );
  }

  /**
   * Batch process multiple jobs
   */
  async processJobs(
    jobs: Array<{ title: string; description: string; company: string }>
  ): Promise<VisaSponsorshipResult[]> {
    logger.info(`Processing ${jobs.length} jobs for visa detection`);

    const results = jobs.map(job =>
      this.detectVisaSponsorship(job.title, job.description, job.company)
    );

    const sponsorCount = results.filter(r => r.h1b || r.opt || r.stemOpt).length;
    logger.info(`Found ${sponsorCount} jobs with visa sponsorship indicators`);

    return results;
  }
}

export default new VisaDetectionService();