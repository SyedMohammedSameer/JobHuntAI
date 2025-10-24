// backend/src/tests/testCoverLetter.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import coverLetterService from '../services/coverLetterService';
import CoverLetter from '../models/CoverLetter';
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
JANE SMITH
Product Manager
jane.smith@email.com | (555) 987-6543 | linkedin.com/in/janesmith

SUMMARY
Results-driven Product Manager with 4 years of experience leading cross-functional teams to deliver innovative software products. Skilled in Agile methodologies, user research, and data-driven decision making.

PROFESSIONAL EXPERIENCE

Senior Product Manager | TechCorp Inc. | Jan 2022 - Present
- Led product development for SaaS platform serving 50,000+ users
- Increased user engagement by 45% through feature prioritization and UX improvements
- Managed product roadmap and coordinated with engineering, design, and marketing teams
- Conducted user interviews and analyzed metrics to inform product decisions

Product Manager | StartupXYZ | Jun 2020 - Dec 2021
- Launched 3 major product features that generated $2M in additional revenue
- Collaborated with stakeholders to define product vision and strategy
- Implemented Agile/Scrum processes that improved team velocity by 30%

EDUCATION

Master of Business Administration (MBA)
Stanford University | Graduated: May 2020
Focus: Technology Management

Bachelor of Science in Computer Science
UC Berkeley | Graduated: May 2018
GPA: 3.8/4.0

TECHNICAL SKILLS
Product Management: Jira, Asana, Confluence, Figma, Miro
Analytics: Google Analytics, Mixpanel, Tableau
Technical: SQL, Python, API fundamentals, Agile/Scrum
`;

const sampleJobDescription = `
Product Manager - AI Platform

We're seeking an experienced Product Manager to lead our AI-powered analytics platform. You'll work with cutting-edge technology to build products that help businesses make data-driven decisions.

RESPONSIBILITIES:
- Define product vision and strategy for AI/ML features
- Collaborate with data scientists, engineers, and designers
- Conduct user research and competitive analysis
- Manage product roadmap and prioritize features
- Work cross-functionally to deliver high-quality products
- Present product updates to leadership and stakeholders

REQUIREMENTS:
- 3-5 years of product management experience
- Strong understanding of AI/ML concepts
- Experience with data analytics platforms
- Excellent communication and leadership skills
- Bachelor's degree in Computer Science, Engineering, or related field
- MBA or advanced degree preferred
- Experience with Agile/Scrum methodologies

PREFERRED QUALIFICATIONS:
- Experience in B2B SaaS products
- Technical background or coding experience
- Data-driven mindset with strong analytical skills
- Previous startup experience

We offer competitive salary, equity, comprehensive benefits, and visa sponsorship for qualified candidates. Join our mission-driven team in San Francisco!
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

    // Delete existing test data
    await User.deleteOne({ email: 'test@coverletter.com' });
    await Resume.deleteMany({ userId: testUserId });
    await Job.deleteMany({ sourceJobId: 'test-job-cl-001' });
    await CoverLetter.deleteMany({ userId: testUserId });

    // Create test user
    await User.create({
      _id: testUserId,
      email: 'test@coverletter.com',
      password: 'hashedpassword123',
      firstName: 'Jane',
      lastName: 'Smith',
      university: 'Stanford University',
      major: 'Computer Science',
      degreeType: 'MBA',
      visaType: 'F1',
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
      fileName: 'jane_smith_resume.pdf',
      filePath: 'uploads/test/jane_smith_resume.pdf',
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
      title: 'Product Manager - AI Platform',
      company: 'AI Innovations Inc.',
      location: 'San Francisco, CA',
      description: sampleJobDescription,
      requirements: [
        '3-5 years of product management experience',
        'Strong understanding of AI/ML concepts',
        'Experience with data analytics platforms'
      ],
      responsibilities: [],
      employmentType: 'FULL_TIME',
      experienceLevel: 'MID',
      remote: false,
      salaryMin: 140000,
      salaryMax: 200000,
      salaryCurrency: 'USD',
      visaSponsorship: {
        h1b: true,
        opt: true,
        stemOpt: true
      },
      source: 'MANUAL',
      sourceJobId: 'test-job-cl-001',
      sourceUrl: 'https://test.com/jobs/cl-001',
      applicationUrl: 'https://test.com/apply/cl-001',
      isUniversityJob: false,
      postedDate: new Date(),
      skillsRequired: ['Product Management', 'AI/ML', 'Data Analytics'],
      industryTags: ['Technology', 'AI', 'SaaS'],
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
    await CoverLetter.deleteMany({ userId: testUserId });
    logger.info('Test data cleanup complete');
  } catch (error) {
    logger.error('Error cleaning up test data:', error);
  }
}

// Test 1: Generate Cover Letter - Professional Tone
async function testProfessionalTone() {
  console.log('\n=== TEST 1: Professional Tone ===\n');
  
  try {
    const result = await coverLetterService.generateCoverLetter({
      jobId: testJobId.toString(),
      userId: testUserId.toString(),
      resumeId: testResumeId.toString(),
      tone: 'professional'
    });

    console.log('✅ Professional Cover Letter Generated!');
    console.log(`   - Cover Letter ID: ${result.coverLetterId}`);
    console.log(`   - Tone: ${result.tone}`);
    console.log(`   - Word Count: ${result.wordCount}`);
    console.log(`   - Tokens Used: ${result.tokensUsed}`);
    console.log(`   - Estimated Cost: $${result.estimatedCost.toFixed(4)}`);
    console.log(`\n📄 Preview (first 300 chars):\n${result.content.substring(0, 300)}...\n`);

    return { success: true, result };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 2: Generate Cover Letter - Enthusiastic Tone
async function testEnthusiasticTone() {
  console.log('\n=== TEST 2: Enthusiastic Tone ===\n');
  
  try {
    const result = await coverLetterService.generateCoverLetter({
      jobId: testJobId.toString(),
      userId: testUserId.toString(),
      resumeId: testResumeId.toString(),
      tone: 'enthusiastic'
    });

    console.log('✅ Enthusiastic Cover Letter Generated!');
    console.log(`   - Tone: ${result.tone}`);
    console.log(`   - Word Count: ${result.wordCount}`);
    console.log(`\n📄 Preview (first 300 chars):\n${result.content.substring(0, 300)}...\n`);

    return { success: true, result };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 3: Generate Cover Letter - Conservative Tone
async function testConservativeTone() {
  console.log('\n=== TEST 3: Conservative Tone ===\n');
  
  try {
    const result = await coverLetterService.generateCoverLetter({
      jobId: testJobId.toString(),
      userId: testUserId.toString(),
      resumeId: testResumeId.toString(),
      tone: 'conservative'
    });

    console.log('✅ Conservative Cover Letter Generated!');
    console.log(`   - Tone: ${result.tone}`);
    console.log(`   - Word Count: ${result.wordCount}`);
    console.log(`\n📄 Preview (first 300 chars):\n${result.content.substring(0, 300)}...\n`);

    return { success: true, result };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 4: Generate Cover Letter - Creative Tone
async function testCreativeTone() {
  console.log('\n=== TEST 4: Creative Tone ===\n');
  
  try {
    const result = await coverLetterService.generateCoverLetter({
      jobId: testJobId.toString(),
      userId: testUserId.toString(),
      resumeId: testResumeId.toString(),
      tone: 'creative'
    });

    console.log('✅ Creative Cover Letter Generated!');
    console.log(`   - Tone: ${result.tone}`);
    console.log(`   - Word Count: ${result.wordCount}`);
    console.log(`\n📄 Preview (first 300 chars):\n${result.content.substring(0, 300)}...\n`);

    return { success: true, result };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 5: Usage Limit Enforcement
async function testUsageLimits() {
  console.log('\n=== TEST 5: Usage Limit Enforcement ===\n');
  
  try {
    const user = await User.findById(testUserId);
    console.log(`Current usage: ${user?.aiUsage.coverLetterGeneration.count}/3`);

    const attempts = [];
    
    for (let i = 0; i < 4; i++) {
      try {
        console.log(`\nAttempt ${i + 1}...`);
        const result = await coverLetterService.generateCoverLetter({
          jobId: testJobId.toString(),
          userId: testUserId.toString(),
          resumeId: testResumeId.toString(),
          tone: 'professional'
        });
        attempts.push({ attempt: i + 1, success: true });
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
    console.log(`   - Expected: First 3 succeed, 4th fails`);

    const testPassed = successCount === 3 && failCount === 1;
    console.log(testPassed ? '\n✅ Usage limit enforcement working!' : '\n❌ Usage limit not working correctly');

    return { success: testPassed, attempts };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 6: Get Cover Letter History
async function testGetHistory() {
  console.log('\n=== TEST 6: Cover Letter History ===\n');
  
  try {
    const history = await coverLetterService.getCoverLetterHistory(testUserId.toString(), 10);

    console.log(`✅ Found ${history.length} cover letter(s)`);
    
    history.forEach((letter, index) => {
      console.log(`\n📄 Cover Letter ${index + 1}:`);
      console.log(`   - ID: ${letter._id}`);
      console.log(`   - Tone: ${letter.tone}`);
      console.log(`   - Word Count: ${letter.metadata?.wordCount || 'N/A'}`);
      console.log(`   - Created: ${letter.createdAt}`);
      if (letter.jobId) {
        console.log(`   - For: ${letter.jobId.title} at ${letter.jobId.company}`);
      }
    });

    return { success: true, history };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

// Test 7: Error Handling
async function testErrorHandling() {
  console.log('\n=== TEST 7: Error Handling ===\n');
  
  const tests = [
    {
      name: 'Invalid Job ID',
      jobId: new mongoose.Types.ObjectId().toString(),
      userId: testUserId.toString()
    },
    {
      name: 'Invalid User ID',
      jobId: testJobId.toString(),
      userId: new mongoose.Types.ObjectId().toString()
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`\nTesting: ${test.name}`);
      await coverLetterService.generateCoverLetter({
        jobId: test.jobId,
        userId: test.userId,
        tone: 'professional'
      });
      console.log(`❌ Expected error but succeeded`);
      results.push({ test: test.name, success: false });
    } catch (error: any) {
      console.log(`✅ Correctly threw error: ${error.message}`);
      results.push({ test: test.name, success: true });
    }
  }

  const allPassed = results.every(r => r.success);
  console.log(allPassed ? '\n✅ All error handling tests passed!' : '\n❌ Some tests failed');

  return { success: allPassed, results };
}

// Main test runner
async function runAllTests() {
  console.log('🚀 COVER LETTER SERVICE TEST SUITE\n');
  console.log('======================================\n');

  try {
    await connectDB();
    await setupTestData();

    const results = {
      test1: await testProfessionalTone(),
      test2: await testEnthusiasticTone(),
      test3: await testConservativeTone(),
      test4: await testCreativeTone(),
      test5: await testUsageLimits(),
      test6: await testGetHistory(),
      test7: await testErrorHandling()
    };

    console.log('\n======================================');
    console.log('📊 TEST SUMMARY\n');
    
    const testResults = [
      { name: 'Professional Tone', passed: results.test1.success },
      { name: 'Enthusiastic Tone', passed: results.test2.success },
      { name: 'Conservative Tone', passed: results.test3.success },
      { name: 'Creative Tone', passed: results.test4.success },
      { name: 'Usage Limit Enforcement', passed: results.test5.success },
      { name: 'Cover Letter History', passed: results.test6.success },
      { name: 'Error Handling', passed: results.test7.success }
    ];

    testResults.forEach((test, index) => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} Test ${index + 1}: ${test.name}`);
    });

    const totalPassed = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;

    console.log(`\n📈 Overall: ${totalPassed}/${totalTests} tests passed`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Cover Letter Service is perfect!\n');
    } else {
      console.log('⚠️  Some tests failed. Review errors above.\n');
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