import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT', 587);
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');
    const smtpSecure = this.configService.get('SMTP_SECURE', 'false') === 'true';

    // If SMTP is configured, use it; otherwise, use console logging for development
    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort.toString()),
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    const from = this.configService.get('SMTP_FROM', 'noreply@csis.edu');

    if (this.transporter) {
      // Send via SMTP
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
          text: text || this.htmlToText(html),
        });
      } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email');
      }
    } else {
      // Development mode: log to console
      console.log('\n📧 Email (Development Mode):');
      console.log(`To: ${to}`);
      console.log(`From: ${from}`);
      console.log(`Subject: ${subject}`);
      console.log(`\n${text || this.htmlToText(html)}\n`);
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string, resetUrl: string): Promise<void> {
    const subject = 'Password Reset Request - CSIS IAM';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password for your CSIS IAM account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <div class="footer">
            <p>CSIS Identity & Access Management Service</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `Password Reset Request\n\nYou requested to reset your password. Click this link: ${resetUrl}\n\nThis link expires in 1 hour.`;

    await this.sendEmail(to, subject, html, text);
  }

  async sendEmailVerificationEmail(to: string, verificationToken: string, verificationUrl: string): Promise<void> {
    const subject = 'Verify Your Email - CSIS IAM';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering with CSIS IAM!</p>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <div class="footer">
            <p>CSIS Identity & Access Management Service</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `Verify Your Email\n\nPlease verify your email by clicking this link: ${verificationUrl}\n\nThis link expires in 24 hours.`;

    await this.sendEmail(to, subject, html, text);
  }

  async sendWelcomeEmail(to: string, displayName: string): Promise<void> {
    const subject = 'Welcome to CSIS IAM';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to CSIS IAM, ${displayName}!</h2>
          <p>Your account has been successfully created and verified.</p>
          <p>You can now access all CSIS services using your credentials.</p>
          <div class="footer">
            <p>CSIS Identity & Access Management Service</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const text = `Welcome to CSIS IAM!\n\nYour account has been successfully created and verified.`;

    await this.sendEmail(to, subject, html, text);
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

