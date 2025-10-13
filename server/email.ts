import nodemailer from "nodemailer";
import { storage } from "./storage";

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const settings = await storage.getEmailSettings();
    if (!settings) {
      console.log("Email settings not configured");
      return;
    }

    let transporter;

    if (settings.provider === "sendgrid" && settings.sendgridApiKey) {
      // SendGrid via SMTP
      transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        auth: {
          user: "apikey",
          pass: settings.sendgridApiKey,
        },
      });
    } else if (settings.provider === "smtp" && settings.smtpHost) {
      // Generic SMTP (Gmail, Office 365, etc.)
      transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: (settings.smtpPort || 587) === 465,
        auth: settings.smtpUser && settings.smtpPassword ? {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        } : undefined,
      });
    } else {
      console.log("Email provider not configured properly");
      return;
    }

    await transporter.sendMail({
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

export async function sendAssignmentNotification(userEmail: string, userName: string, assetName: string) {
  const settings = await storage.getEmailSettings();
  if (!settings?.assignmentEnabled) return;

  const html = `
    <h2>Asset Assigned to You</h2>
    <p>Hi ${userName},</p>
    <p>The following asset has been assigned to you:</p>
    <p><strong>${assetName}</strong></p>
    <p>Please contact your administrator if you have any questions.</p>
  `;

  await sendEmail(userEmail, "Asset Assignment Notification", html);
}

export async function sendWarrantyExpiryNotification(adminEmails: string[], assetName: string, expiryDate: Date) {
  const settings = await storage.getEmailSettings();
  if (!settings?.warrantyExpiryEnabled) return;

  const html = `
    <h2>Warranty Expiring Soon</h2>
    <p>The warranty for the following asset is expiring soon:</p>
    <p><strong>${assetName}</strong></p>
    <p>Expiry Date: ${expiryDate.toLocaleDateString()}</p>
    <p>Please take necessary action.</p>
  `;

  for (const email of adminEmails) {
    await sendEmail(email, "Warranty Expiry Alert", html);
  }
}

export async function sendReturnReminder(userEmail: string, userName: string, assetName: string, returnDate: Date) {
  const settings = await storage.getEmailSettings();
  if (!settings?.returnReminderEnabled) return;

  const html = `
    <h2>Asset Return Reminder</h2>
    <p>Hi ${userName},</p>
    <p>This is a reminder that the following asset is due for return:</p>
    <p><strong>${assetName}</strong></p>
    <p>Expected Return Date: ${returnDate.toLocaleDateString()}</p>
    <p>Please return the asset on time.</p>
  `;

  await sendEmail(userEmail, "Asset Return Reminder", html);
}
