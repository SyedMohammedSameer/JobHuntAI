export const applicationReminderEmailTemplate = (user: any, application: any): string => {
  const daysSince = Math.floor(
    (Date.now() - new Date(application.appliedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Follow-up Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📬 Time to Follow Up!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.name || 'there'},</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        It's been <strong>${daysSince} days</strong> since you applied to:
      </p>

      <!-- Application Details -->
      <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; margin: 30px 0; border: 2px solid #10b981;">
        <h3 style="color: #065f46; margin: 0 0 16px 0; font-size: 20px;">
          ${application.position}
        </h3>
        <p style="color: #047857; margin: 8px 0; font-size: 16px;">
          <strong>Company:</strong> ${application.company}
        </p>
        <p style="color: #047857; margin: 8px 0; font-size: 16px;">
          <strong>Applied:</strong> ${new Date(application.appliedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
        <p style="color: #047857; margin: 8px 0; font-size: 16px;">
          <strong>Status:</strong> ${application.status}
        </p>
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">💡 Suggested Actions</h3>
        <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
          <li style="margin: 10px 0;">Send a polite follow-up email to the hiring manager</li>
          <li style="margin: 10px 0;">Connect with the recruiter on LinkedIn</li>
          <li style="margin: 10px 0;">Check the company's career portal for updates</li>
          <li style="margin: 10px 0;">Prepare for potential next steps (phone screen, interview)</li>
        </ul>
      </div>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Following up shows your continued interest and can help keep your application top of mind. Good luck! 🍀
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.FRONTEND_URL}/applications"
           style="display: inline-block; background-color: #10b981; color: #ffffff;
                  padding: 16px 40px; text-decoration: none; border-radius: 8px;
                  font-weight: 600; font-size: 16px;">
          View Application →
        </a>
      </div>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Keep pushing forward!<br>
        <strong>The AI Job Hunt Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
        AI Job Hunt - Your AI-Powered Job Search Assistant
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        <a href="${process.env.FRONTEND_URL}/settings" style="color: #10b981; text-decoration: none;">Email Preferences</a> |
        <a href="${process.env.FRONTEND_URL}" style="color: #10b981; text-decoration: none;">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
