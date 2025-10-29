// services/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASS },
});

export const sendConfirmationEmail = async (to, name, service, date, time) => {
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to,
    subject: "Appointment Confirmation - CarzSpas",
    text: `Dear ${name}, your ${service} appointment is confirmed for ${date} at ${time}. 🚗`,
  };

  await transporter.sendMail(mailOptions);
};

export const sendCancellationEmail = async (to, name, service, date, time) => {
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to,
    subject: "Appointment Cancelled - CarzSpas",
    text: `Dear ${name}, your ${service} appointment scheduled for ${date} at ${time} has been cancelled. We hope to serve you again soon!`,
  });
};
