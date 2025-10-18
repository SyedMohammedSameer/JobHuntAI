import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User interface
export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  
  // Student/Professional Info
  university?: string;
  graduationDate?: Date;
  major?: string;
  degreeType?: string;
  
  // Visa Information
  visaType?: 'F1' | 'OPT' | 'STEM_OPT' | 'H1B' | 'GREEN_CARD' | 'CITIZEN' | 'OTHER';
  visaExpiryDate?: Date;
  optStartDate?: Date;
  optEndDate?: Date;
  
  // Subscription
  subscriptionTier: 'FREE' | 'PREMIUM';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  
  // Usage Tracking (for free tier limits)
  monthlyUsage: {
    resumeTailoring: number;
    coverLetters: number;
    resetDate: Date;
  };
  
  // Preferences
  jobPreferences?: {
    jobTypes?: string[];
    locations?: string[];
    remoteOnly?: boolean;
    visaSponsorshipRequired?: boolean;
    salaryMin?: number;
    salaryMax?: number;
  };
  
  // Account Status
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
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: false, // We'll validate this in the controller
      minlength: 8,
      select: false, // Don't return password by default
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
    
    // Student Info
    university: String,
    graduationDate: Date,
    major: String,
    degreeType: {
      type: String,
      enum: ['BACHELOR', 'MASTER', 'PHD', 'CERTIFICATE', 'OTHER'],
    },
    
    // Visa
    visaType: {
      type: String,
      enum: ['F1', 'OPT', 'STEM_OPT', 'H1B', 'GREEN_CARD', 'CITIZEN', 'OTHER'],
    },
    visaExpiryDate: Date,
    optStartDate: Date,
    optEndDate: Date,
    
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

// Index for performance
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