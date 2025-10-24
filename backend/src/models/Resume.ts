// backend/src/models/Resume.ts - Phase 3A Updated

import mongoose, { Document, Schema } from 'mongoose';

// Resume interface for Phase 3A+
export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  
  // File Information
  fileName: string;
  filePath?: string; // Path to stored file
  
  // Resume Content
  originalText: string; // Extracted text from uploaded file
  tailoredContent?: string; // AI-tailored version for specific job
  
  // Resume Type
  type: 'BASE' | 'TAILORED'; // BASE = original, TAILORED = job-specific
  
  // References
  baseResumeId?: mongoose.Types.ObjectId; // If TAILORED, references the BASE resume
  jobId?: mongoose.Types.ObjectId; // If TAILORED, the job it was tailored for
  
  // Metadata
  metadata?: {
    wordCount?: number;
    format?: string; // pdf, docx, etc.
    uploadDate?: Date;
    lastModified?: Date;
    keywords?: string[]; // Extracted keywords
    atsScore?: number; // ATS compatibility score 0-100
    tailoredFor?: {
      jobTitle?: string;
      company?: string;
      jobId?: string;
    };
    sections?: {
      experience?: string;
      education?: string;
      skills?: string;
      summary?: string;
    };
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Resume schema
const ResumeSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    fileName: {
      type: String,
      required: true,
    },
    
    filePath: {
      type: String,
    },
    
    originalText: {
      type: String,
      required: true,
    },
    
    tailoredContent: {
      type: String,
    },
    
    type: {
      type: String,
      enum: ['BASE', 'TAILORED'],
      required: true,
      default: 'BASE',
    },
    
    baseResumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
    },
    
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
    },
    
    metadata: {
      wordCount: Number,
      format: String,
      uploadDate: Date,
      lastModified: Date,
      keywords: [String],
      atsScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      tailoredFor: {
        jobTitle: String,
        company: String,
        jobId: String,
      },
      sections: {
        experience: String,
        education: String,
        skills: String,
        summary: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ResumeSchema.index({ userId: 1, type: 1 });
ResumeSchema.index({ userId: 1, createdAt: -1 });
ResumeSchema.index({ userId: 1, jobId: 1 });

export default mongoose.model<IResume>('Resume', ResumeSchema);