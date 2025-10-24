// backend/src/tests/testResumeTailoring.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import resumeTailoringService from '../services/resumeTailoringService';
import Resume from '../models/Resume';
import Job from '../models/Job';
import User from '../models/User';
import logger from '../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobhuntai';

// Test data
const testUserId = new mongoose.Types.ObjectId();
const testResumeId = new mongoose.Types.ObjectId();
const testJobId = new mongoose.Types.ObjectId();

const sampleResumeText = `
JOHN DOE
Software Engineer
john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 3 years of experience in full-stack development.
Proficient in JavaScript, React, and Node.js. Strong problem-solving skills.

PROFESSIONAL EXPERIENCE

Software Developer | Tech Company Inc. | Jan 2021 - Present
- Developed web applications using React and Node.js
- Collaborated with team of 5 developers on multiple projects
- Implemented RESTful APIs and database solutions
- Participated in code reviews and sprint planning

Junior Developer | StartUp Solutions | Jun 2019 - Dec 2020
- Built responsive web interfaces using HTML, CSS, and JavaScript
- Worked on database design and optimization
- Fixed bugs and improved application performance

EDUCATION

Bachelor of Science in Computer Science
University of Technology | Graduated: May 2019
GPA: 3.7/4.0

TECHNICAL SKILLS
Languages: JavaScript, Python, HTML, CSS
Frameworks: React, Express, Django
Databases: MongoDB, PostgreSQL
Tools: Git, Docker, AWS

PROJECTS
E-Commerce Platform - Built full-stack application with React and Node.js
Task Manager - Developed project management tool with real-time updates
`;

const sampleJobDescription = `
Senior Full Stack Engineer

We are looking for an experienced Full Stack Engineer to join our growing team.

RESPONSIBILITIES:
- Design and develop scalable web applications using React and TypeScript
- Build robust backend services with Node.js and Express
- Implement GraphQL APIs and microservices architecture
- Collaborate with cross-functional teams to deliver high-quality software
- Mentor junior developers and conduct code reviews
- Optimize application performance and ensure security best practices

REQUIREMENTS:
- 3-5 years of experience in full-stack development
- Strong proficiency in JavaScript/TypeScript, React, and Node.js
- Experience with GraphQL and RESTful API design
- Knowledge of MongoDB and PostgreSQL databases
- Familiarity with Docker and Kubernetes
- Experience with AWS cloud services
- Strong problem-solving and communication skills
- Bachelor's degree in Computer Science or related field

PREFERRED QUALIFICATIONS:
- Experience with microservices architecture
- Knowledge of CI/CD pipelines
- Contributions to open-source projects
- Experience with Agile/Scrum methodologies

We offer competitive salary, health benefits, and visa sponsorship for qualified candidates.
`;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB for testing');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('MongoDB disconnection error:', error);
  }
}
async function setupTestData() {
  try {
    logger.info('Setting up test data...');

    // Delete existing test data first
    await User.deleteOne({ email: 'test@resumetailoring.com' });
    await Resume.deleteMany({ userId: testUserId });
    await Job.deleteMany({ sourceJobId: 'test-job-001' });

    // Create test user
    await User.create({
      _id: testUserId,
      email: 'test@resumetailoring.com',
      password: 'hashedpassword123',
      firstName: 'Test',
      lastName: 'User',
      aiUsage: {
        resumeTailoring: { count: 0, lastReset: new Date(), lastUsed: null },
        coverLetterGeneration: { count: 0, lastReset: new Date(), lastUsed: null }
      },
      subscription: {
        plan: 'FREE',
        features: {
          maxResumeTailoring: 3,
          maxCoverLetters: 3,
          aiPriority: false,
          unlimitedBookmarks: false
        }
      }
    });
    
    // Create test resume
    await Resume.create({
      _id: testResumeId,
      userId: testUserId,
      fileName: 'john_doe_resume.pdf',
      filePath: 'uploads/test/john_doe_resume.pdf',
      originalText: sampleResumeText,
      type: 'BASE',
      metadata: {
        wordCount: sampleResumeText.split(/\s+/).length,
        format: 'pdf',
        uploadDate: new Date()
      }
    });
    
    // Create test job
    await Job.create({
      _id: testJobId,
      title: 'Senior Full Stack Engineer',
      company: 'Tech Innovations Inc.',
      location: 'San Francisco, CA',
      description: sampleJobDescription,
      requirements: [
        '3-5 years of experience in full-stack development',
        'Strong proficiency in JavaScript/TypeScript, React, and Node.js',
        'Experience with GraphQL and RESTful API design'
      ],
      responsibilities: [],
      employmentType: 'FULL_TIME',
      experienceLevel: 'MID',
      remote: false,
      salaryMin: 120000,
      salaryMax: 180000,
      salaryCurrency: 'USD',
      visaSponsorship: {
        h1b: true,
        opt: true,
        stemOpt: true
      },
      source: 'MANUAL',
      sourceJobId: 'test-job-001',
      sourceUrl: 'https://test.com/jobs/001',
      applicationUrl: 'https://test.com/apply/001',
      isUniversityJob: false,
      postedDate: new Date(),
      skillsRequired: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      industryTags: ['Technology', 'Software'],
      views: 0,
      applications: 0,
      isActive: true,
      isFeatured: false,
      lastRefreshed: new Date()
    });

    logger.info('Test data setup complete');
  } catch (error) {
    logger.error('Error setting up test data:', error);
    throw error;
  }
}

async function cleanupTestData() {
  try {
    logger.info('Cleaning up test data...');
    
    // Delete tailored resumes created during tests
    await Resume.deleteMany({ 
      userId: testUserId,
      type: 'TAILORED'
    });

    // Optionally delete test data (comment out to keep for inspection)
    // await User.findByIdAndDelete(testUserId);
    // await Resume.findByIdAndDelete(testResumeId);
    // await Job.findByIdAndDelete(testJobId);

    logger.info('Test data cleanup complete');
  } catch (error) {
    logger.error('Error cleaning up test data:', error);
  }
}

// Test 1: Analyze Job Description
async function testAnalyzeJobDescription() {
  console.log('\n=== TEST 1: Analyze Job Description ===\n');
  
  try {
    const job = await Job.findById(testJobId);
    if (!job) throw new Error('Test job not found');

    // @ts-ignore - accessing private method for testing
    const analysis = await resumeTailoringService.analyzeJobDescription(
      job.description,
      job.title,
      job.company,
      job.requirements || []
    );

    console.log('✅ Job Analysis Results:');
    console.log(`   - Keywords found: ${analysis.keywords.length}`);
    console.log(`   - Required skills: ${analysis.requiredSkills.length}`);
    console.log(`   - Preferred skills: ${analysis.preferredSkills.length}`);
    console.log(`   - Experience level: ${analysis.experienceLevel}`);
    console.log(`   - Top keywords: ${analysis.keywords.slice(0, 10).join(', ')}`);
    console.log(`   - Industry keywords: ${analysis.industryKeywords.join(', ')}`);

    return { success: true, analysis };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 2: Complete Resume Tailoring Flow
async function testCompleteResumeTailoring() {
  console.log('\n=== TEST 2: Complete Resume Tailoring ===\n');
  
  try {
    console.log('Starting resume tailoring...');
    
    const result = await resumeTailoringService.tailorResumeForJob(
      testResumeId.toString(),
      testJobId.toString(),
      testUserId.toString()
    );

    console.log('\n✅ Resume Tailoring Completed Successfully!');
    console.log(`   - New Resume ID: ${result.resumeId}`);
    console.log(`   - ATS Score: ${result.atsScore.overallScore}%`);
    console.log(`   - Keyword Match: ${result.atsScore.keywordMatch}%`);
    console.log(`   - Skills Match: ${result.atsScore.skillsMatch}%`);
    console.log(`   - Tokens Used: ${result.tokensUsed}`);
    console.log(`   - Estimated Cost: $${result.estimatedCost.toFixed(4)}`);
    console.log(`   - Improvements Made: ${result.improvements.length}`);
    
    console.log('\n📊 ATS Score Breakdown:');
    console.log(`   - Overall: ${result.atsScore.overallScore}%`);
    console.log(`   - Keyword Match: ${result.atsScore.keywordMatch}%`);
    console.log(`   - Skills Match: ${result.atsScore.skillsMatch}%`);
    console.log(`   - Experience Match: ${result.atsScore.experienceMatch}%`);
    console.log(`   - Education Match: ${result.atsScore.educationMatch}%`);

    console.log('\n🎯 Matched Keywords (first 10):');
    result.atsScore.matchedKeywords.slice(0, 10).forEach(keyword => {
      console.log(`   - ${keyword}`);
    });

    if (result.atsScore.missingKeywords.length > 0) {
      console.log('\n⚠️  Missing Keywords (first 5):');
      result.atsScore.missingKeywords.slice(0, 5).forEach(keyword => {
        console.log(`   - ${keyword}`);
      });
    }

    console.log('\n💡 Suggestions:');
    result.atsScore.suggestions.forEach(suggestion => {
      console.log(`   - ${suggestion}`);
    });

    console.log('\n🔧 Improvements Made:');
    result.improvements.forEach(improvement => {
      console.log(`   - ${improvement}`);
    });

    console.log('\n📄 Tailored Resume Preview (first 500 chars):');
    console.log(result.tailoredContent.substring(0, 500) + '...\n');

    return { success: true, result };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 3: Usage Limit Enforcement
async function testUsageLimitEnforcement() {
  console.log('\n=== TEST 3: Usage Limit Enforcement ===\n');
  
  try {
    // Get current usage
    const user = await User.findById(testUserId);
    console.log(`Current usage: ${user?.aiUsage.resumeTailoring.count}/3`);

    // Try to tailor multiple times to test limit
    const attempts = [];
    
    for (let i = 0; i < 4; i++) {
      try {
        console.log(`\nAttempt ${i + 1}...`);
        const result = await resumeTailoringService.tailorResumeForJob(
          testResumeId.toString(),
          testJobId.toString(),
          testUserId.toString()
        );
        attempts.push({ attempt: i + 1, success: true, resumeId: result.resumeId });
        console.log(`✅ Attempt ${i + 1} succeeded`);
      } catch (error: any) {
        attempts.push({ attempt: i + 1, success: false, error: error.message });
        console.log(`❌ Attempt ${i + 1} failed: ${error.message}`);
      }
    }

    const successCount = attempts.filter(a => a.success).length;
    const failCount = attempts.filter(a => !a.success).length;

    console.log('\n📊 Results:');
    console.log(`   - Successful attempts: ${successCount}`);
    console.log(`   - Failed attempts: ${failCount}`);
    console.log(`   - Expected behavior: First 3 should succeed, 4th should fail`);

    const testPassed = successCount === 3 && failCount === 1;
    console.log(testPassed ? '\n✅ Usage limit enforcement working correctly!' : '\n❌ Usage limit enforcement not working as expected');

    return { success: testPassed, attempts };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 4: Get Tailoring History
async function testGetTailoringHistory() {
  console.log('\n=== TEST 4: Get Tailoring History ===\n');
  
  try {
    const history = await resumeTailoringService.getTailoringHistory(testUserId.toString(), 10);

    console.log(`✅ Found ${history.length} tailored resume(s)`);
    
    history.forEach((resume, index) => {
      console.log(`\n📄 Resume ${index + 1}:`);
      console.log(`   - ID: ${resume._id}`);
      console.log(`   - File: ${resume.fileName}`);
      console.log(`   - ATS Score: ${resume.metadata?.atsScore || 'N/A'}%`);
      console.log(`   - Created: ${resume.createdAt}`);
      if (resume.jobId) {
        console.log(`   - Tailored for: ${resume.jobId.title} at ${resume.jobId.company}`);
      }
    });

    return { success: true, history };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 5: Error Handling - Invalid Resume ID
async function testErrorHandling() {
  console.log('\n=== TEST 5: Error Handling ===\n');
  
  const tests = [
    {
      name: 'Invalid Resume ID',
      resumeId: new mongoose.Types.ObjectId().toString(),
      jobId: testJobId.toString(),
      userId: testUserId.toString()
    },
    {
      name: 'Invalid Job ID',
      resumeId: testResumeId.toString(),
      jobId: new mongoose.Types.ObjectId().toString(),
      userId: testUserId.toString()
    },
    {
      name: 'Invalid User ID (Access Denied)',
      resumeId: testResumeId.toString(),
      jobId: testJobId.toString(),
      userId: new mongoose.Types.ObjectId().toString()
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`\nTesting: ${test.name}`);
      await resumeTailoringService.tailorResumeForJob(
        test.resumeId,
        test.jobId,
        test.userId
      );
      console.log(`❌ Expected error but succeeded`);
      results.push({ test: test.name, success: false });
    } catch (error: any) {
      console.log(`✅ Correctly threw error: ${error.message}`);
      results.push({ test: test.name, success: true, error: error.message });
    }
  }

  const allPassed = results.every(r => r.success);
  console.log(allPassed ? '\n✅ All error handling tests passed!' : '\n❌ Some error handling tests failed');

  return { success: allPassed, results };
}

// Main test runner
async function runAllTests() {
  console.log('🚀 RESUME TAILORING SERVICE TEST SUITE\n');
  console.log('======================================\n');

  try {
    await connectDB();
    await setupTestData();

    const results = {
      test1: await testAnalyzeJobDescription(),
      test2: await testCompleteResumeTailoring(),
      test3: await testUsageLimitEnforcement(),
      test4: await testGetTailoringHistory(),
      test5: await testErrorHandling()
    };

    console.log('\n======================================');
    console.log('📊 TEST SUMMARY\n');
    
    const testResults = [
      { name: 'Job Description Analysis', passed: results.test1.success },
      { name: 'Complete Resume Tailoring', passed: results.test2.success },
      { name: 'Usage Limit Enforcement', passed: results.test3.success },
      { name: 'Tailoring History', passed: results.test4.success },
      { name: 'Error Handling', passed: results.test5.success }
    ];

    testResults.forEach((test, index) => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} Test ${index + 1}: ${test.name}`);
    });

    const totalPassed = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;

    console.log(`\n📈 Overall: ${totalPassed}/${totalTests} tests passed`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Resume Tailoring Service is working perfectly!\n');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.\n');
    }

    await cleanupTestData();

  } catch (error) {
    logger.error('Test suite error:', error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
}

// Run tests
runAllTests();