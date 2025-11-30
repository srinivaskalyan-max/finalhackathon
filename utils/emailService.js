import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send welcome email
export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Educational Library" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Welcome to Educational Library!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Welcome to Educational Library, ${userName}!</h2>
          <p>Thank you for joining our educational resource platform.</p>
          <p>You can now:</p>
          <ul>
            <li>Browse thousands of educational resources</li>
            <li>Upload and share your own materials</li>
            <li>Connect with other learners</li>
            <li>Access premium content</li>
          </ul>
          <p>Get started by exploring our resource library!</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
             style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Go to Dashboard
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// Send resource upload notification
export const sendResourceUploadNotification = async (userEmail, userName, resourceTitle) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Educational Library" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Resource Upload Successful',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Resource Uploaded Successfully!</h2>
          <p>Hi ${userName},</p>
          <p>Your resource "<strong>${resourceTitle}</strong>" has been successfully uploaded to the platform.</p>
          <p>It is now available for other users to discover and access.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
             style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Your Resources
          </a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending resource upload notification:', error);
  }
};

// Send payment success email
export const sendPaymentSuccessEmail = async (userEmail, userName, resourceTitle, amount) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Educational Library" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Payment Successful - Educational Library',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Payment Successful!</h2>
          <p>Hi ${userName},</p>
          <p>Your payment has been processed successfully.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Resource:</strong> ${resourceTitle}</p>
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          </div>
          <p>You can now access this premium resource from your dashboard.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
             style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Access Resource
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending payment success email:', error);
  }
};

// Send new feedback notification
export const sendFeedbackNotification = async (userEmail, userName, resourceTitle, rating, comment) => {
  try {
    const transporter = createTransporter();

    const stars = '⭐'.repeat(rating);

    const mailOptions = {
      from: `"Educational Library" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'New Feedback on Your Resource',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">New Feedback Received!</h2>
          <p>Hi ${userName},</p>
          <p>Someone left feedback on your resource "<strong>${resourceTitle}</strong>":</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Rating:</strong> ${stars} (${rating}/5)</p>
            ${comment ? `<p><strong>Comment:</strong> "${comment}"</p>` : ''}
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
             style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Resource
          </a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending feedback notification:', error);
  }
};

// Send chat message notification
export const sendChatMessageNotification = async (userEmail, userName, senderName, messagePreview) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Educational Library" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `New message from ${senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">New Message Received</h2>
          <p>Hi ${userName},</p>
          <p><strong>${senderName}</strong> sent you a message:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p>"${messagePreview}"</p>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/chat" 
             style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Reply to Message
          </a>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending chat message notification:', error);
  }
};

// Send admin notification
export const sendAdminNotification = async (subject, message, details) => {
  try {
    const transporter = createTransporter();
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
      from: `"Educational Library System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[Admin] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">[Admin Notification]</h2>
          <h3>${subject}</h3>
          <p>${message}</p>
          ${details ? `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <pre style="white-space: pre-wrap;">${JSON.stringify(details, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};
