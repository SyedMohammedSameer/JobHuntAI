import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User interface
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
  
  // Subscription
  subscriptionTier: 'FREE' | 'PREMIUM';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  // Usage Tracking
  monthlyUsage: {
    resumeTailoring: number;
    coverLetters: number;
    resetDate: Date;
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
  
  // Bookmarked Jobs (NEW)
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
  incrementUsage(type: 'resumeTailoring' | 'coverLetters'): Promise<void>;
  resetMonthlyUsage(): Promise<void>;
  canUseFeature(feature: 'resumeTailoring' | 'coverLetters'): boolean;
}

// User schema
const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: false, // Not required for OAuth users
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
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
    degreeType: {
      type: String,
      enum: ['BACHELOR', 'MASTER', 'PHD', 'CERTIFICATE', 'OTHER'],
    },
    
    // Visa/Work Status
    visaType: {
      type: String,
      enum: ['F1', 'OPT', 'STEM_OPT', 'H1B', 'GREEN_CARD', 'CITIZEN', 'OTHER'],
    },
    visaExpiryDate: Date,
    optStartDate: Date,
    optEndDate: Date,
    workAuthorization: String,
    
    // Subscription
    subscriptionTier: {
      type: String,
      enum: ['FREE', 'PREMIUM'],
      default: 'FREE',
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    
    // Usage Tracking
    monthlyUsage: {
      resumeTailoring: {
        type: Number,
        default: 0,
      },
      coverLetters: {
        type: Number,
        default: 0,
      },
      resetDate: {
        type: Date,
        default: () => {
          const now = new Date();
          return new Date(now.getFullYear(), now.getMonth() + 1, 1);
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
    
    // Bookmarked Jobs (NEW)
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
UserSchema.index({ subscriptionTier: 1 });
UserSchema.index({ googleId: 1 });

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

// Method to increment usage
UserSchema.methods.incrementUsage = async function (
  type: 'resumeTailoring' | 'coverLetters'
): Promise<void> {
  // Check if we need to reset monthly usage
  const now = new Date();
  if (now >= this.monthlyUsage.resetDate) {
    await this.resetMonthlyUsage();
  }
  
  this.monthlyUsage[type] += 1;
  await this.save();
};

// Method to reset monthly usage
UserSchema.methods.resetMonthlyUsage = async function (): Promise<void> {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  this.monthlyUsage.resumeTailoring = 0;
  this.monthlyUsage.coverLetters = 0;
  this.monthlyUsage.resetDate = nextMonth;
  
  await this.save();
};

// Method to check if user can use a feature
UserSchema.methods.canUseFeature = function (
  feature: 'resumeTailoring' | 'coverLetters'
): boolean {
  // Premium users have unlimited access
  if (this.subscriptionTier === 'PREMIUM') {
    return true;
  }
  
  // Free tier limits
  const limits = {
    resumeTailoring: 5,
    coverLetters: 3,
  };
  
  return this.monthlyUsage[feature] < limits[feature];
};

export default mongoose.model<IUser>('User', UserSchema);