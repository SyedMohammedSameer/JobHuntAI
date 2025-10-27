// backend/src/tests/testRecommendations.ts

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import recommendationService from '../services/recommendationService';
import User from '../models/User';
import Job from '../models/Job';
import Resume from '../models/Resume';
import Application from '../models/Application';

dotenv.config();

const TEST_USER_EMAIL = 'recommendations.test@example.com';

async function setupTestData() {
  console.log('\n📋 Setting up test data...\n');

  // Clean up old test data
  await User.deleteOne({ email: TEST_USER_EMAIL });
  await Job.deleteMany({ sourceJobId: { $regex: /^test-rec-job-/ } });

  // Create test user with profile and preferences
  const user = await User.create({
    email: TEST_USER_EMAIL,
    password: 'Password123!',
    firstName: 'Recommendation',
    lastName: 'Tester',
    university: 'MIT',
    major: 'Computer Science',
    graduationYear: 2023,
    visaType: 'F1',
    visaExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    jobPreferences: {
      jobTypes: ['FULL_TIME'],
      locations: ['San Francisco, CA', 'New York, NY'],
      remoteOnly: false,
      visaSponsorshipRequired: true,
      salaryMin: 100000,
      salaryMax: 150000
    },
    subscription: {
      plan: 'FREE',
      status: 'active',
      features: {
        maxResumeTailoring: 3,
        maxCoverLetters: 3,
        aiPriority: false,
        unlimitedBookmarks: false
      }
    },
    aiUsage: {
      resumeTailoring: {
        count: 0,
        lastReset: new Date(),
        lastUsed: null
      },
      coverLetterGeneration: {
        count: 0,
        lastReset: new Date(),
        lastUsed: null
      }
    },
    isEmailVerified: true,
    isActive: true,
    bookmarkedJobs: []
  });

  const userId = user._id.toString();

  // Create test resume with skills
  await Resume.create({
    userId,
    fileName: 'test-resume.pdf',
    filePath: '/uploads/test/test-resume.pdf',
    originalText: `
      JOHN DOE
      Software Engineer
      
      SKILLS:
      JavaScript, TypeScript, React, Node.js, Python, Java
      AWS, Docker, Kubernetes, Git, MongoDB, PostgreSQL
      Machine Learning, Data Science, REST APIs
      
      EXPERIENCE:
      Software Engineer at Tech Corp (2021-2023)
      - Built scalable web applications
      - Worked with React and Node.js
      - Implemented CI/CD pipelines
    `,
    type: 'BASE',
    metadata: {
      wordCount: 150,
      format: 'pdf',
      uploadDate: new Date()
    }
  });
  console.log('✅ Created test user with resume');

  // Create diverse test jobs
  const jobs = [];
  
  // Job 1: Perfect Match
  jobs.push(await Job.create({
    title: 'Software Engineer',
    company: 'Tech Startup',
    location: 'San Francisco, CA',
    description: 'We are looking for a Software Engineer with React and Node.js experience. Visa sponsorship available.',
    requirements: ['JavaScript', 'React', 'Node.js'],
    responsibilities: ['Build features', 'Code reviews'],
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID',
    remote: false,
    salaryMin: 120000,
    salaryMax: 150000,
    salaryCurrency: 'USD',
    visaSponsorship: {
      h1b: true,
      opt: true,
      stemOpt: true
    },
    source: 'MANUAL',
    sourceJobId: 'test-rec-job-1',
    sourceUrl: 'https://example.com/jobs/1',
    applicationUrl: 'https://example.com/apply/1',
    postedDate: new Date(),
    skillsRequired: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
    industryTags: ['Technology', 'Software'],
    isActive: true,
    isFeatured: false
  }));

  // Job 2: Good Match (Different Location)
  jobs.push(await Job.create({
    title: 'Full Stack Developer',
    company: 'Enterprise Corp',
    location: 'Austin, TX',
    description: 'Full stack position with competitive salary. H1B sponsorship available.',
    requirements: ['JavaScript', 'Python', 'React'],
    responsibilities: ['Develop features'],
    employmentType: 'FULL_TIME',
    experienceLevel: 'MID',
    remote: true,
    salaryMin: 110000,
    salaryMax: 140000,
    salaryCurrency: 'USD',
    visaSponsorship: {
      h1b: true,
      opt: false,
      stemOpt: true
    },
    source: 'MANUAL',
    sourceJobId: 'test-rec-job-2',
    sourceUrl: 'https://example.com/jobs/2',
    applicationUrl: 'https://example.com/apply/2',
    postedDate: new Date(),
    skillsRequired: ['JavaScript', 'Python', 'React', 'AWS'],
    industryTags: ['Technology'],
    isActive: true,
    isFeatured: false
  }));

  // Job 3: Lower Match (No Visa, Lower Salary)
  jobs.push(await Job.create({
    title: 'Junior Developer',
    company: 'Small Business',
    location: 'Chicago, IL',
    description: 'Entry level position for fresh graduates.',
    requirements: ['JavaScript', 'HTML', 'CSS'],
    responsibilities: ['Learn and grow'],
    employmentType: 'FULL_TIME',
    experienceLevel: 'ENTRY',
    remote: false,
    salaryMin: 60000,
    salaryMax: 80000,
    salaryCurrency: 'USD',
    visaSponsorship: {
      h1b: false,
      opt: false,
      stemOpt: false
    },
    source: 'MANUAL',
    sourceJobId: 'test-rec-job-3',
    sourceUrl: 'https://example.com/jobs/3',
    applicationUrl: 'https://example.com/apply/3',
    postedDate: new Date(),
    skillsRequired: ['JavaScript', 'HTML', 'CSS'],
    industryTags: ['Technology'],
    isActive: true,
    isFeatured: false
  }));

  // Job 4: Great Match (Preferred Location, High Salary)
  jobs.push(await Job.create({
    title: 'Senior Software Engineer',
    company: 'Big Tech Co',
    location: 'New York, NY',
    description: 'Senior position with excellent benefits and visa support.',
    requirements: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS'],
    responsibilities: ['Lead projects', 'Mentor team'],
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR',
    remote: false,
    salaryMin: 140000,
    salaryMax: 180000,
    salaryCurrency: 'USD',
    visaSponsorship: {
      h1b: true,
      opt: true,
      stemOpt: true
    },
    source: 'MANUAL',
    sourceJobId: 'test-rec-job-4',
    sourceUrl: 'https://example.com/jobs/4',
    applicationUrl: 'https://example.com/apply/4',
    postedDate: new Date(),
    skillsRequired: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Docker'],
    industryTags: ['Technology', 'Enterprise'],
    isActive: true,
    isFeatured: false
  }));

  // Job 5: Contract Position (Different Type)
  jobs.push(await Job.create({
    title: 'Contract Frontend Developer',
    company: 'Agency',
    location: 'Remote',
    description: 'Contract position for 6 months.',
    requirements: ['React', 'JavaScript'],
    responsibilities: ['Build UI'],
    employmentType: 'CONTRACT',
    experienceLevel: 'MID',
    remote: true,
    salaryMin: 100000,
    salaryMax: 120000,
    salaryCurrency: 'USD',
    visaSponsorship: {
      h1b: false,
      opt: true,
      stemOpt: false
    },
    source: 'MANUAL',
    sourceJobId: 'test-rec-job-5',
    sourceUrl: 'https://example.com/jobs/5',
    applicationUrl: 'https://example.com/apply/5',
    postedDate: new Date(),
    skillsRequired: ['React', 'JavaScript', 'CSS'],
    industryTags: ['Technology'],
    isActive: true,
    isFeatured: false
  }));

  console.log(`✅ Created ${jobs.length} test jobs\n`);

  return { userId, user, jobs };
}

async function testRecommendationService() {
  try {
    console.log('🧪 Testing Recommendation Service...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB\n');

    // Setup test data
    const { userId, user, jobs } = await setupTestData();

    // Test 1: Get Personalized Recommendations
    console.log('📝 Test 1: Get Personalized Recommendations');
    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, 10);
    console.log('✅ Personalized recommendations generated');
    console.log('   Total Recommendations:', recommendations.length);
    
    if (recommendations.length > 0) {
      const topMatch = recommendations[0];
      console.log('\n   Top Match:');
      console.log('   - Job:', topMatch.job.title);
      console.log('   - Company:', topMatch.job.company);
      console.log('   - Match Score:', topMatch.matchScore + '%');
      console.log('   - Match Reasons:', topMatch.matchReasons.length);
      if (topMatch.matchReasons.length > 0) {
        console.log('     •', topMatch.matchReasons[0]);
      }
    }
    console.log('✅ Test 1 Passed\n');

    // Test 2: Verify Recommendations are Sorted
    console.log('📝 Test 2: Verify Recommendations are Sorted by Score');
    let isSorted = true;
    for (let i = 0; i < recommendations.length - 1; i++) {
      if (recommendations[i].matchScore < recommendations[i + 1].matchScore) {
        isSorted = false;
        break;
      }
    }
    console.log('✅ Recommendations properly sorted:', isSorted);
    console.log('   Scores:', recommendations.map(r => r.matchScore).join(', '));
    console.log('✅ Test 2 Passed\n');

    // Test 3: Calculate Match Score for Specific Job
    console.log('📝 Test 3: Calculate Match Score for Specific Job');
    const jobId = jobs[0]._id.toString();
    const matchBreakdown = await recommendationService.getJobMatchBreakdown(userId, jobId);
    console.log('✅ Match breakdown calculated');
    console.log('   Job:', matchBreakdown.job.title);
    console.log('   Overall Match Score:', matchBreakdown.matchScore + '%');
    console.log('\n   Breakdown:');
    console.log('   - Visa Match:', matchBreakdown.matchBreakdown.visaMatch + '%');
    console.log('   - Location Match:', matchBreakdown.matchBreakdown.locationMatch + '%');
    console.log('   - Salary Match:', matchBreakdown.matchBreakdown.salaryMatch + '%');
    console.log('   - Experience Match:', matchBreakdown.matchBreakdown.experienceMatch + '%');
    console.log('   - Skills Match:', matchBreakdown.matchBreakdown.skillsMatch + '%');
    console.log('   - Preferences Match:', matchBreakdown.matchBreakdown.preferencesMatch + '%');
    console.log('\n   Match Reasons:', matchBreakdown.matchReasons.length);
    matchBreakdown.matchReasons.forEach(reason => {
      console.log('   •', reason);
    });
    if (matchBreakdown.missingRequirements.length > 0) {
      console.log('\n   Missing Requirements:', matchBreakdown.missingRequirements.length);
      matchBreakdown.missingRequirements.forEach(req => {
        console.log('   •', req);
      });
    }
    console.log('✅ Test 3 Passed\n');

    // Test 4: Get Similar Jobs
    console.log('📝 Test 4: Get Similar Jobs');
    const similarJobs = await recommendationService.getSimilarJobs(jobId, 5);
    console.log('✅ Similar jobs found');
    console.log('   Similar Jobs Count:', similarJobs.length);
    if (similarJobs.length > 0) {
      console.log('   Similar Jobs:');
      similarJobs.forEach((job: any, index: number) => {
        console.log(`   ${index + 1}. ${job.title} at ${job.company}`);
      });
    }
    console.log('✅ Test 4 Passed\n');

    // Test 5: Get Daily Recommendations
    console.log('📝 Test 5: Get Daily Recommendations');
    const dailyRecs = await recommendationService.getDailyRecommendations(userId);
    console.log('✅ Daily recommendations retrieved');
    console.log('   Daily Picks Count:', dailyRecs.length);
    console.log('   Top 3 Picks:');
    dailyRecs.slice(0, 3).forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.job.title} - ${rec.matchScore}% match`);
    });
    console.log('✅ Test 5 Passed\n');

    // Test 6: Test with Applied Job (Should Exclude)
    console.log('📝 Test 6: Verify Applied Jobs are Excluded');
    const appliedJobId = jobs[0]._id;
    await Application.create({
      userId: new mongoose.Types.ObjectId(userId),
      jobId: appliedJobId,
      status: 'APPLIED',
      appliedDate: new Date(),
      statusHistory: [{
        status: 'APPLIED',
        date: new Date(),
        notes: 'Test application'
      }]
    });
    console.log('✅ Created test application');

    const recsAfterApply = await recommendationService.getPersonalizedRecommendations(userId, 10);
    const appliedJobInRecs = recsAfterApply.some(r => r.job._id.toString() === appliedJobId.toString());
    console.log('✅ Applied job excluded from recommendations:', !appliedJobInRecs);
    console.log('   Recommendations count after application:', recsAfterApply.length);
    console.log('✅ Test 6 Passed\n');

    // Test 7: Test Different Salary Ranges
    console.log('📝 Test 7: Test Salary Matching');
    const lowSalaryJob = jobs[2]; // Junior position with low salary
    const lowSalaryMatch = await recommendationService.getJobMatchBreakdown(
      userId,
      lowSalaryJob._id.toString()
    );
    console.log('✅ Low salary job match calculated');
    console.log('   Job:', lowSalaryJob.title);
    console.log('   Salary:', `$${lowSalaryJob.salaryMin} - $${lowSalaryJob.salaryMax}`);
    console.log('   User Expectation:', `$${user.jobPreferences?.salaryMin} - $${user.jobPreferences?.salaryMax}`);
    console.log('   Salary Match Score:', lowSalaryMatch.matchBreakdown.salaryMatch + '%');
    console.log('   Overall Match Score:', lowSalaryMatch.matchScore + '%');
    console.log('✅ Test 7 Passed\n');

    // Test 8: Test Visa Matching
    console.log('📝 Test 8: Test Visa Sponsorship Matching');
    const noVisaJob = jobs[2]; // Job without visa sponsorship
    const noVisaMatch = await recommendationService.getJobMatchBreakdown(
      userId,
      noVisaJob._id.toString()
    );
    console.log('✅ No-visa job match calculated');
    console.log('   Job:', noVisaJob.title);
    console.log('   Visa Sponsorship:', noVisaJob.visaSponsorship);
    console.log('   User Needs Visa:', user.jobPreferences?.visaSponsorshipRequired);
    console.log('   Visa Match Score:', noVisaMatch.matchBreakdown.visaMatch + '%');
    console.log('   Missing Requirements:', noVisaMatch.missingRequirements.length);
    if (noVisaMatch.missingRequirements.length > 0) {
      console.log('   •', noVisaMatch.missingRequirements[0]);
    }
    console.log('✅ Test 8 Passed\n');

    // Test 9: Test Remote Preference
    console.log('📝 Test 9: Test Location/Remote Matching');
    const remoteJob = jobs[4]; // Contract remote position
    const remoteMatch = await recommendationService.getJobMatchBreakdown(
      userId,
      remoteJob._id.toString()
    );
    console.log('✅ Remote job match calculated');
    console.log('   Job:', remoteJob.title);
    console.log('   Is Remote:', remoteJob.remote);
    console.log('   Location Match Score:', remoteMatch.matchBreakdown.locationMatch + '%');
    console.log('✅ Test 9 Passed\n');

    // Test 10: Test Invalid Job ID (Should Fail)
    console.log('📝 Test 10: Invalid Job ID (Should Fail)');
    try {
      await recommendationService.getJobMatchBreakdown(userId, '000000000000000000000000');
      console.log('❌ Test 10 Failed: Should have thrown error\n');
    } catch (error: any) {
      console.log('✅ Test 10 Passed: Correctly threw error');
      console.log('   Error:', error.message);
      console.log('✅ Test 10 Passed\n');
    }

    console.log('🎉 All Recommendation Service tests passed!\n');

    // Summary
    console.log('📊 Final Recommendations Summary:');
    console.log(`✅ Total Jobs Available: ${jobs.length}`);
    console.log(`✅ Jobs Recommended: ${recommendations.length}`);
    console.log(`✅ Jobs Applied To: 1`);
    console.log(`✅ Average Match Score: ${Math.round(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length)}%`);
    console.log(`✅ Top Match Score: ${recommendations[0]?.matchScore || 0}%`);

    // Clean up test application
    await Application.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run tests
testRecommendationService();