export const premiumWelcomeEmailTemplate = (user: any): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Premium</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px;">👑 Welcome to Premium!</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">
        You're now a Premium member
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.name || 'there'}! 🎉</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Thank you for upgrading to <strong>AI Job Hunt Premium</strong>! You now have access to all our premium features designed to supercharge your job search.
      </p>

      <!-- Premium Features -->
      <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 30px; margin: 30px 0; border: 2px solid #8b5cf6;">
        <h3 style="color: #6b21a8; margin: 0 0 20px 0; text-align: center;">✨ Your Premium Features</h3>

        <div style="margin: 20px 0;">
          <h4 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 16px;">📊 Visa Tracker</h4>
          <p style="color: #6b21a8; margin: 0; font-size: 14px;">
            Never miss a visa deadline. Track your visa status, expiry dates, and receive timely alerts.
          </p>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 16px;">🎓 University Job Board</h4>
          <p style="color: #6b21a8; margin: 0; font-size: 14px;">
            Access exclusive academic positions and research opportunities from top universities.
          </p>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 16px;">🤖 Unlimited AI Features</h4>
          <p style="color: #6b21a8; margin: 0; font-size: 14px;">
            Unlimited resume tailoring and cover letter generation with our advanced AI.
          </p>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 16px;">⚡ Priority Support</h4>
          <p style="color: #6b21a8; margin: 0; font-size: 14px;">
            Get priority email support and faster response times from our team.
          </p>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #7c3aed; margin: 0 0 10px 0; font-size: 16px;">📈 Advanced Analytics</h4>
          <p style="color: #6b21a8; margin: 0; font-size: 14px;">
            Detailed insights and analytics to optimize your job search strategy.
          </p>
        </div>
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">🚀 Get Started Now</h3>
        <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
          <li style="margin: 10px 0;">Set up your visa tracker with important dates</li>
          <li style="margin: 10px 0;">Browse university job opportunities</li>
          <li style="margin: 10px 0;">Use unlimited AI resume tailoring for each application</li>
          <li style="margin: 10px 0;">Generate custom cover letters instantly</li>
          <li style="margin: 10px 0;">Explore advanced analytics on your dashboard</li>
        </ul>
      </div>

      <!-- CTA Buttons -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.FRONTEND_URL}/visa-tracker"
           style="display: inline-block; background-color: #8b5cf6; color: #ffffff;
                  padding: 16px 30px; text-decoration: none; border-radius: 8px;
                  font-weight: 600; font-size: 16px; margin: 10px;">
          Set Up Visa Tracker →
        </a>
        <a href="${process.env.FRONTEND_URL}/jobs?filter=university"
           style="display: inline-block; background-color: #10b981; color: #ffffff;
                  padding: 16px 30px; text-decoration: none; border-radius: 8px;
                  font-weight: 600; font-size: 16px; margin: 10px;">
          Browse University Jobs →
        </a>
      </div>

      <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="color: #92400e; margin: 0; font-size: 14px;">
          <strong>💳 Billing Info:</strong> You can manage your subscription, update payment methods, or view invoices anytime from your account settings.
        </p>
      </div>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        We're excited to have you as a Premium member! If you have any questions or need help with any features, just reply to this email.
      </p>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Here's to landing your dream job! 🎯<br>
        <strong>The AI Job Hunt Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
        AI Job Hunt Premium - Your AI-Powered Job Search Assistant
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        <a href="${process.env.FRONTEND_URL}/settings" style="color: #8b5cf6; text-decoration: none;">Manage Subscription</a> |
        <a href="${process.env.FRONTEND_URL}/settings" style="color: #8b5cf6; text-decoration: none;">Email Preferences</a> |
        <a href="${process.env.FRONTEND_URL}" style="color: #8b5cf6; text-decoration: none;">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
