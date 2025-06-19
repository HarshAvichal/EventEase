import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Using Gmail
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail app password
    }
});

// Function to send emails
export const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"EventEase Team" <${process.env.EMAIL_USER}>`, // Sender address
            to, // Recipient address
            subject, // Subject line
            html: htmlContent // Email content in HTML
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return { success: true, message: "Email sent successfully" };
    } catch (error) {
        return { success: false, message: "Error sending email", error };
    }
};

// Reusable branded email template
export function getBrandedEmailTemplate(subject, contentHtml) {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; padding: 40px 0;">
    <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden;">
      <div style="background: #1a237e; padding: 24px 0; text-align: center;">
        <span style="font-size: 2rem; color: #fff; font-weight: bold; letter-spacing: 1px;">EventEase</span>
      </div>
      <div style="padding: 32px 24px 16px 24px;">
        <h2 style="color: #1a237e; text-align: center; margin-bottom: 16px;">${subject}</h2>
        ${contentHtml}
      </div>
      <div style="background: #f4f6fb; color: #aaa; text-align: center; font-size: 0.95rem; padding: 18px 0 10px 0;">
        &copy; ${new Date().getFullYear()} EventEase. All rights reserved.
      </div>
    </div>
  </div>
  `;
}
