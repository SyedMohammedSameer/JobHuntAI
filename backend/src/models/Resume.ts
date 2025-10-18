import mongoose, { Document, Schema } from 'mongoose';

// Resume interface
export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  
  // Base Resume Info
  isBaseResume: boolean; // True if this is the user's master resume
  basedOnResumeId?: mongoose.Types.ObjectId; // Reference to base resume if this is tailored
  
  // Resume Content
  content: {
    personalInfo: {
      fullName: string;
      email: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      portfolio?: string;
      github?: string;
    };
    
    summary?: string;
    
    experience: {
      id: string;
      company: string;
      position: string;
      location?: string;
      startDate: Date;
      endDate?: Date;
      isCurrent: boolean;
      description: string[];
      highlights?: string[];
    }[];
    
    education: {
      id: string;
      institution: string;
      degree: string;
      field: string;
      location?: string;
      graduationDate?: Date;
      gpa?: number;
      achievements?: string[];
    }[];
    
    skills: {
      category: string;
      items: string[];
    }[];
    
    projects?: {
      id: string;
      name: string;
      description: string;
      technologies: string[];
      url?: string;
      highlights: string[];
    }[];
    
    certifications?: {
      id: string;
      name: string;
      issuer: string;
      date: Date;
      expiryDate?: Date;
      credentialUrl?: string;
    }[];
    
    publications?: {
      id: string;
      title: string;
      publisher: string;
      date: Date;
      url?: string;
    }[];
  };
  
  // Tailoring Info (if this is a tailored resume)
  tailoredFor?: {
    jobId?: mongoose.Types.ObjectId;
    jobTitle: string;
    company: string;
    tailoredDate: Date;
  };
  
  // AI Analysis
  aiMetadata?: {
    strengthScore: number; // 0-100
    suggestions: string[];
    keywords: string[];
    atsScore: number; // ATS compatibility score 0-100
  };
  
  // File Storage
  fileUrl?: string; // URL to PDF version
  fileName?: string;
  
  // Metadata
  title: string; // User-defined title for the resume
  version: number;
  
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
    
    isBaseResume: {
      type: Boolean,
      default: false,
    },
    basedOnResumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
    },
    
    content: {
      personalInfo: {
        fullName: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        phone: String,
        location: String,
        linkedin: String,
        portfolio: String,
        github: String,
      },
      
      summary: String,
      
      experience: [
        {
          id: String,
          company: {
            type: String,
            required: true,
          },
          position: {
            type: String,
            required: true,
          },
          location: String,
          startDate: {
            type: Date,
            required: true,
          },
          endDate: Date,
          isCurrent: {
            type: Boolean,
            default: false,
          },
          description: [String],
          highlights: [String],
        },
      ],
      
      education: [
        {
          id: String,
          institution: {
            type: String,
            required: true,
          },
          degree: {
            type: String,
            required: true,
          },
          field: {
            type: String,
            required: true,
          },
          location: String,
          graduationDate: Date,
          gpa: Number,
          achievements: [String],
        },
      ],
      
      skills: [
        {
          category: String,
          items: [String],
        },
      ],
      
      projects: [
        {
          id: String,
          name: String,
          description: String,
          technologies: [String],
          url: String,
          highlights: [String],
        },
      ],
      
      certifications: [
        {
          id: String,
          name: String,
          issuer: String,
          date: Date,
          expiryDate: Date,
          credentialUrl: String,
        },
      ],
      
      publications: [
        {
          id: String,
          title: String,
          publisher: String,
          date: Date,
          url: String,
        },
      ],
    },
    
    tailoredFor: {
      jobId: {
        type: Schema.Types.ObjectId,
        ref: 'Job',
      },
      jobTitle: String,
      company: String,
      tailoredDate: Date,
    },
    
    aiMetadata: {
      strengthScore: Number,
      suggestions: [String],
      keywords: [String],
      atsScore: Number,
    },
    
    fileUrl: String,
    fileName: String,
    
    title: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ResumeSchema.index({ userId: 1, isBaseResume: 1 });
ResumeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IResume>('Resume', ResumeSchema);