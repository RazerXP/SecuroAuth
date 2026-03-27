import { Resend } from "resend";

export function sendResetMail(to: string, resetUrl: string): void {
    const resend = new Resend(process.env.RESEND_API_KEY || '');
    resend.emails.send({
        from: 'onboarding@resend.dev',
        to: to,
        subject: 'Reset your password',
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Password Reset Request</h2>
            
            <p>We received a request to reset your password.</p>
            
            <p>Click the button below to set a new password:</p>
            
            <a href="${resetUrl}" 
            style="display: inline-block; padding: 10px 20px; margin: 15px 0;
                    background-color: #4CAF50; color: #fff; text-decoration: none;
                    border-radius: 5px;">
            Reset Password
            </a>
            
            <p>If you didn’t request this, you can safely ignore this email.</p>
            
            <p style="font-size: 12px; color: #888;">
            This link will expire in 15 minutes for security reasons.
            </p>
        </div>
        `
    });
}