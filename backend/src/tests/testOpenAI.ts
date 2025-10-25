import dotenv from 'dotenv';
import openaiService from '../services/openaiService';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

async function testOpenAIService() {
  console.log('\n🚀 Testing OpenAI Service...\n');

  try {
    // Test 1: Health Check
    console.log('📋 Test 1: Health Status Check');
    const health = await openaiService.getHealthStatus();
    console.log('Health Status:', health);
    
    if (!health.configured) {
      console.error('❌ OpenAI is not configured. Please set OPENAI_API_KEY in .env');
      return;
    }
    console.log('✅ OpenAI is configured\n');

    // Test 2: Connection Test
    console.log('📋 Test 2: Connection Test');
    const isConnected = await openaiService.testConnection();
    
    if (isConnected) {
      console.log('✅ OpenAI connection successful\n');
    } else {
      console.error('❌ OpenAI connection failed\n');
      return;
    }

    // Test 3: Token Counting
    console.log('📋 Test 3: Token Counting');
    const sampleText = 'Hello, this is a test to count tokens in a sentence.';
    const tokenCount = openaiService.countTokens(sampleText);
    console.log(`Text: "${sampleText}"`);
    console.log(`Token count: ${tokenCount}`);
    console.log('✅ Token counting works\n');

    // Test 4: Simple Completion
    console.log('📋 Test 4: Simple Completion');
    const simplePrompt = 'Write a one-sentence professional summary for a software engineer with 3 years of experience.';
    const result = await openaiService.generateCompletion(simplePrompt, {
      maxTokens: 100,
    });

    console.log('Prompt:', simplePrompt);
    console.log('Response:', result.content);
    console.log('Tokens used:', result.tokensUsed);
    console.log('Estimated cost: $', result.estimatedCost);
    console.log('✅ Simple completion works\n');

    // Test 5: Resume Tailoring (Mock)
    console.log('📋 Test 5: Resume Tailoring Simulation');
    const mockResume = `
John Doe
Software Engineer

EXPERIENCE:
ABC Company - Software Developer (2021-2023)
- Developed web applications using React and Node.js
- Collaborated with team of 5 developers
- Improved application performance by 30%

EDUCATION:
University of Technology - BS Computer Science (2021)

SKILLS:
JavaScript, React, Node.js, Python, MongoDB
    `.trim();

    const mockJobDescription = `
Senior Full Stack Developer
TechCorp Inc.

We're looking for an experienced Full Stack Developer proficient in React, Node.js, and cloud technologies. 
You will lead development of scalable web applications and mentor junior developers.

Requirements:
- 3+ years of experience with React and Node.js
- Experience with AWS or Azure
- Strong problem-solving skills
- Excellent communication skills
    `.trim();

    const keyRequirements = [
      'React and Node.js expertise',
      'Cloud technologies (AWS/Azure)',
      'Leadership and mentoring',
      'Scalable web applications'
    ];

    const tailoredResult = await openaiService.generateResumeTailoring(
      mockResume,
      mockJobDescription,
      keyRequirements
    );

    console.log('Original Resume Length:', mockResume.length, 'characters');
    console.log('Tailored Resume Preview (first 300 chars):');
    console.log(tailoredResult.content.substring(0, 300) + '...\n');
    console.log('Tokens used:', tailoredResult.tokensUsed);
    console.log('Estimated cost: $', tailoredResult.estimatedCost);
    console.log('✅ Resume tailoring works\n');

    // Test 6: Cover Letter Generation (Mock)
    console.log('📋 Test 6: Cover Letter Generation Simulation');
    const jobDetails = {
      company: 'TechCorp Inc.',
      position: 'Senior Full Stack Developer',
      description: mockJobDescription
    };

    const candidateInfo = `
Software Engineer with 3 years of experience specializing in React and Node.js.
International student from India with F-1 OPT work authorization.
Successfully delivered 10+ web applications with focus on performance optimization.
Passionate about clean code and continuous learning.
    `.trim();

    const coverLetterResult = await openaiService.generateCoverLetter(
      jobDetails,
      candidateInfo,
      'professional'
    );

    console.log('Cover Letter Preview (first 400 chars):');
    console.log(coverLetterResult.content.substring(0, 400) + '...\n');
    console.log('Tokens used:', coverLetterResult.tokensUsed);
    console.log('Estimated cost: $', coverLetterResult.estimatedCost);
    console.log('✅ Cover letter generation works\n');

    // Test 7: Cost Estimation
    console.log('📋 Test 7: Cost Analysis');
    const totalCost = result.estimatedCost + tailoredResult.estimatedCost + coverLetterResult.estimatedCost;
    console.log('Total cost for all operations: $', totalCost.toFixed(4));
    console.log('Average cost per operation: $', (totalCost / 3).toFixed(4));
    console.log('✅ Cost tracking works\n');

    console.log('🎉 All tests passed successfully!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    logger.error('OpenAI Service test error:', error);
  }
}

// Run tests
testOpenAIService();