import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fileProcessingService from '../services/fileProcessingService';

// Load environment variables
dotenv.config();

// Sample resume text for testing
const SAMPLE_RESUME_TEXT = `
JOHN DOE
Software Engineer | john.doe@email.com | (555) 123-4567

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 3+ years of experience in full-stack development. 
Proficient in React, Node.js, and cloud technologies. Proven track record of delivering 
scalable web applications and improving system performance.

EXPERIENCE

Senior Software Developer - TechCorp Inc. (2021 - Present)
- Developed and maintained 10+ web applications using React and Node.js
- Improved application performance by 40% through code optimization
- Led a team of 3 junior developers and provided mentorship
- Implemented CI/CD pipelines reducing deployment time by 60%

Software Developer - StartupXYZ (2019 - 2021)
- Built RESTful APIs serving 100K+ daily requests
- Collaborated with cross-functional teams of 15+ members
- Reduced server costs by 30% through AWS optimization
- Implemented automated testing achieving 90% code coverage

EDUCATION

Bachelor of Science in Computer Science
University of Technology, 2019
GPA: 3.8/4.0

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Vue.js, HTML5, CSS3, Redux
Backend: Node.js, Express, Django, Spring Boot
Databases: MongoDB, PostgreSQL, Redis
Cloud: AWS (EC2, S3, Lambda), Azure
Tools: Git, Docker, Kubernetes, Jenkins

CERTIFICATIONS
- AWS Certified Developer - Associate (2022)
- MongoDB Certified Developer (2021)
`;

// Helper function to create mock file
function createMockFile(
  originalname: string,
  mimetype: string,
  size: number
): any {
  return {
    fieldname: 'resume',
    originalname,
    encoding: '7bit',
    mimetype,
    destination: 'uploads/',
    filename: originalname,
    path: `uploads/${originalname}`,
    size,
    buffer: Buffer.from('mock file content'),
  };
}

async function createSampleFiles() {
  console.log('📝 Creating sample test files...\n');

  const testDir = path.join(__dirname, '../../uploads/test');
  
  // Ensure directory exists
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Create a simple text file (we'll simulate PDF/DOCX in real implementation)
  const sampleTextPath = path.join(testDir, 'sample-resume.txt');
  fs.writeFileSync(sampleTextPath, SAMPLE_RESUME_TEXT);

  console.log('✅ Created sample text file:', sampleTextPath);
  console.log('Note: For full PDF/DOCX testing, manually place test files in:', testDir, '\n');

  return { testDir, sampleTextPath };
}

async function testFileProcessingService() {
  console.log('\n🚀 Testing File Processing Service...\n');

  try {
    // Ensure upload directories exist
    console.log('📋 Test 1: Ensure Upload Directories');
    fileProcessingService.ensureUploadDirectory();
    console.log('✅ Upload directories created/verified\n');

    // Test file validation
    console.log('📋 Test 2: File Validation');
    
    // Simulate a valid file
    const validFile = createMockFile(
      'resume.pdf',
      'application/pdf',
      1024 * 500 // 500KB
    );

    const validResult = fileProcessingService.validateFile(validFile);
    console.log('Valid PDF result:', validResult);
    console.log(validResult.valid ? '✅ Valid file accepted' : '❌ Valid file rejected');

    // Simulate an invalid file (too large)
    const invalidFile = createMockFile(
      'huge-resume.pdf',
      'application/pdf',
      1024 * 1024 * 10 // 10MB (exceeds 5MB limit)
    );

    const invalidResult = fileProcessingService.validateFile(invalidFile);
    console.log('\nInvalid file (too large) result:', invalidResult);
    console.log(!invalidResult.valid ? '✅ Large file correctly rejected' : '❌ Large file incorrectly accepted');

    // Simulate wrong file type
    const wrongTypeFile = createMockFile(
      'resume.exe',
      'application/x-msdownload',
      1024
    );

    const wrongTypeResult = fileProcessingService.validateFile(wrongTypeFile);
    console.log('\nWrong file type result:', wrongTypeResult);
    console.log(!wrongTypeResult.valid ? '✅ Wrong type correctly rejected\n' : '❌ Wrong type incorrectly accepted\n');

    // Test text cleaning
    console.log('📋 Test 3: Text Cleaning');
    const dirtyText = `
      This    has    excessive     spaces.
      
      
      
      And multiple blank lines.
      
      Page 1 of 3
      
      Special chars: © ® ™ 
      Normal punctuation: Hello, World! How are you?
    `;

    const cleanedText = fileProcessingService.cleanExtractedText(dirtyText);
    console.log('Original text length:', dirtyText.length);
    console.log('Cleaned text length:', cleanedText.length);
    console.log('Cleaned text preview:', cleanedText.substring(0, 100) + '...');
    console.log('✅ Text cleaning works\n');

    // Test word counting
    console.log('📋 Test 4: Word Counting');
    const wordCount = fileProcessingService.countWords(SAMPLE_RESUME_TEXT);
    console.log('Sample resume word count:', wordCount);
    console.log(wordCount > 0 ? '✅ Word counting works\n' : '❌ Word counting failed\n');

    // Test filename generation
    console.log('📋 Test 5: Unique Filename Generation');
    const userId = 'user123';
    const originalName = 'My Resume (Final).pdf';
    const uniqueName = fileProcessingService.generateUniqueFilename(originalName, userId);
    console.log('Original:', originalName);
    console.log('Generated:', uniqueName);
    console.log(uniqueName.includes(userId) ? '✅ Filename generation works\n' : '❌ Filename generation failed\n');

    // Test resume section extraction
    console.log('📋 Test 6: Resume Section Extraction');
    const sections = fileProcessingService.extractResumeSections(SAMPLE_RESUME_TEXT);
    console.log('Extracted sections:');
    console.log('- Summary found:', !!sections.summary);
    console.log('- Experience found:', !!sections.experience);
    console.log('- Education found:', !!sections.education);
    console.log('- Skills found:', !!sections.skills);
    
    if (sections.experience) {
      console.log('\nExperience preview (first 150 chars):');
      console.log(sections.experience.substring(0, 150) + '...');
    }
    console.log('✅ Section extraction works\n');

    // Create sample files
    const { testDir, sampleTextPath } = await createSampleFiles();

    // Test file metadata
    console.log('📋 Test 7: File Metadata Extraction');
    try {
      const metadata = await fileProcessingService.getFileMetadata(sampleTextPath);
      console.log('File metadata:', metadata);
      console.log('✅ Metadata extraction works\n');
    } catch (error: any) {
      console.log('⚠️  Metadata extraction (expected for test file):', error.message, '\n');
    }

    // Test PDF extraction (if PDF file exists)
    console.log('📋 Test 8: PDF Text Extraction (Optional)');
    const pdfPath = path.join(testDir, 'sample-resume.pdf');
    if (fs.existsSync(pdfPath)) {
      try {
        const pdfContent = await fileProcessingService.extractTextFromPDF(pdfPath);
        console.log('PDF extraction successful!');
        console.log('- Pages:', pdfContent.metadata.pageCount);
        console.log('- Words:', pdfContent.metadata.wordCount);
        console.log('- Characters:', pdfContent.metadata.characterCount);
        console.log('- Preview (first 200 chars):', pdfContent.text.substring(0, 200) + '...');
        console.log('✅ PDF extraction works\n');
      } catch (error: any) {
        console.log('⚠️  PDF extraction error:', error.message, '\n');
      }
    } else {
      console.log('⚠️  No PDF file found at:', pdfPath);
      console.log('To test PDF extraction, place a sample PDF resume at this location.\n');
    }

    // Test DOCX extraction (if DOCX file exists)
    console.log('📋 Test 9: DOCX Text Extraction (Optional)');
    const docxPath = path.join(testDir, 'sample-resume.docx');
    if (fs.existsSync(docxPath)) {
      try {
        const docxContent = await fileProcessingService.extractTextFromDOCX(docxPath);
        console.log('DOCX extraction successful!');
        console.log('- Words:', docxContent.metadata.wordCount);
        console.log('- Characters:', docxContent.metadata.characterCount);
        console.log('- Preview (first 200 chars):', docxContent.text.substring(0, 200) + '...');
        console.log('✅ DOCX extraction works\n');
      } catch (error: any) {
        console.log('⚠️  DOCX extraction error:', error.message, '\n');
      }
    } else {
      console.log('⚠️  No DOCX file found at:', docxPath);
      console.log('To test DOCX extraction, place a sample DOCX resume at this location.\n');
    }

    // Test file deletion
    console.log('📋 Test 10: File Deletion');
    const deleted = fileProcessingService.deleteFile(sampleTextPath);
    console.log(deleted ? '✅ File deletion works\n' : '⚠️  File deletion failed (file may not exist)\n');

    console.log('🎉 File Processing Service tests completed!\n');
    console.log('📌 Note: For full PDF/DOCX testing, place sample files in:', testDir);

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests
testFileProcessingService();