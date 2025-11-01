export const welcomeEmailTemplate = (user: any): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to AI Job Hunt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Welcome to AI Job Hunt!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.name || 'there'}! 👋</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        We're thrilled to have you join AI Job Hunt! Your journey to landing your dream job just got a whole lot easier.
      </p>

      <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0;">
        <h3 style="color: #065f46; margin-top: 0;">🚀 Quick Start Guide</h3>
        <ul style="color: #047857; margin: 0; padding-left: 20px;">
          <li style="margin: 10px 0;">Upload your resume for AI-powered tailoring</li>
          <li style="margin: 10px 0;">Search for jobs with visa sponsorship</li>
          <li style="margin: 10px 0;">Track your applications in one place</li>
          <li style="margin: 10px 0;">Generate custom cover letters with AI</li>
          <li style="margin: 10px 0;">Monitor your visa status and deadlines</li>
        </ul>
      </div>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Ready to get started? Head to your dashboard and explore all the features we've built for you!
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.FRONTEND_URL}/dashboard"
           style="display: inline-block; background-color: #10b981; color: #ffffff;
                  padding: 16px 40px; text-decoration: none; border-radius: 8px;
                  font-weight: 600; font-size: 16px;">
          Go to Dashboard →
        </a>
      </div>

      <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>💡 Pro Tip:</strong> Upload your resume first! Our AI will analyze it and help you tailor it for each job application to maximize your chances.
        </p>
      </div>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        If you have any questions or need help getting started, just reply to this email. We're here to help! 💪
      </p>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Best of luck with your job search!<br>
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
