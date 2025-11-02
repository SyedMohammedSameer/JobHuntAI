import mongoose, { Document, Schema } from 'mongoose';

// Application status type
export type ApplicationStatus = 
  | 'SAVED'
  | 'APPLIED'
  | 'IN_REVIEW'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFER_RECEIVED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

// Application interface
export interface IApplication extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  
  // Application Status
  status: ApplicationStatus;
  statusHistory: {
    status: ApplicationStatus;
    date: Date;
    notes?: string;
  }[];
  
  // Application Details
  appliedDate?: Date;
  tailoredResumeId?: mongoose.Types.ObjectId;
  coverLetterId?: mongoose.Types.ObjectId;
  
  // Match Score (AI-generated)
  matchScore?: number; // 0-100
  
  // User Notes & Tracking
  notes?: string;
  followUpDate?: Date;
  interviewDates?: Date[];
  contacts?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
    notes?: string;
  }[];
  
  // Offer Details (if applicable)
  offerDetails?: {
    salary?: number;
    benefits?: string;
    startDate?: Date;
    location?: string;
    remote?: boolean;
  };
  
  // Reminders
  reminderSet: boolean;
  reminderDate?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Application schema
const ApplicationSchema: Schema = new Schema(
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
      required: true,
      index: true,
    },
    
    status: {
      type: String,
      enum: [
        'SAVED',
        'APPLIED',
        'IN_REVIEW',
        'INTERVIEW_SCHEDULED',
        'INTERVIEWED',
        'OFFER_RECEIVED',
        'ACCEPTED',
        'REJECTED',
        'WITHDRAWN',
      ],
      default: 'SAVED',
      required: true,
    },
    
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    
    appliedDate: Date,
    tailoredResumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
    },
    coverLetterId: {
      type: Schema.Types.ObjectId,
      ref: 'CoverLetter',
    },
    
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    
    notes: String,
    followUpDate: Date,
    interviewDates: [Date],
    
    contacts: [
      {
        name: String,
        role: String,
        email: String,
        phone: String,
        notes: String,
      },
    ],
    
    offerDetails: {
      salary: Number,
      benefits: String,
      startDate: Date,
      location: String,
      remote: Boolean,
    },
    
    reminderSet: {
      type: Boolean,
      default: false,
    },
    reminderDate: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ userId: 1, createdAt: -1 });
ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });
// Index for email notification cron job (finding old applications)
ApplicationSchema.index({ status: 1, appliedDate: 1 });

// Method to update status
ApplicationSchema.methods.updateStatus = async function (
  newStatus: ApplicationStatus,
  notes?: string
): Promise<void> {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    date: new Date(),
    notes,
  });
  
  if (newStatus === 'APPLIED' && !this.appliedDate) {
    this.appliedDate = new Date();
  }
  
  await this.save();
};

// Static method to get user statistics
ApplicationSchema.statics.getUserStats = async function (
  userId: mongoose.Types.ObjectId
) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
  
  const result: Record<string, number> = {
    total: 0,
    saved: 0,
    applied: 0,
    in_review: 0,
    interview_scheduled: 0,
    interviewed: 0,
    offer_received: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  };
  
  stats.forEach((stat) => {
    const key = stat._id.toLowerCase().replace('_', '_');
    result[key] = stat.count;
    result.total += stat.count;
  });
  
  return result;
};

export default mongoose.model<IApplication>('Application', ApplicationSchema);