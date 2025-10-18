import mongoose, { Document, Schema } from 'mongoose';

// Cover Letter interface
export interface ICoverLetter extends Document {
  userId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  
  // Cover Letter Content
  content: string;
  
  // Metadata
  jobTitle: string;
  company: string;
  tone: 'PROFESSIONAL' | 'ENTHUSIASTIC' | 'FORMAL' | 'FRIENDLY';
  length: 'SHORT' | 'MEDIUM' | 'LONG';
  
  // User Inputs (used for generation)
  userHighlights?: string;
  customInstructions?: string;
  
  // AI Metadata
  generatedBy: 'AI' | 'USER';
  aiModel?: string;
  qualityScore?: number; // 0-100
  
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
      enum: ['PROFESSIONAL', 'ENTHUSIASTIC', 'FORMAL', 'FRIENDLY'],
      default: 'PROFESSIONAL',
    },
    length: {
      type: String,
      enum: ['SHORT', 'MEDIUM', 'LONG'],
      default: 'MEDIUM',
    },
    
    userHighlights: String,
    customInstructions: String,
    
    generatedBy: {
      type: String,
      enum: ['AI', 'USER'],
      default: 'AI',
    },
    aiModel: String,
    qualityScore: {
      type: Number,
      min: 0,
      max: 100,
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