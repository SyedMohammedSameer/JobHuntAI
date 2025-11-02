export const visaExpiryAlertTemplate = (user: any, visa: any, daysRemaining: number): string => {
  const urgencyColor = daysRemaining <= 30 ? '#ef4444' : daysRemaining <= 60 ? '#f59e0b' : '#10b981';
  const urgencyBg = daysRemaining <= 30 ? '#fef2f2' : daysRemaining <= 60 ? '#fffbeb' : '#f0fdf4';
  const urgencyText = daysRemaining <= 30 ? 'Urgent' : daysRemaining <= 60 ? 'Important' : 'Upcoming';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visa Expiry Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Visa Expiry Alert</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.name || 'there'},</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        This is an important reminder about your visa status.
      </p>

      <!-- Alert Box -->
      <div style="background-color: ${urgencyBg}; border-radius: 12px; padding: 24px; margin: 30px 0; border: 3px solid ${urgencyColor};">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background-color: ${urgencyColor}; color: #ffffff; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px; text-transform: uppercase;">
            ${urgencyText}
          </span>
        </div>
        <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px; text-align: center;">
          ${daysRemaining} Days Remaining
        </h3>
        <div style="text-align: center; color: #4b5563; font-size: 16px;">
          <p style="margin: 8px 0;"><strong>Visa Type:</strong> ${visa.visaType || 'Not specified'}</p>
          <p style="margin: 8px 0;"><strong>Expiry Date:</strong> ${new Date(visa.expiryDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          ${visa.currentStatus ? `<p style="margin: 8px 0;"><strong>Status:</strong> ${visa.currentStatus}</p>` : ''}
        </div>
      </div>

      ${daysRemaining <= 30 ? `
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0;">
          <h3 style="color: #991b1b; margin-top: 0;">🚨 Immediate Action Required</h3>
          <p style="color: #991b1b; margin: 0; font-size: 14px;">
            Your visa expires in less than 30 days. Please take immediate action to avoid any complications with your legal status.
          </p>
        </div>
      ` : ''}

      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">📋 Action Items</h3>
        <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
          <li style="margin: 10px 0;">Review your visa renewal or extension requirements</li>
          <li style="margin: 10px 0;">Gather necessary documentation</li>
          <li style="margin: 10px 0;">Contact your immigration attorney or advisor</li>
          <li style="margin: 10px 0;">Submit applications well before the deadline</li>
          <li style="margin: 10px 0;">Update your visa tracker with next steps</li>
        </ul>
      </div>

      ${visa.gracePeriod ? `
        <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>ℹ️ Grace Period:</strong> ${visa.gracePeriod} days grace period may apply depending on your visa type. Verify with immigration authorities.
          </p>
        </div>
      ` : ''}

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${process.env.FRONTEND_URL}/visa-tracker"
           style="display: inline-block; background-color: ${urgencyColor}; color: #ffffff;
                  padding: 16px 40px; text-decoration: none; border-radius: 8px;
                  font-weight: 600; font-size: 16px;">
          Update Visa Tracker →
        </a>
      </div>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Stay compliant and keep your status up to date. We're here to help you stay organized!
      </p>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Best regards,<br>
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
