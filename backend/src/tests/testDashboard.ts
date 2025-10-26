// backend/src/tests/testDashboard.ts

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dashboardService from '../services/dashboardService';
import User from '../models/User';
import Application from '../models/Application';
import Job from '../models/Job';
import Resume from '../models/Resume';
import CoverLetter from '../models/CoverLetter';

dotenv.config();

const TEST_USER_EMAIL = 'dashboard.test@example.com';

async function setupTestData() {
  console.log('\n📋 Setting up test data...\n');

  // Find or create test user
  let user = await User.findOne({ email: TEST_USER_EMAIL });
  
  if (!user) {
    user = await User.create({
      email: TEST_USER_EMAIL,
      password: 'Password123!',
      firstName: 'Dashboard',
      lastName: 'Tester',
      subscription: {
        plan: 'FREE',
        status: 'active'
      },
      aiUsage: {
        resumeTailoring: {
          count: 2,
          lastReset: new Date()
        },
        coverLetterGeneration: {
          count: 1,
          lastReset: new Date()
        }
      },
      visaType: 'F1',
      visaExpiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      workAuthorization: 'F1 - Eligible for OPT'
    });
    console.log('✅ Created test user');
  } else {
    console.log('✅ Using existing test user');
  }

  const userId = user._id.toString();

  // Clean up old test data
  console.log('🧹 Cleaning up old test data...');
  await Job.deleteMany({ sourceJobId: { $regex: /^test-job-/ } });
  await Application.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
  await Resume.deleteMany({ userId });
  await CoverLetter.deleteMany({ userId });
  user.bookmarkedJobs = [];
  await user.save();
  console.log('✅ Cleaned up old test data\n');

  // Create test jobs
  const jobs = [];
  for (let i = 0; i < 5; i++) {
    const job = await Job.create({
      title: `Software Engineer ${i + 1}`,
      company: `Tech Company ${i + 1}`,
      location: 'San Francisco, CA',
      description: 'Test job description',
      requirements: ['JavaScript', 'TypeScript', 'React'],
      responsibilities: ['Develop features', 'Write tests', 'Code reviews'],
      employmentType: 'FULL_TIME',
      experienceLevel: 'MID',
      remote: true,
      salaryMin: 80000,
      salaryMax: 120000,
      salaryCurrency: 'USD',
      visaSponsorship: {
        h1b: true,
        opt: true,
        stemOpt: true
      },
      source: 'MANUAL',
      sourceJobId: `test-job-${i}`,
      sourceUrl: `https://example.com/jobs/test-job-${i}`,
      applicationUrl: `https://example.com/apply/test-job-${i}`,
      isUniversityJob: false,
      postedDate: new Date(),
      skillsRequired: ['JavaScript', 'TypeScript', 'React'],
      industryTags: ['Technology', 'Software'],
      isActive: true,
      isFeatured: false
    });
    jobs.push(job);
  }
  console.log(`✅ Created ${jobs.length} test jobs`);

  // Bookmark some jobs in user's bookmarkedJobs array
  if (!user.bookmarkedJobs) {
    user.bookmarkedJobs = [];
  }
  for (let i = 0; i < 3; i++) {
    user.bookmarkedJobs.push(jobs[i]._id);
  }
  await user.save();
  console.log('✅ Bookmarked 3 jobs');

  // Create applications with different statuses
  const applicationStatuses = ['APPLIED', 'IN_REVIEW', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'REJECTED'];
  const applications = [];

  for (let i = 0; i < 5; i++) {
    const app = await Application.create({
      userId: new mongoose.Types.ObjectId(userId),
      jobId: jobs[i]._id,
      status: applicationStatuses[i],
      appliedDate: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000), // Staggered dates
      notes: `Test application ${i + 1}`,
      statusHistory: [{
        status: applicationStatuses[i],
        date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        notes: `Test application ${i + 1}`
      }],
      ...(applicationStatuses[i] === 'INTERVIEW_SCHEDULED' && {
        interviewDates: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
      })
    });
    applications.push(app);
  }
  console.log(`✅ Created ${applications.length} test applications`);

  // Create test resumes
  const resumes = [];
  for (let i = 0; i < 2; i++) {
    const resume = await Resume.create({
      userId,
      fileName: `resume-${i + 1}.pdf`,
      filePath: `/uploads/test/resume-${i + 1}.pdf`,
      originalText: 'Test resume content',
      type: i === 0 ? 'BASE' : 'TAILORED',
      ...(i === 1 && { jobId: jobs[0]._id.toString() }),
      metadata: {
        fileName: `resume-${i + 1}.pdf`,
        fileSize: 50000,
        uploadDate: new Date()
      }
    });
    resumes.push(resume);
  }
  console.log(`✅ Created ${resumes.length} test resumes`);

  // Create test cover letters
  const coverLetters = [];
  for (let i = 0; i < 2; i++) {
    const letter = await CoverLetter.create({
      userId,
      jobId: jobs[i]._id,
      content: 'Test cover letter content',
      jobTitle: jobs[i].title,
      company: jobs[i].company,
      tone: i === 0 ? 'professional' : 'enthusiastic',
      generatedByAI: true,
      aiModel: 'gpt-4-turbo-preview',
      metadata: {
        wordCount: 350,
        generatedDate: new Date(),
        tokensUsed: 800,
        estimatedCost: 0.016
      }
    });
    coverLetters.push(letter);
  }
  console.log(`✅ Created ${coverLetters.length} test cover letters`);

  return { userId, user };
}

async function testDashboardService() {
  try {
    console.log('\n🧪 Testing Dashboard Service...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB\n');

    // Setup test data
    const { userId } = await setupTestData();

    // Test 1: Get Dashboard Stats
    console.log('📊 Test 1: Get Dashboard Stats');
    const stats = await dashboardService.getUserDashboardStats(userId);
    console.log('Overview:', stats.overview);
    console.log('VISA Status:', stats.visaStatus);
    console.log('Trends:', stats.trends);
    console.log('AI Usage:', stats.aiUsage);
    console.log('✅ Test 1 Passed\n');

    // Test 2: Get Recent Activity
    console.log('📝 Test 2: Get Recent Activity');
    const activity = await dashboardService.getRecentActivity(userId, 10);
    console.log(`Found ${activity.length} recent activities`);
    if (activity.length > 0) {
      console.log('Sample activity:', activity[0]);
    }
    console.log('✅ Test 2 Passed\n');

    // Test 3: Get Applications by Status
    console.log('📈 Test 3: Get Applications by Status');
    const statusData = await dashboardService.getApplicationsByStatus(userId);
    console.log('Status breakdown:', statusData);
    console.log('✅ Test 3 Passed\n');

    // Test 4: Get VISA Countdown
    console.log('🛂 Test 4: Get VISA Countdown');
    const visaCountdown = await dashboardService.getVisaCountdown(userId);
    console.log('VISA Countdown:', visaCountdown);
    console.log('✅ Test 4 Passed\n');

    // Test 5: Get Application Trends (Week)
    console.log('📊 Test 5: Get Application Trends (Week)');
    const weekTrends = await dashboardService.getApplicationTrends(userId, 'week');
    console.log('Week trends:', {
      period: weekTrends.period,
      applicationsCount: weekTrends.applications.length,
      successRate: weekTrends.successRate,
      interviewRate: weekTrends.interviewRate
    });
    console.log('✅ Test 5 Passed\n');

    // Test 6: Get Application Trends (Month)
    console.log('📊 Test 6: Get Application Trends (Month)');
    const monthTrends = await dashboardService.getApplicationTrends(userId, 'month');
    console.log('Month trends:', {
      period: monthTrends.period,
      applicationsCount: monthTrends.applications.length,
      successRate: monthTrends.successRate,
      interviewRate: monthTrends.interviewRate
    });
    console.log('✅ Test 6 Passed\n');

    // Test 7: Get Application Trends (Quarter)
    console.log('📊 Test 7: Get Application Trends (Quarter)');
    const quarterTrends = await dashboardService.getApplicationTrends(userId, 'quarter');
    console.log('Quarter trends:', {
      period: quarterTrends.period,
      applicationsCount: quarterTrends.applications.length,
      successRate: quarterTrends.successRate,
      interviewRate: quarterTrends.interviewRate
    });
    console.log('✅ Test 7 Passed\n');

    console.log('🎉 All Dashboard Service tests passed!\n');

    // Summary
    console.log('📋 Summary:');
    console.log(`✅ Total Applications: ${stats.overview.totalApplications}`);
    console.log(`✅ In Review: ${stats.overview.inReview}`);
    console.log(`✅ Interviews: ${stats.overview.interviews}`);
    console.log(`✅ Offers: ${stats.overview.offers}`);
    console.log(`✅ Saved Jobs: ${stats.overview.savedJobs}`);
    console.log(`✅ Response Rate: ${stats.overview.responseRate}%`);
    console.log(`✅ Resumes: ${stats.overview.resumesUploaded}`);
    console.log(`✅ Cover Letters: ${stats.overview.coverLettersGenerated}`);
    console.log(`✅ VISA Days Remaining: ${stats.visaStatus?.daysRemaining || 'N/A'}`);
    console.log(`✅ AI Usage - Resume: ${stats.aiUsage.resumeTailoring.used}/${stats.aiUsage.resumeTailoring.limit}`);
    console.log(`✅ AI Usage - Cover Letter: ${stats.aiUsage.coverLetterGeneration.used}/${stats.aiUsage.coverLetterGeneration.limit}`);

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
testDashboardService();