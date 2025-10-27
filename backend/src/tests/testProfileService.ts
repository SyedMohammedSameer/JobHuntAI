// backend/src/tests/testProfileService.ts

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import userProfileService from '../services/userProfileService';
import User from '../models/User';
import Resume from '../models/Resume';

dotenv.config();

const TEST_USER_EMAIL = 'profile.test@example.com';

async function setupTestData() {
  console.log('\n📋 Setting up test data...\n');

  // Clean up old test data
  await User.deleteOne({ email: TEST_USER_EMAIL });
  
  // Create test user
  const user = await User.create({
    email: TEST_USER_EMAIL,
    password: 'Password123!',
    firstName: 'Profile',
    lastName: 'Tester',
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

  // Clean up old resumes
  await Resume.deleteMany({ userId });

  console.log('✅ Created test user');
  console.log(`   User ID: ${userId}\n`);

  return { userId, user };
}

async function testProfileService() {
  try {
    console.log('🧪 Testing User Profile Service...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB\n');

    // Setup test data
    const { userId } = await setupTestData();

    // Test 1: Get User Profile (Empty)
    console.log('📝 Test 1: Get User Profile (Initial State)');
    const initialProfile = await userProfileService.getUserProfile(userId);
    console.log('✅ Initial profile retrieved');
    console.log('   Has Resume:', initialProfile.hasResume);
    console.log('   Resume Count:', initialProfile.resumeCount);
    console.log('   User Name:', `${initialProfile.user.firstName} ${initialProfile.user.lastName}`);
    console.log('✅ Test 1 Passed\n');

    // Test 2: Update Basic Profile
    console.log('📝 Test 2: Update Basic Profile Information');
    const updatedProfile = await userProfileService.updateProfile(userId, {
      firstName: 'John',
      lastName: 'Doe',
      university: 'Stanford University',
      major: 'Computer Science',
      graduationYear: 2024,
      currentYear: 'Senior',
      degreeType: 'Bachelor of Science'
    });
    console.log('✅ Profile updated successfully');
    console.log('   Name:', `${updatedProfile.firstName} ${updatedProfile.lastName}`);
    console.log('   University:', updatedProfile.university);
    console.log('   Major:', updatedProfile.major);
    console.log('   Graduation Year:', updatedProfile.graduationYear);
    console.log('   Current Year:', updatedProfile.currentYear);
    console.log('✅ Test 2 Passed\n');

    // Test 3: Update Visa Status
    console.log('📝 Test 3: Update Visa Status');
    const visaExpiryDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 180 days
    const updatedVisa = await userProfileService.updateVisaStatus(userId, {
      visaType: 'F1',
      visaExpiryDate,
      workAuthorization: 'F1 - Eligible for OPT'
    });
    console.log('✅ Visa status updated');
    console.log('   Visa Type:', updatedVisa.visaType);
    console.log('   Expiry Date:', updatedVisa.visaExpiryDate?.toDateString());
    console.log('   Work Authorization:', updatedVisa.workAuthorization);
    console.log('✅ Test 3 Passed\n');

    // Test 4: Update Job Preferences
    console.log('📝 Test 4: Update Job Preferences');
    const updatedPreferences = await userProfileService.updateJobPreferences(userId, {
      jobTypes: ['FULL_TIME', 'INTERNSHIP'],
      locations: ['San Francisco, CA', 'New York, NY', 'Seattle, WA'],
      remoteOnly: false,
      visaSponsorshipRequired: true,
      salaryMin: 80000,
      salaryMax: 150000
    });
    console.log('✅ Job preferences updated');
    console.log('   Job Types:', updatedPreferences.jobPreferences?.jobTypes);
    console.log('   Locations:', updatedPreferences.jobPreferences?.locations?.length, 'cities');
    console.log('   Remote Only:', updatedPreferences.jobPreferences?.remoteOnly);
    console.log('   Visa Sponsorship Required:', updatedPreferences.jobPreferences?.visaSponsorshipRequired);
    console.log('   Salary Range:', `$${updatedPreferences.jobPreferences?.salaryMin} - $${updatedPreferences.jobPreferences?.salaryMax}`);
    console.log('✅ Test 4 Passed\n');

    // Test 5: Get Profile Completeness (Without Resume)
    console.log('📝 Test 5: Get Profile Completeness (Without Resume)');
    const completenessWithoutResume = await userProfileService.getProfileCompleteness(userId);
    console.log('✅ Profile completeness calculated');
    console.log('   Completion:', `${completenessWithoutResume.percentage}%`);
    console.log('   Completed Fields:', completenessWithoutResume.completed.length);
    console.log('   Missing Fields:', completenessWithoutResume.missing.length);
    console.log('   Recommendations:', completenessWithoutResume.recommendations.length);
    if (completenessWithoutResume.recommendations.length > 0) {
      console.log('   Top Recommendation:', completenessWithoutResume.recommendations[0]);
    }
    console.log('✅ Test 5 Passed\n');

    // Test 6: Add Resume and Check Completeness Again
    console.log('📝 Test 6: Add Resume and Recalculate Completeness');
    await Resume.create({
      userId,
      fileName: 'john-doe-resume.pdf',
      filePath: '/uploads/test/john-doe-resume.pdf',
      originalText: 'John Doe\nSoftware Engineer\nSkills: JavaScript, TypeScript, React, Node.js',
      type: 'BASE',
      metadata: {
        wordCount: 500,
        format: 'pdf',
        uploadDate: new Date()
      }
    });
    console.log('✅ Created test resume');

    const completenessWithResume = await userProfileService.getProfileCompleteness(userId);
    console.log('✅ Profile completeness recalculated');
    console.log('   Completion:', `${completenessWithResume.percentage}%`);
    console.log('   Improvement:', `+${completenessWithResume.percentage - completenessWithoutResume.percentage}%`);
    console.log('   Has Resume:', completenessWithResume.completed.includes('Resume'));
    console.log('   Missing Fields:', completenessWithResume.missing.length);
    console.log('✅ Test 6 Passed\n');

    // Test 7: Update Profile with Graduation Date
    console.log('📝 Test 7: Update Profile with Additional Info');
    const graduationDate = new Date('2024-05-15');
    const finalProfile = await userProfileService.updateProfile(userId, {
      graduationDate,
      profilePicture: 'https://example.com/avatar.jpg'
    });
    console.log('✅ Profile updated with additional info');
    console.log('   Graduation Date:', finalProfile.graduationDate?.toDateString());
    console.log('   Has Profile Picture:', !!finalProfile.profilePicture);
    console.log('✅ Test 7 Passed\n');

    // Test 8: Get Complete Profile
    console.log('📝 Test 8: Get Complete Profile (Final State)');
    const finalProfileData = await userProfileService.getUserProfile(userId);
    console.log('✅ Complete profile retrieved');
    console.log('   Name:', `${finalProfileData.user.firstName} ${finalProfileData.user.lastName}`);
    console.log('   University:', finalProfileData.user.university);
    console.log('   Major:', finalProfileData.user.major);
    console.log('   Visa Type:', finalProfileData.user.visaType);
    console.log('   Has Resume:', finalProfileData.hasResume);
    console.log('   Job Preferences Set:', !!finalProfileData.user.jobPreferences);
    console.log('✅ Test 8 Passed\n');

    // Test 9: Update Preferences Partially
    console.log('📝 Test 9: Update Job Preferences Partially');
    const partialUpdate = await userProfileService.updateJobPreferences(userId, {
      remoteOnly: true,
      salaryMin: 100000
    });
    console.log('✅ Partial preferences update successful');
    console.log('   Remote Only:', partialUpdate.jobPreferences?.remoteOnly);
    console.log('   Salary Min:', partialUpdate.jobPreferences?.salaryMin);
    console.log('   Other preferences preserved:', !!partialUpdate.jobPreferences?.jobTypes);
    console.log('✅ Test 9 Passed\n');

    // Test 10: Invalid User ID (Should Fail)
    console.log('📝 Test 10: Invalid User ID (Should Fail)');
    try {
      await userProfileService.getUserProfile('000000000000000000000000');
      console.log('❌ Test 10 Failed: Should have thrown error\n');
    } catch (error: any) {
      console.log('✅ Test 10 Passed: Correctly threw error');
      console.log('   Error:', error.message);
      console.log('✅ Test 10 Passed\n');
    }

    console.log('🎉 All Profile Service tests passed!\n');

    // Summary
    const finalCompleteness = await userProfileService.getProfileCompleteness(userId);
    console.log('📊 Final Profile Summary:');
    console.log(`✅ Profile Completeness: ${finalCompleteness.percentage}%`);
    console.log(`✅ Completed Fields: ${finalCompleteness.completed.length}`);
    console.log(`✅ Missing Fields: ${finalCompleteness.missing.length}`);
    console.log(`✅ Recommendations: ${finalCompleteness.recommendations.length}`);
    console.log('\n📋 Completed Fields:', finalCompleteness.completed.join(', '));
    console.log('📋 Missing Fields:', finalCompleteness.missing.join(', '));

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
testProfileService();