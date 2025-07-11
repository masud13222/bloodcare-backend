const nodemailer = require('nodemailer');
const { logger } = require('../middleware/errorHandler');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `BloodCare <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });

    return info;
  } catch (error) {
    logger.error('Email send failed', {
      error: error.message,
      to: options.to,
      subject: options.subject
    });
    throw error;
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to BloodCare - Your Journey to Save Lives Begins!';
  const text = `
    Dear ${user.name},

    Welcome to BloodCare! We're thrilled to have you join our community of life-savers.

    Your account has been successfully created and you're now part of a network that helps save lives every day.

    Here's what you can do next:
    - Complete your profile verification
    - Update your availability status
    - Find blood requests in your area
    - Connect with other donors

    Thank you for choosing to make a difference!

    Best regards,
    The BloodCare Team
  `;

  await sendEmail({ to: user.email, subject, text });
};

// Send notification email
const sendNotificationEmail = async (user, notification) => {
  const subject = `BloodCare - ${notification.title}`;
  const text = `
    Dear ${user.name},

    ${notification.message}

    Please log in to your BloodCare account for more details.

    Best regards,
    The BloodCare Team
  `;

  await sendEmail({ to: user.email, subject, text });
};

// Send blood request notification
const sendBloodRequestNotification = async (donor, request) => {
  const subject = 'BloodCare - Urgent Blood Request in Your Area';
  const text = `
    Dear ${donor.name},

    There's an urgent blood request for ${request.bloodGroup} blood in your area.

    Patient: ${request.patientName}
    Hospital: ${request.hospitalName}
    Units needed: ${request.unitsNeeded}
    Urgency: ${request.urgencyLevel}
    Needed by: ${request.neededBy.toDateString()}

    Your help could save a life today!

    Please log in to your BloodCare account to respond to this request.

    Best regards,
    The BloodCare Team
  `;

  await sendEmail({ to: donor.email, subject, text });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  sendBloodRequestNotification
};