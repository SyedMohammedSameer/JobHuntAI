import cron from 'node-cron';
import User from '../models/User';
import Application from '../models/Application';
import {
  sendVisaExpiryAlert,
  sendApplicationReminderEmail,
  sendWeeklyDigestEmail,
} from '../services/emailService';

// Run daily at 8 AM UTC (adjust based on your timezone)
export const startEmailNotificationCron = () => {
  // Daily check at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('🔔 Running daily email notification check...');

    try {
      await checkVisaExpiries();
      await checkApplicationFollowUps();
    } catch (error) {
      console.error('Error in daily email notification cron:', error);
    }
  });

  // Weekly digest on Friday at 5 PM
  cron.schedule('0 17 * * 5', async () => {
    console.log('📊 Running weekly digest email...');

    try {
      await sendWeeklyDigests();
    } catch (error) {
      console.error('Error in weekly digest cron:', error);
    }
  });

  console.log('✅ Email notification cron jobs started');
};

// Check for expiring visas and send alerts
async function checkVisaExpiries() {
  try {
    const users = await User.find({
      'visaDetails.endDate': { $exists: true },
      isActive: true,
    });

    const now = new Date();
    const alertThresholds = [30, 60, 90]; // Days before expiry

    for (const user of users) {
      if (!user.visaDetails?.endDate) continue;

      const expiryDate = new Date(user.visaDetails.endDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send alert if visa is expiring within threshold days
      if (alertThresholds.includes(daysUntilExpiry) && daysUntilExpiry > 0) {
        console.log(
          `📧 Sending visa expiry alert to ${user.email} (${daysUntilExpiry} days remaining)`
        );

        await sendVisaExpiryAlert(
          user,
          {
            visaType: user.visaDetails.currentType || user.visaType,
            expiryDate: user.visaDetails.endDate,
            currentStatus: 'ACTIVE',
            gracePeriod: user.visaDetails.gracePeriodDays,
          },
          daysUntilExpiry
        );
      }
    }
  } catch (error) {
    console.error('Error checking visa expiries:', error);
  }
}

// Check for applications needing follow-up
async function checkApplicationFollowUps() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Find applications that are 7 or 14 days old and still in 'APPLIED' status
    const applications = await Application.find({
      status: 'APPLIED',
      appliedDate: {
        $lte: sevenDaysAgo,
        $gte: fourteenDaysAgo,
      },
    }).populate('userId').populate('jobId');

    for (const application of applications) {
      if (!application.userId || typeof application.userId === 'string') continue;
      if (!application.jobId || typeof application.jobId === 'string') continue;

      const user = application.userId as any;
      const job = application.jobId as any;
      const daysSinceApplied = Math.floor(
        (Date.now() - new Date(application.appliedDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Send reminder on day 7
      if (daysSinceApplied === 7) {
        console.log(
          `📧 Sending follow-up reminder to ${user.email} for ${job.company}`
        );

        // Create application object with company info for email template
        const applicationWithJob = {
          ...application.toObject(),
          company: job.company,
          position: job.title,
        };

        await sendApplicationReminderEmail(user, applicationWithJob);
      }
    }
  } catch (error) {
    console.error('Error checking application follow-ups:', error);
  }
}

// Send weekly digest to all active users
async function sendWeeklyDigests() {
  try {
    const users = await User.find({ isActive: true });

    for (const user of users) {
      try {
        // Get user's stats for the week
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const applications = await Application.find({
          userId: user._id,
          appliedDate: { $gte: lastWeek },
        });

        const stats = {
          applicationsCount: applications.length,
          interviewsCount: applications.filter(
            (app) => app.status === 'INTERVIEW_SCHEDULED' || app.status === 'INTERVIEWED'
          ).length,
          offersCount: applications.filter((app) => app.status === 'OFFER_RECEIVED').length,
          searchesCount: 0, // Could track this separately if needed
        };

        // Only send if user had activity this week
        if (stats.applicationsCount > 0) {
          console.log(`📧 Sending weekly digest to ${user.email}`);
          await sendWeeklyDigestEmail(user, stats);
        }
      } catch (error) {
        console.error(`Error sending weekly digest to ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('Error sending weekly digests:', error);
  }
}

// Export function to manually trigger checks (for testing)
export const manuallyTriggerEmailChecks = async () => {
  await checkVisaExpiries();
  await checkApplicationFollowUps();
};

export const manuallyTriggerWeeklyDigest = async () => {
  await sendWeeklyDigests();
};
