// backend/src/models/CoverLetter.ts - Phase 3A Updated

import mongoose, { Document, Schema } from 'mongoose';

// Cover Letter Tone type
export type CoverLetterTone = 'professional' | 'enthusiastic' | 'conservative' | 'creative';

// Cover Letter interface for Phase 3A+
export interface ICoverLetter extends Document {
  userId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  resumeId?: mongoose.Types.ObjectId; // Optional: if generated from a specific resume
  
  // Content
  content: string; // The actual cover letter text
  
  // Metadata
  jobTitle: string;
  company: string;
  tone: CoverLetterTone;
  
  // AI Generation
  generatedByAI: boolean;
  aiModel?: string; // e.g., "gpt-4-turbo-preview"
  
  // Additional metadata
  metadata?: {
    wordCount?: number;
    generatedDate?: Date;
    tokensUsed?: number;
    estimatedCost?: number;
    userPrompt?: string; // Any custom instructions user provided
    qualityScore?: number; // 0-100
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Cover Letter schema
const CoverLetterSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
    },
    
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
    },
    
    content: {
      type: String,
      required: true,
    },
    
    jobTitle: {
      type: String,
      required: true,
    },
    
    company: {
      type: String,
      required: true,
    },
    
    tone: {
      type: String,
      enum: ['professional', 'enthusiastic', 'conservative', 'creative'],
      required: true,
      default: 'professional',
    },
    
    generatedByAI: {
      type: Boolean,
      required: true,
      default: true,
    },
    
    aiModel: {
      type: String,
    },
    
    metadata: {
      wordCount: Number,
      generatedDate: Date,
      tokensUsed: Number,
      estimatedCost: Number,
      userPrompt: String,
      qualityScore: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CoverLetterSchema.index({ userId: 1, createdAt: -1 });
CoverLetterSchema.index({ userId: 1, jobId: 1 });

export default mongoose.model<ICoverLetter>('CoverLetter', CoverLetterSchema);