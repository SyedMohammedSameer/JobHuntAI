export const passwordResetEmailTemplate = (user: any, resetUrl: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Reset Your Password</h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      <h2 style="color: #1f2937; margin-top: 0;">Hi ${user.name || 'there'},</h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        We received a request to reset your password for your AI Job Hunt account.
      </p>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
        Click the button below to create a new password:
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; background-color: #10b981; color: #ffffff;
                  padding: 16px 40px; text-decoration: none; border-radius: 8px;
                  font-weight: 600; font-size: 16px;">
          Reset Password →
        </a>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;">
          <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact us if you have concerns.
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
      </p>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 40px;">
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
        <a href="${process.env.FRONTEND_URL}" style="color: #10b981; text-decoration: none;">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
