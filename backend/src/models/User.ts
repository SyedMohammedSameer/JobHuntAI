// backend/src/models/User.ts - Phase 5 Complete

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User interface for Phase 5
export interface IUser extends Document {
  // Basic Info
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  
  // Profile Info
  university?: string;
  major?: string;
  graduationYear?: number;
  currentYear?: 'Freshman' | 'Sophomore' | 'Junior' | 'Senior' | 'Graduate';
  graduationDate?: Date;
  degreeType?: string;
  
  // Visa/Work Status
  visaType?: 'F1' | 'OPT' | 'STEM_OPT' | 'H1B' | 'GREEN_CARD' | 'CITIZEN' | 'OTHER';
  visaExpiryDate?: Date;
  optStartDate?: Date;
  optEndDate?: Date;
  workAuthorization?: string;
  
  // AI Usage Tracking
  aiUsage: {
    resumeTailoring: {
      count: number;
      lastReset: Date;
      lastUsed: Date | null;
    };
    coverLetterGeneration: {
      count: number;
      lastReset: Date;
      lastUsed: Date | null;
    };
  };
  
  // Subscription (Phase 5 - UPDATED)
  subscription: {
    plan: 'FREE' | 'PREMIUM';
    status?: 'active' | 'canceled' | 'past_due' | 'trialing'; // NEW
    startDate?: Date;
    endDate?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: Date; // NEW
    currentPeriodEnd?: Date;   // NEW
    cancelAtPeriodEnd?: boolean; // NEW
    features: {
      maxResumeTailoring: number;
      maxCoverLetters: number;
      aiPriority: boolean;
      unlimitedBookmarks: boolean;
      advancedAnalytics?: boolean; // NEW
      emailAlerts?: boolean;       // NEW
    };
  };
  
  // Job Preferences
  jobPreferences?: {
    jobTypes?: string[];
    locations?: string[];
    remoteOnly?: boolean;
    visaSponsorshipRequired?: boolean;
    salaryMin?: number;
    salaryMax?: number;
  };
  
  // Bookmarked Jobs
  bookmarkedJobs: mongoose.Types.ObjectId[];
  
  // Account
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  
  // OAuth
  googleId?: string;
  linkedinId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const UserSchema: Schema = new Schema(
  {
    // Basic Info
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicture: String,
    
    // Profile Info
    university: String,
    major: String,
    graduationYear: Number,
    currentYear: {
      type: String,
      enum: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'],
    },
    graduationDate: Date,
    degreeType: String,
    
    // Visa/Work Status
    visaType: {
      type: String,
      enum: ['F1', 'OPT', 'STEM_OPT', 'H1B', 'GREEN_CARD', 'CITIZEN', 'OTHER'],
    },
    visaExpiryDate: Date,
    optStartDate: Date,
    optEndDate: Date,
    workAuthorization: String,
    
    // AI Usage Tracking
    aiUsage: {
      resumeTailoring: {
        count: {
          type: Number,
          default: 0,
        },
        lastReset: {
          type: Date,
          default: Date.now,
        },
        lastUsed: {
          type: Date,
          default: null,
        },
      },
      coverLetterGeneration: {
        count: {
          type: Number,
          default: 0,
        },
        lastReset: {
          type: Date,
          default: Date.now,
        },
        lastUsed: {
          type: Date,
          default: null,
        },
      },
    },
    
    // Subscription (Phase 5)
    subscription: {
      plan: {
        type: String,
        enum: ['FREE', 'PREMIUM'],
        default: 'FREE',
      },
      status: {
        type: String,
        enum: ['active', 'canceled', 'past_due', 'trialing'],
        default: 'active',
      },
      startDate: Date,
      endDate: Date,
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
      features: {
        maxResumeTailoring: {
          type: Number,
          default: 3,
        },
        maxCoverLetters: {
          type: Number,
          default: 3,
        },
        aiPriority: {
          type: Boolean,
          default: false,
        },
        unlimitedBookmarks: {
          type: Boolean,
          default: false,
        },
        advancedAnalytics: {
          type: Boolean,
          default: false,
        },
        emailAlerts: {
          type: Boolean,
          default: false,
        },
      },
    },
    
    // Job Preferences
    jobPreferences: {
      jobTypes: [String],
      locations: [String],
      remoteOnly: Boolean,
      visaSponsorshipRequired: Boolean,
      salaryMin: Number,
      salaryMax: Number,
    },
    
    // Bookmarked Jobs
    bookmarkedJobs: [{
      type: Schema.Types.ObjectId,
      ref: 'Job',
    }],
    
    // Account
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    
    // OAuth
    googleId: String,
    linkedinId: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ 'subscription.plan': 1 });
UserSchema.index({ 'subscription.stripeCustomerId': 1 });
UserSchema.index({ 'subscription.stripeSubscriptionId': 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ linkedinId: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);