import nodemailer from "nodemailer";
import { env } from "../config/env";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

let transporter: nodemailer.Transporter | undefined;

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return undefined;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const smtpTransport = getTransporter();
  if (!smtpTransport) {
    return {
      id: `mock-${Date.now()}`,
      provider: "mock-smtp",
      to,
      subject
    };
  }

  return smtpTransport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html
  });
}

export async function sendReportEmail(input: SendEmailInput) {
  return sendEmail(input);
}

type SendVerificationEmailInput = {
  to: string;
  name: string;
  verificationUrl: string;
};

export async function sendVerificationEmail({ to, name, verificationUrl }: SendVerificationEmailInput) {
  return sendEmail({
    to,
    subject: "Verify your SureVision AI account",
    html: `
      <div style="font-family: Arial, sans-serif; background:#07111f; color:#e2e8f0; padding:32px;">
        <div style="max-width:560px; margin:0 auto; background:#0f172a; border:1px solid rgba(148,163,184,0.18); border-radius:20px; padding:32px;">
          <p style="margin:0 0 8px; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#67e8f9;">SureVision AI</p>
          <h1 style="margin:0 0 16px; font-size:28px; color:#f8fafc;">Verify your work account</h1>
          <p style="margin:0 0 18px; line-height:1.7;">Hi ${name},</p>
          <p style="margin:0 0 18px; line-height:1.7;">
            Confirm your email address to activate your SureVision AI workspace and complete sign-in.
          </p>
          <p style="margin:0 0 26px;">
            <a href="${verificationUrl}" style="display:inline-block; padding:14px 20px; background:#06b6d4; color:#07111f; text-decoration:none; border-radius:14px; font-weight:700;">
              Verify Email
            </a>
          </p>
          <p style="margin:0 0 12px; line-height:1.7; color:#94a3b8;">This verification link expires in 24 hours.</p>
          <p style="margin:0; line-height:1.7; color:#94a3b8;">If the button does not open, use this link:</p>
          <p style="margin:8px 0 0; word-break:break-all; color:#cbd5e1;">${verificationUrl}</p>
        </div>
      </div>
    `
  });
}

type SendPasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({ to, name, resetUrl }: SendPasswordResetEmailInput) {
  return sendEmail({
    to,
    subject: "Reset your SureVision AI password",
    html: `
      <div style="font-family: Arial, sans-serif; background:#07111f; color:#e2e8f0; padding:32px;">
        <div style="max-width:560px; margin:0 auto; background:#0f172a; border:1px solid rgba(148,163,184,0.18); border-radius:20px; padding:32px;">
          <p style="margin:0 0 8px; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#67e8f9;">SureVision AI</p>
          <h1 style="margin:0 0 16px; font-size:28px; color:#f8fafc;">Reset your password</h1>
          <p style="margin:0 0 18px; line-height:1.7;">Hi ${name},</p>
          <p style="margin:0 0 18px; line-height:1.7;">
            We received a request to reset your SureVision AI password. Click the button below to choose a new one.
          </p>
          <p style="margin:0 0 26px;">
            <a href="${resetUrl}" style="display:inline-block; padding:14px 20px; background:#06b6d4; color:#07111f; text-decoration:none; border-radius:14px; font-weight:700;">
              Reset Password
            </a>
          </p>
          <p style="margin:0 0 12px; line-height:1.7; color:#94a3b8;">This link expires in 1 hour.</p>
          <p style="margin:0; line-height:1.7; color:#94a3b8;">If you did not request this reset, you can safely ignore this email.</p>
        </div>
      </div>
    `
  });
}
