// backend/src/models/User.ts
// COMPLETE USER MODEL - PHASE 5 READY

import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  university: string;
  major: string;
  graduationYear: number;
  visaType: 'F1' | 'J1' | 'H1B' | 'OPT' | 'STEM_OPT' | 'OTHER';
  visaExpiryDate?: Date;
  jobPreferences: {
    desiredJobTitles: string[];
    desiredLocations: string[];
    desiredSalaryMin?: number;
    desiredSalaryMax?: number;
    jobTypes: ('FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP')[];
    remotePreference: 'REMOTE' | 'HYBRID' | 'ONSITE' | 'ANY';
    industryPreferences: string[];
    skillsToHighlight: string[];
  };
  bookmarkedJobs: mongoose.Types.ObjectId[];
  aiUsage: {
    resumeTailoring: {
      count: number;
      lastReset: Date;
    };
    coverLetterGeneration: {
      count: number;
      lastReset: Date;
    };
  };
  subscription: {
    plan: 'FREE' | 'PREMIUM';
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    startDate?: Date;
    endDate?: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
    features: {
      maxResumeTailoring: number;
      maxCoverLetters: number;
      aiPriority: boolean;
      unlimitedBookmarks: boolean;
      advancedAnalytics: boolean;
      emailAlerts: boolean;
    };
  };
  profileCompleteness: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
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
    university: {
      type: String,
      required: true,
      trim: true,
    },
    major: {
      type: String,
      required: true,
      trim: true,
    },
    graduationYear: {
      type: Number,
      required: true,
      min: 2020,
      max: 2030,
    },
    visaType: {
      type: String,
      enum: ['F1', 'J1', 'H1B', 'OPT', 'STEM_OPT', 'OTHER'],
      required: true,
    },
    visaExpiryDate: {
      type: Date,
    },
    jobPreferences: {
      desiredJobTitles: {
        type: [String],
        default: [],
      },
      desiredLocations: {
        type: [String],
        default: [],
      },
      desiredSalaryMin: {
        type: Number,
        min: 0,
      },
      desiredSalaryMax: {
        type: Number,
        min: 0,
      },
      jobTypes: {
        type: [String],
        enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'],
        default: ['FULL_TIME'],
      },
      remotePreference: {
        type: String,
        enum: ['REMOTE', 'HYBRID', 'ONSITE', 'ANY'],
        default: 'ANY',
      },
      industryPreferences: {
        type: [String],
        default: [],
      },
      skillsToHighlight: {
        type: [String],
        default: [],
      },
    },
    bookmarkedJobs: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Job',
      default: [],
    },
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
      },
    },
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
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      stripeCustomerId: {
        type: String,
      },
      stripeSubscriptionId: {
        type: String,
      },
      currentPeriodStart: {
        type: Date,
      },
      currentPeriodEnd: {
        type: Date,
      },
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
    profileCompleteness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ 'subscription.stripeCustomerId': 1 });
UserSchema.index({ 'subscription.stripeSubscriptionId': 1 });

export default mongoose.model<IUser>('User', UserSchema);