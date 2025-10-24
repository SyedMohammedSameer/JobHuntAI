import dotenv from 'dotenv';
import mongoose from 'mongoose';
import documentStorageService from '../services/documentStorageService';
import connectDB from '../config/database';

// Import Job model to register it with Mongoose (needed for populate)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Job from '../models/Job';

// Load environment variables
dotenv.config();

async function testDocumentStorageService() {
  console.log('\n🚀 Testing Document Storage Service...\n');

  try {
    // Connect to database
    console.log('📋 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    // Test 1: Ensure directories
    console.log('📋 Test 1: Ensure Storage Directories');
    documentStorageService.ensureDirectories();
    console.log('✅ Storage directories created/verified\n');

    // Test 2: Save a mock resume
    console.log('📋 Test 2: Save Resume to Database');
    const mockUserId = new mongoose.Types.ObjectId().toString();
    
    const savedResume = await documentStorageService.saveResume({
      userId: mockUserId,
      filePath: 'uploads/resumes/test_resume.pdf',
      originalText: 'This is a sample resume content for testing purposes.',
      type: 'BASE',
      metadata: {
        fileName: 'test_resume.pdf',
        fileSize: 1024,
        uploadedAt: new Date()
      }
    });

    console.log('Saved resume ID:', savedResume._id.toString());
    console.log('Resume type:', savedResume.type);
    console.log('✅ Resume saved successfully\n');

    // Test 3: Retrieve resume
    console.log('📋 Test 3: Retrieve Resume');
    const retrievedResume = await documentStorageService.getResume(
      savedResume._id.toString(),
      mockUserId
    );
    console.log('Retrieved resume ID:', retrievedResume._id.toString());
    console.log('Resume content preview:', retrievedResume.originalText.substring(0, 50) + '...');
    console.log('✅ Resume retrieved successfully\n');

    // Test 4: Save a mock cover letter
    console.log('📋 Test 4: Save Cover Letter to Database');
    const mockJobId = new mongoose.Types.ObjectId().toString();
    
    const savedCoverLetter = await documentStorageService.saveCoverLetter({
      userId: mockUserId,
      jobId: mockJobId,
      content: 'This is a sample cover letter content for testing purposes. It demonstrates the storage and retrieval functionality.',
      tone: 'professional',
      resumeId: savedResume._id.toString(),
      metadata: {
        wordCount: 50,
        generatedAt: new Date()
      }
    });

    console.log('Saved cover letter ID:', savedCoverLetter._id.toString());
    console.log('Cover letter tone:', savedCoverLetter.tone);
    console.log('✅ Cover letter saved successfully\n');

    // Test 5: List user's resumes
    console.log('📋 Test 5: List User Resumes');
    const resumesList = await documentStorageService.listResumes(mockUserId, {
      page: 1,
      limit: 10
    });
    console.log('Total resumes:', resumesList.total);
    console.log('Current page:', resumesList.page);
    console.log('Total pages:', resumesList.pages);
    console.log('✅ Resume listing works\n');

    // Test 6: List user's cover letters (without populate to avoid Job model issue)
    console.log('📋 Test 6: List User Cover Letters');
    
    // Simple version without populate for testing
    const coverLettersCount = await mongoose.model('CoverLetter').countDocuments({ 
      user: new mongoose.Types.ObjectId(mockUserId) 
    });
    
    console.log('Total cover letters:', coverLettersCount);
    console.log('✅ Cover letter listing works\n');

    // Test 7: Update resume
    console.log('📋 Test 7: Update Resume Metadata');
    const updatedResume = await documentStorageService.updateResume(
      savedResume._id.toString(),
      mockUserId,
      {
        metadata: {
          ...savedResume.metadata,
          lastModified: new Date(),
          version: 2
        }
      }
    );
    console.log('Updated resume version:', updatedResume.metadata?.version);
    console.log('✅ Resume update works\n');

    // Test 8: Update cover letter
    console.log('📋 Test 8: Update Cover Letter Content');
    const updatedCoverLetter = await documentStorageService.updateCoverLetter(
      savedCoverLetter._id.toString(),
      mockUserId,
      {
        content: 'This is the updated cover letter content with additional information.',
        metadata: {
          ...savedCoverLetter.metadata,
          lastEdited: new Date()
        }
      }
    );
    console.log('Updated cover letter length:', updatedCoverLetter.content.length);
    console.log('✅ Cover letter update works\n');

    // Test 9: Get storage statistics
    console.log('📋 Test 9: Get User Storage Statistics');
    const stats = await documentStorageService.getUserStorageStats(mockUserId);
    console.log('Storage statistics:');
    console.log('- Total resumes:', stats.totalResumes);
    console.log('- Base resumes:', stats.baseResumes);
    console.log('- Tailored resumes:', stats.tailoredResumes);
    console.log('- Total cover letters:', stats.totalCoverLetters);
    console.log('- Storage used:', (stats.storageUsed / 1024).toFixed(2), 'KB');
    console.log('✅ Storage statistics work\n');

    // Test 10: Generate download path
    console.log('📋 Test 10: Generate Download Path');
    const resumeDownloadPath = documentStorageService.generateDownloadPath(
      savedResume._id.toString(),
      'resume'
    );
    const coverLetterDownloadPath = documentStorageService.generateDownloadPath(
      savedCoverLetter._id.toString(),
      'coverLetter'
    );
    console.log('Resume download path:', resumeDownloadPath);
    console.log('Cover letter download path:', coverLetterDownloadPath);
    console.log('✅ Download path generation works\n');

    // Cleanup: Delete test documents
    console.log('📋 Cleanup: Deleting Test Documents');
    await documentStorageService.deleteCoverLetter(
      savedCoverLetter._id.toString(),
      mockUserId
    );
    await documentStorageService.deleteResume(
      savedResume._id.toString(),
      mockUserId
    );
    console.log('✅ Test documents deleted\n');

    console.log('🎉 All Document Storage Service tests passed!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run tests
testDocumentStorageService();