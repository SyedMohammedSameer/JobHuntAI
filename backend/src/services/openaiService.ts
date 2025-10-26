import OpenAI from 'openai';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import logger from '../utils/logger';

interface CompletionOptions {
  maxTokens?: number;
  model?: string;
  retries?: number;
}

interface CompletionResult {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  estimatedCost: number;
  model: string;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private defaultModel: string;
  private defaultMaxTokens: number;

  constructor() {
    // Don't initialize in constructor - do it in methods
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-5-mini';
    this.defaultMaxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '3000');
  }

  /**
   * Initialize OpenAI client
   */
  private initializeClient(): void {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not configured in environment variables');
      }

      this.client = new OpenAI({
        apiKey: apiKey,
      });

      logger.info('OpenAI client initialized successfully');
    }
  }

  /**
   * Count tokens in text using tiktoken
   */
  public countTokens(text: string, model: string = 'gpt-4'): number {
    try {
      // Map model names to tiktoken models
      let tiktokenModel: TiktokenModel;
      
      if (model.includes('gpt-4')) {
        tiktokenModel = 'gpt-4';
      } else if (model.includes('gpt-3.5-turbo')) {
        tiktokenModel = 'gpt-3.5-turbo';
      } else {
        tiktokenModel = 'gpt-4'; // Default fallback
      }

      const encoding = encoding_for_model(tiktokenModel);
      const tokens = encoding.encode(text);
      const tokenCount = tokens.length;
      
      encoding.free(); // Free up memory
      
      return tokenCount;
    } catch (error) {
      logger.error('Error counting tokens:', error);
      // Fallback: rough estimate (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * Estimate cost based on token usage
   * Pricing as of 2024 (update these as needed):
   * - GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
   * - GPT-4: $0.03/1K input tokens, $0.06/1K output tokens
   */
  public estimateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    let inputCostPer1K = 0.01;
    let outputCostPer1K = 0.03;

    if (model.includes('gpt-4-turbo') || model.includes('gpt-4-1106')) {
      inputCostPer1K = 0.01;
      outputCostPer1K = 0.03;
    } else if (model.includes('gpt-4')) {
      inputCostPer1K = 0.03;
      outputCostPer1K = 0.06;
    } else if (model.includes('gpt-3.5-turbo')) {
      inputCostPer1K = 0.0005;
      outputCostPer1K = 0.0015;
    }

    const inputCost = (promptTokens / 1000) * inputCostPer1K;
    const outputCost = (completionTokens / 1000) * outputCostPer1K;

    return parseFloat((inputCost + outputCost).toFixed(4));
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate completion with retry logic and exponential backoff
   */
  public async generateCompletion(
    prompt: string,
    options: CompletionOptions = {}
  ): Promise<CompletionResult> {
    this.initializeClient();
  
    const {
      maxTokens = this.defaultMaxTokens,
      model = this.defaultModel,
      retries = 3
    } = options;
  
    let lastError: Error | null = null;
  
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        logger.info(`OpenAI API call attempt ${attempt + 1}/${retries + 1}`, {
          model,
          maxTokens,
          promptLength: prompt.length
        });
  
        const response = await this.client!.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_completion_tokens: maxTokens,
        });
  
        // ADD DETAILED LOGGING HERE
        logger.info('Raw OpenAI response:', {
          hasChoices: !!response.choices,
          choicesLength: response.choices?.length,
          firstChoice: response.choices?.[0],
          messageContent: response.choices?.[0]?.message?.content,
          finishReason: response.choices?.[0]?.finish_reason
        });
  
        const content = response.choices[0]?.message?.content || '';
  
        // CHECK IF CONTENT IS EMPTY
        if (!content || content.trim().length === 0) {
          logger.error('OpenAI returned empty content!', {
            response: JSON.stringify(response),
            finishReason: response.choices?.[0]?.finish_reason
          });
          throw new Error('OpenAI returned empty content. This may be due to content filtering or model issues.');
        }
  
        const usage = response.usage;
  
        if (!usage) {
          throw new Error('No usage information returned from OpenAI');
        }
  
        const tokensUsed = {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens
        };
  
        const estimatedCost = this.estimateCost(
          tokensUsed.prompt,
          tokensUsed.completion,
          model
        );
  
        logger.info('OpenAI API call successful', {
          tokensUsed,
          estimatedCost,
          model,
          contentLength: content.length
        });
  
        return {
          content,
          tokensUsed,
          estimatedCost,
          model
        };
  
      } catch (error: any) {
        lastError = error;
        
        logger.error(`OpenAI API call failed (attempt ${attempt + 1})`, {
          error: error.message,
          status: error.status,
          type: error.type,
          stack: error.stack
        });
  
        // Don't retry on certain errors
        if (error.status === 401 || error.status === 403) {
          throw new Error('OpenAI API authentication failed. Check your API key.');
        }
  
        if (error.status === 400) {
          throw new Error(`Invalid request to OpenAI: ${error.message}`);
        }
  
        // Rate limit error - wait longer
        if (error.status === 429) {
          const waitTime = Math.pow(2, attempt) * 2000; // 2s, 4s, 8s, 16s
          logger.warn(`Rate limited by OpenAI. Waiting ${waitTime}ms before retry...`);
          await this.sleep(waitTime);
          continue;
        }
  
        // Server error or network issue - retry with exponential backoff
        if (error.status >= 500 || error.code === 'ECONNRESET') {
          if (attempt < retries) {
            const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            logger.info(`Retrying after ${waitTime}ms...`);
            await this.sleep(waitTime);
            continue;
          }
        }
  
        // If it's the last attempt or non-retryable error, throw
        if (attempt === retries) {
          break;
        }
      }
    }
  
    // If we've exhausted all retries, throw the last error
    throw new Error(
      `OpenAI API call failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Test OpenAI connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.generateCompletion(
        'Say "Hello" if you can hear me.',
        { maxTokens: 10}
      );

      return result.content.toLowerCase().includes('hello');
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate completion for resume tailoring
   * Optimized with specific settings
   */
  public async generateResumeTailoring(
    resumeText: string,
    jobDescription: string,
    keyRequirements: string[]
  ): Promise<CompletionResult> {
    const prompt = this.buildResumeTailoringPrompt(
      resumeText,
      jobDescription,
      keyRequirements
    );

    return this.generateCompletion(prompt, {
      maxTokens: 3000,
      model: this.defaultModel
    });
  }

  /**
   * Generate completion for cover letter
   */
  public async generateCoverLetter(
    jobDetails: {
      company: string;
      position: string;
      description: string;
    },
    candidateInfo: string,
    tone: string = 'professional'
  ): Promise<CompletionResult> {
    const prompt = this.buildCoverLetterPrompt(jobDetails, candidateInfo, tone);

    return this.generateCompletion(prompt, {
      maxTokens: 1500,
      model: this.defaultModel
    });
  }

  /**
   * Build resume tailoring prompt
   */
  private buildResumeTailoringPrompt(
    resumeText: string,
    jobDescription: string,
    keyRequirements: string[]
  ): string {
    return `You are an expert resume writer and ATS optimization specialist with years of experience helping international students land their dream jobs.

TASK: Tailor the following resume for the specific job posting below. Create a compelling, ATS-optimized version that maximizes the candidate's chances.

REQUIREMENTS:
1. Maintain all factual information (dates, companies, titles, education, locations)
2. Rewrite bullet points and descriptions to highlight relevant experience
3. Incorporate keywords from the job description naturally throughout
4. Optimize for ATS (Applicant Tracking Systems) - use standard formatting and terminology
5. Keep professional tone and clear structure
6. Emphasize transferable skills that match job requirements
7. For international students: subtly highlight adaptability, cross-cultural communication, and diverse perspectives
8. Use action verbs and quantify achievements where possible
9. Ensure the resume flows naturally and reads authentically

ORIGINAL RESUME:
${resumeText}

JOB POSTING:
${jobDescription}

KEY REQUIREMENTS TO EMPHASIZE:
${keyRequirements.map((req, idx) => `${idx + 1}. ${req}`).join('\n')}

OUTPUT FORMAT:
Provide the tailored resume in clean, ATS-friendly plain text format.
Use standard section headers (SUMMARY, EXPERIENCE, EDUCATION, SKILLS, etc.).
Maintain proper formatting with clear sections.
Do not add any explanations or meta-commentary - only output the resume itself.`;
  }

  /**
   * Build cover letter prompt
   */
  private buildCoverLetterPrompt(
    jobDetails: { company: string; position: string; description: string },
    candidateInfo: string,
    tone: string
  ): string {
    const toneGuidance = this.getToneGuidance(tone);

    return `You are an expert cover letter writer specializing in helping international students craft compelling job applications.

TASK: Write a compelling, personalized cover letter for the following job application.

JOB DETAILS:
Company: ${jobDetails.company}
Position: ${jobDetails.position}

Job Description:
${jobDetails.description}

CANDIDATE BACKGROUND:
${candidateInfo}

TONE: ${tone.toUpperCase()}
${toneGuidance}

REQUIREMENTS:
1. Opening (1 paragraph): Hook the reader with most relevant experience or achievement
2. Body (2 paragraphs): 
   - Match key qualifications to job requirements with specific examples
   - Show understanding of company/role and explain why you're a great fit
3. International student considerations:
   - Briefly mention work authorization status naturally (if applicable)
   - Highlight unique perspectives and adaptability
4. Closing (1 paragraph): Strong call to action expressing enthusiasm
5. Length: 3-4 paragraphs, approximately 300-400 words
6. Avoid clichés like "I am writing to apply" or "Please find my resume attached"
7. Be specific, authentic, and memorable
8. Show genuine interest in the company and role

OUTPUT FORMAT:
Provide the cover letter in plain text format, ready to use.
Do not include [Date], [Your Name], [Your Address], or [Hiring Manager] placeholders.
Start directly with the opening paragraph.
Do not add any explanations or meta-commentary - only output the cover letter itself.`;
  }

  /**
   * Get tone-specific guidance for cover letters
   */
  private getToneGuidance(tone: string): string {
    const toneMap: Record<string, string> = {
      professional: 'Balanced, confident, and polished. Use formal language but remain approachable.',
      enthusiastic: 'Energetic and passionate. Show genuine excitement about the opportunity while maintaining professionalism.',
      conservative: 'Very formal and traditional. Use corporate language and maintain distance. Appropriate for traditional industries like finance or law.',
      creative: 'Unique and personality-driven. Take calculated risks to stand out. Appropriate for startups, creative industries, or innovative companies.'
    };

    return toneMap[tone.toLowerCase()] || toneMap.professional;
  }

  /**
   * Get service health status
   */
  public async getHealthStatus(): Promise<{
    status: string;
    configured: boolean;
    model: string;
    connectionTest?: boolean;
  }> {
    const apiKey = process.env.OPENAI_API_KEY;
    
    return {
      status: apiKey ? 'configured' : 'not_configured',
      configured: !!apiKey,
      model: this.defaultModel
    };
  }
}

// Export singleton instance
export default new OpenAIService();