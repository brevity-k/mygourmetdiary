import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

export interface DigestItem {
  title: string;
  subtitle: string;
  url?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT', 587);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('Email transport configured');
    } else {
      this.logger.warn('SMTP not configured — email sending disabled');
    }
  }

  private get fromAddress(): string {
    return this.config.get<string>('SMTP_FROM', 'noreply@mygourmetdiary.com');
  }

  async sendDigest(userId: string, items: DigestItem[]): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Email transport not configured, skipping digest');
      return false;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true },
    });

    if (!user?.email) {
      this.logger.warn(`No email for user ${userId}`);
      return false;
    }

    const itemsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee">
              <strong>${this.escapeHtml(item.title)}</strong>
              <br><span style="color:#666;font-size:13px">${this.escapeHtml(item.subtitle)}</span>
              ${item.url ? `<br><a href="${item.url}" style="color:#d4870e;font-size:12px">View</a>` : ''}
            </td>
          </tr>`,
      )
      .join('\n');

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#333">Your Weekly Gourmet Digest</h2>
        <p style="color:#666">Hi ${this.escapeHtml(user.displayName || 'there')}, here's what happened this week:</p>
        <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>
        <p style="color:#999;font-size:12px;margin-top:24px">
          MyGourmetDiary &mdash; Your personal food journal
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: user.email,
        subject: `Your Weekly Gourmet Digest — ${items.length} updates`,
        html,
      });
      this.logger.log(`Digest sent to ${user.email} (${items.length} items)`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send digest to ${user.email}: ${err}`);
      return false;
    }
  }

  async sendWelcome(userId: string): Promise<boolean> {
    if (!this.transporter) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true },
    });

    if (!user?.email) return false;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#333">Welcome to MyGourmetDiary!</h2>
        <p>Hi ${this.escapeHtml(user.displayName || 'there')},</p>
        <p>Start your gourmet journey by creating your first note. Capture restaurants, wines, and spirits you love.</p>
        <p style="color:#999;font-size:12px;margin-top:24px">
          MyGourmetDiary &mdash; Your personal food journal
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: user.email,
        subject: 'Welcome to MyGourmetDiary!',
        html,
      });
      return true;
    } catch (err) {
      this.logger.error(`Failed to send welcome to ${user.email}: ${err}`);
      return false;
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
