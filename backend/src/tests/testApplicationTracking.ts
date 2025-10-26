// backend/src/tests/testApplicationTracking.ts

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import applicationTrackingService from '../services/applicationTrackingService';
import User from '../models/User';
import Job from '../models/Job';
import Application from '../models/Application';

dotenv.config();

const TEST_USER_EMAIL = 'apptracking.test@example.com';

async function setupTestData() {
  console.log('\n📋 Setting up test data...\n');

  // Find or create test user
  let user = await User.findOne({ email: TEST_USER_EMAIL });
  
  if (!user) {
    user = await User.create({
      email: TEST_USER_EMAIL,
      password: 'Password123!',
      firstName: 'Application',
      lastName: 'Tester',
      subscription: {
        plan: 'FREE',
        status: 'active'
      }
    });
    console.log('✅ Created test user');
  } else {
    console.log('✅ Using existing test user');
  }

  const userId = user._id.toString();

  // Clean up old test data
  console.log('🧹 Cleaning up old test data...');
  await Job.deleteMany({ sourceJobId: { $regex: /^test-apptrack-job-/ } });
  await Application.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
  console.log('✅ Cleaned up old test data\n');

  // Create test jobs
  const jobs = [];
  const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'];
  
  for (let i = 0; i < 5; i++) {
    const job = await Job.create({
      title: `Software Engineer ${i + 1}`,
      company: companies[i],
      location: 'San Francisco, CA',
      description: 'Test job description for application tracking',
      requirements: ['JavaScript', 'TypeScript', 'React'],
      responsibilities: ['Develop features', 'Write tests', 'Code reviews'],
      employmentType: 'FULL_TIME',
      experienceLevel: 'MID',
      remote: true,
      salaryMin: 100000 + (i * 10000),
      salaryMax: 150000 + (i * 15000),
      salaryCurrency: 'USD',
      visaSponsorship: {
        h1b: true,
        opt: true,
        stemOpt: true
      },
      source: 'MANUAL',
      sourceJobId: `test-apptrack-job-${i}`,
      sourceUrl: `https://example.com/jobs/test-apptrack-job-${i}`,
      applicationUrl: `https://example.com/apply/test-apptrack-job-${i}`,
      isUniversityJob: false,
      postedDate: new Date(),
      skillsRequired: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      industryTags: ['Technology', 'Software', 'Engineering'],
      isActive: true,
      isFeatured: false
    });
    jobs.push(job);
  }
  console.log(`✅ Created ${jobs.length} test jobs\n`);

  return { userId, jobs };
}

async function testApplicationTrackingService() {
  try {
    console.log('🧪 Testing Application Tracking Service...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB\n');

    // Setup test data
    const { userId, jobs } = await setupTestData();

    // Test 1: Create Application
    console.log('📝 Test 1: Create Application');
    const app1 = await applicationTrackingService.createApplication({
      userId,
      jobId: jobs[0]._id.toString(),
      status: 'APPLIED',
      notes: 'Applied through company website'
    });
    console.log('✅ Created application:', app1._id);
    console.log('   Status:', app1.status);
    console.log('   Status history entries:', app1.statusHistory.length);
    console.log('✅ Test 1 Passed\n');

    // Test 2: Create Application (Duplicate - Should Fail)
    console.log('📝 Test 2: Create Duplicate Application (Should Fail)');
    try {
      await applicationTrackingService.createApplication({
        userId,
        jobId: jobs[0]._id.toString(),
        status: 'APPLIED'
      });
      console.log('❌ Test 2 Failed: Should have thrown error\n');
    } catch (error: any) {
      console.log('✅ Test 2 Passed: Correctly prevented duplicate');
      console.log('   Error message:', error.message);
      console.log('✅ Test 2 Passed\n');
    }

    // Test 3: Update Application Status
    console.log('📝 Test 3: Update Application Status');
    const updatedApp = await applicationTrackingService.updateApplicationStatus(
      app1._id.toString(),
      userId,
      {
        status: 'IN_REVIEW',
        notes: 'Recruiter reached out'
      }
    );
    console.log('✅ Updated application status to:', updatedApp.status);
    console.log('   Status history entries:', updatedApp.statusHistory.length);
    console.log('✅ Test 3 Passed\n');

    // Test 4: Update to Interview with Date
    console.log('📝 Test 4: Update to Interview Status');
    const interviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const interviewApp = await applicationTrackingService.updateApplicationStatus(
      app1._id.toString(),
      userId,
      {
        status: 'INTERVIEW_SCHEDULED',
        interviewDates: [interviewDate],
        notes: 'Technical interview scheduled'
      }
    );
    console.log('✅ Updated to interview status');
    console.log('   Interview dates:', interviewApp.interviewDates);
    console.log('   Status history entries:', interviewApp.statusHistory.length);
    console.log('✅ Test 4 Passed\n');

    // Test 5: Invalid Status Transition (Should Fail)
    console.log('📝 Test 5: Invalid Status Transition (Should Fail)');
    try {
      await applicationTrackingService.updateApplicationStatus(
        app1._id.toString(),
        userId,
        { status: 'SAVED' } // Can't go back to saved from interview
      );
      console.log('❌ Test 5 Failed: Should have thrown error\n');
    } catch (error: any) {
      console.log('✅ Test 5 Passed: Correctly prevented invalid transition');
      console.log('   Error message:', error.message);
      console.log('✅ Test 5 Passed\n');
    }

    // Test 6: Get Application Timeline
    console.log('📝 Test 6: Get Application Timeline');
    const timeline = await applicationTrackingService.getApplicationTimeline(
      app1._id.toString(),
      userId
    );
    console.log('✅ Timeline retrieved:');
    console.log('   Current status:', timeline.currentStatus);
    console.log('   Timeline entries:', timeline.timeline.length);
    console.log('   Next steps:', timeline.nextSteps.length, 'suggestions');
    timeline.timeline.forEach((entry: any, index: number) => {
      console.log(`   ${index + 1}. ${entry.status} - ${new Date(entry.timestamp).toLocaleDateString()}`);
    });
    console.log('✅ Test 6 Passed\n');

    // Test 7: Create Multiple Applications
    console.log('📝 Test 7: Create Multiple Applications');
    const apps = [];
    for (let i = 1; i < 4; i++) {
      const app = await applicationTrackingService.createApplication({
        userId,
        jobId: jobs[i]._id.toString(),
        status: 'APPLIED',
        notes: `Applied to ${jobs[i].company}`
      });
      apps.push(app);
    }
    console.log(`✅ Created ${apps.length} more applications`);
    console.log('✅ Test 7 Passed\n');

    // Test 8: Get All Applications with Filters
    console.log('📝 Test 8: Get Applications with Filters');
    const result = await applicationTrackingService.getApplications(
      userId,
      { status: 'APPLIED' as any },
      { page: 1, limit: 10, sortBy: 'appliedDate', sortOrder: 'desc' }
    );
    console.log(`✅ Found ${result.applications.length} applications with status 'APPLIED'`);
    console.log('   Pagination:', result.pagination);
    console.log('✅ Test 8 Passed\n');

    // Test 9: Get Upcoming Interviews
    console.log('📝 Test 9: Get Upcoming Interviews');
    const interviews = await applicationTrackingService.getUpcomingInterviews(userId, 30);
    console.log(`✅ Found ${interviews.length} upcoming interviews`);
    if (interviews.length > 0) {
      interviews.forEach((interview: any) => {
        console.log(`   - ${interview.jobTitle} at ${interview.company}`);
        console.log(`     Date: ${new Date(interview.interviewDate).toLocaleDateString()}`);
        console.log(`     Days until: ${interview.daysUntil}`);
      });
    }
    console.log('✅ Test 9 Passed\n');

    // Test 10: Get Application Metrics
    console.log('📝 Test 10: Get Application Metrics');
    const metrics = await applicationTrackingService.getApplicationMetrics(userId);
    console.log('✅ Metrics calculated:');
    console.log('   Total applications:', metrics.totalApplications);
    console.log('   Response rate:', metrics.responseRate + '%');
    console.log('   Interview rate:', metrics.interviewRate + '%');
    console.log('   Offer rate:', metrics.offerRate + '%');
    console.log('   Average response time:', metrics.averageResponseTime, 'days');
    console.log('   Companies applied to:', metrics.byCompany.length);
    console.log('   Job types:', metrics.byJobType.length);
    console.log('   Time to interview (avg):', metrics.timeToInterview.average, 'days');
    console.log('✅ Test 10 Passed\n');

    // Test 11: Update to Interviewed, then Offer Status
    console.log('📝 Test 11: Update to Interviewed, then Offer Status');
    
    // First update to INTERVIEWED
    const interviewedApp = await applicationTrackingService.updateApplicationStatus(
      app1._id.toString(),
      userId,
      {
        status: 'INTERVIEWED',
        notes: 'Completed technical interview'
      }
    );
    console.log('✅ Updated to interviewed status');
    console.log('   Status:', interviewedApp.status);
    
    // Then update to OFFER_RECEIVED
    const offerApp = await applicationTrackingService.updateApplicationStatus(
      app1._id.toString(),
      userId,
      {
        status: 'OFFER_RECEIVED',
        offerDetails: {
          salary: 130000,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          benefits: 'Health, Dental, 401k, Stock options',
          location: 'San Francisco, CA',
          remote: true
        },
        notes: 'Received offer!'
      }
    );
    console.log('✅ Updated to offer status');
    console.log('   Offer salary:', offerApp.offerDetails?.salary);
    console.log('   Start date:', offerApp.offerDetails?.startDate);
    console.log('   Status history entries:', offerApp.statusHistory.length);
    console.log('✅ Test 11 Passed\n');

    // Test 12: Get Applications by Job
    console.log('📝 Test 12: Get Applications by Job');
    const jobApps = await applicationTrackingService.getApplicationsByJob(
      userId,
      jobs[0]._id.toString()
    );
    console.log(`✅ Found ${jobApps.length} application(s) for ${jobs[0].company}`);
    console.log('✅ Test 12 Passed\n');

    // Test 13: Delete Application
    console.log('📝 Test 13: Delete Application');
    const deleteResult = await applicationTrackingService.deleteApplication(
      apps[0]._id.toString(),
      userId
    );
    console.log('✅ Application deleted successfully');
    console.log('   Result:', deleteResult.message);
    console.log('✅ Test 13 Passed\n');

    console.log('🎉 All Application Tracking Service tests passed!\n');

    // Final Summary
    const finalMetrics = await applicationTrackingService.getApplicationMetrics(userId);
    console.log('📊 Final Summary:');
    console.log(`✅ Total Applications: ${finalMetrics.totalApplications}`);
    console.log(`✅ Response Rate: ${finalMetrics.responseRate}%`);
    console.log(`✅ Interview Rate: ${finalMetrics.interviewRate}%`);
    console.log(`✅ Offer Rate: ${finalMetrics.offerRate}%`);
    console.log(`✅ Upcoming Interviews: ${interviews.length}`);

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
testApplicationTrackingService();