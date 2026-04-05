import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { logger } from '../../common/logger';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter!: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('SMTP_HOST', 'localhost');
    const port = this.configService.get<number>('SMTP_PORT', 1025); // MailHog default

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth:
        host !== 'localhost'
          ? {
              user: this.configService.get<string>('SMTP_USER'),
              pass: this.configService.get<string>('SMTP_PASS'),
            }
          : undefined,
    });

    logger.info({ host, port }, 'EmailService initialized');
  }

  async sendEmail(options: { to: string; subject: string; text?: string; html?: string }) {
    try {
      const info = await this.transporter.sendMail({
        from: '"SuperBoard" <noreply@superboard.dev>',
        ...options,
      });

      logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully');
      return info;
    } catch (error) {
      logger.error({ error, to: options.to }, 'Failed to send email');
      throw error;
    }
  }

  async sendTaskAssignedEmail(
    userEmail: string,
    userName: string,
    taskTitle: string,
    taskUrl: string,
  ) {
    const subject = `[SuperBoard] Bạn đã được giao một công việc mới: ${taskTitle}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #0f172a;">Chào ${userName},</h2>
        <p style="color: #475569; font-size: 16px;">Bạn vừa được giao một công việc mới trên SuperBoard:</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong style="color: #1e293b; font-size: 18px;">${taskTitle}</strong>
        </div>
        <p style="margin-top: 30px;">
          <a href="${taskUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Xem chi tiết công việc</a>
        </p>
        <hr style="margin: 40px 0; border: 0; border-top: 1px solid #e2e8f0;" />
        <p style="color: #94a3b8; font-size: 12px;">Đây là email tự động từ hệ thống SuperBoard. Vui lòng không trả lời email này.</p>
      </div>
    `;

    return this.sendEmail({ to: userEmail, subject, html });
  }

  async sendWorkspaceInviteEmail(
    email: string,
    inviterName: string,
    workspaceName: string,
    inviteUrl: string,
  ) {
    const subject = `[SuperBoard] Lời mời tham gia workspace: ${workspaceName}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #0f172a;">Chào bạn,</h2>
        <p style="color: #475569; font-size: 16px;">
          <strong>${inviterName}</strong> đã mời bạn tham gia vào workspace <strong>${workspaceName}</strong> trên SuperBoard.
        </p>
        <p style="margin-top: 30px;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Chấp nhận lời mời</a>
        </p>
        <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
          Nếu bạn không biết về workspace này, bạn có thể bỏ qua email này. Lời mời sẽ tự động hết hạn sau 7 ngày.
        </p>
        <hr style="margin: 40px 0; border: 0; border-top: 1px solid #e2e8f0;" />
        <p style="color: #94a3b8; font-size: 12px;">Đây là email tự động từ hệ thống SuperBoard. Vui lòng không trả lời email này.</p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }
}
