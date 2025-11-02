import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@jobhuntai.com';
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'AI Job Hunt';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Base email sending function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured. Email not sent.');
    return false;
  }

  try {
    const msg = {
      to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject,
      text: text || subject,
      html,
    };

    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
    }
    return false;
  }
};

// Send welcome email to new users
export const sendWelcomeEmail = async (user: any): Promise<boolean> => {
  const { welcomeEmailTemplate } = await import('../templates/welcomeEmail');
  const html = welcomeEmailTemplate(user);
  const subject = 'Welcome to AI Job Hunt! 🎉';

  return sendEmail(user.email, subject, html);
};

// Send password reset email
export const sendPasswordResetEmail = async (
  user: any,
  resetToken: string
): Promise<boolean> => {
  const { passwordResetEmailTemplate } = await import('../templates/passwordResetEmail');
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const html = passwordResetEmailTemplate(user, resetUrl);
  const subject = 'Reset Your Password - AI Job Hunt';

  return sendEmail(user.email, subject, html);
};

// Send application reminder email
export const sendApplicationReminderEmail = async (
  user: any,
  application: any
): Promise<boolean> => {
  const { applicationReminderEmailTemplate } = await import('../templates/applicationReminderEmail');
  const html = applicationReminderEmailTemplate(user, application);
  const subject = `Follow up on your application to ${application.company}`;

  return sendEmail(user.email, subject, html);
};

// Send visa expiry alert
export const sendVisaExpiryAlert = async (
  user: any,
  visa: any,
  daysRemaining: number
): Promise<boolean> => {
  const { visaExpiryAlertTemplate } = await import('../templates/visaExpiryAlertEmail');
  const html = visaExpiryAlertTemplate(user, visa, daysRemaining);
  const subject = `⚠️ Your ${visa.visaType} visa expires in ${daysRemaining} days`;

  return sendEmail(user.email, subject, html);
};

// Send interview reminder email
export const sendInterviewReminderEmail = async (
  user: any,
  application: any
): Promise<boolean> => {
  const subject = `Interview reminder: ${application.company} tomorrow`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Interview Reminder</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>This is a reminder that you have an interview scheduled for tomorrow:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Company:</strong> ${application.company}</p>
        <p><strong>Position:</strong> ${application.position}</p>
        <p><strong>Status:</strong> ${application.status}</p>
      </div>
      <p><strong>Preparation tips:</strong></p>
      <ul>
        <li>Review the job description</li>
        <li>Research the company</li>
        <li>Prepare questions to ask</li>
        <li>Test your tech setup (if virtual)</li>
      </ul>
      <p>Good luck! 🍀</p>
      <p>Best,<br>AI Job Hunt Team</p>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};

// Send premium welcome email
export const sendPremiumWelcomeEmail = async (user: any): Promise<boolean> => {
  const { premiumWelcomeEmailTemplate } = await import('../templates/premiumWelcomeEmail');
  const html = premiumWelcomeEmailTemplate(user);
  const subject = '🎉 Welcome to AI Job Hunt Premium!';

  return sendEmail(user.email, subject, html);
};

// Send subscription cancelled email
export const sendSubscriptionCancelledEmail = async (user: any): Promise<boolean> => {
  const subject = 'Your AI Job Hunt Premium subscription has been cancelled';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Subscription Cancelled</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>We're sorry to see you go. Your Premium subscription has been cancelled.</p>
      <p>You'll continue to have access to Premium features until the end of your current billing period.</p>
      <p>We'd love to hear your feedback on how we can improve. Feel free to reply to this email.</p>
      <p>You can reactivate your subscription anytime from your dashboard.</p>
      <p>Thank you for trying AI Job Hunt Premium!</p>
      <p>Best,<br>AI Job Hunt Team</p>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};

// Send weekly digest email
export const sendWeeklyDigestEmail = async (
  user: any,
  stats: any
): Promise<boolean> => {
  const subject = '📊 Your Weekly Job Hunt Summary';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Your Weekly Summary</h2>
      <p>Hi ${user.name || 'there'},</p>
      <p>Here's your job hunt activity for this week:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>This Week's Stats</h3>
        <p>📝 Applications submitted: <strong>${stats.applicationsCount || 0}</strong></p>
        <p>📞 Interviews scheduled: <strong>${stats.interviewsCount || 0}</strong></p>
        <p>✅ Offers received: <strong>${stats.offersCount || 0}</strong></p>
        <p>🔍 Jobs searched: <strong>${stats.searchesCount || 0}</strong></p>
      </div>
      <p><strong>Keep up the momentum!</strong> Consistency is key in your job search.</p>
      <p>
        <a href="${process.env.FRONTEND_URL}/dashboard"
           style="background: #10b981; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          View Dashboard
        </a>
      </p>
      <p>Best,<br>AI Job Hunt Team</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 40px;">
        Don't want weekly emails?
        <a href="${process.env.FRONTEND_URL}/settings">Update your preferences</a>
      </p>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};

export default {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendApplicationReminderEmail,
  sendVisaExpiryAlert,
  sendInterviewReminderEmail,
  sendPremiumWelcomeEmail,
  sendSubscriptionCancelledEmail,
  sendWeeklyDigestEmail,
};
