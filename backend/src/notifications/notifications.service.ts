import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { PrismaService } from '../prisma/prisma.service';

export interface StaleAlert {
  id: string;
  company_name: string;
  role_title: string;
  applied_date: Date;
  days_waiting: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sesClient: SESClient;
  private readonly isMockSes: boolean;
  private readonly senderEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.senderEmail = this.configService.get<string>('SES_SENDER_EMAIL') || 'notifications@jobtracker.local';

    const hasAwsCreds = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    this.isMockSes = !hasAwsCreds && process.env.NODE_ENV !== 'production';

    this.sesClient = new SESClient({
      region,
      ...(this.isMockSes
        ? {
            credentials: {
              accessKeyId: 'mock-key',
              secretAccessKey: 'mock-secret',
            },
          }
        : {}),
    });

    this.logger.log(`NotificationsService initialized (SES Mock Mode: ${this.isMockSes})`);
  }

  /**
   * Daily Cron Job at 9:00 AM to scan for applications in APPLIED status > 14 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDailyStaleCheck() {
    this.logger.log('Starting daily scheduled stale applications scan...');
    const users = await this.prisma.users.findMany();

    for (const user of users) {
      try {
        await this.processUserStaleApplications(user.id, user.email);
      } catch (err: any) {
        this.logger.error(`Failed to process reminders for user ${user.email}: ${err.message}`);
      }
    }
    this.logger.log('Daily scheduled stale applications scan completed.');
  }

  /**
   * Get stale alerts for a specific user (for frontend notification bell)
   */
  async getStaleAlerts(userId: string): Promise<StaleAlert[]> {
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const staleApps = await this.prisma.applications.findMany({
      where: {
        user_id: userId,
        status: 'APPLIED',
        applied_date: { lte: fourteenDaysAgo },
        interviews: { none: {} },
      },
      orderBy: { applied_date: 'asc' },
    });

    return staleApps.map((app) => ({
      id: app.id,
      company_name: app.company_name,
      role_title: app.role_title,
      applied_date: app.applied_date,
      days_waiting: Math.round((now.getTime() - new Date(app.applied_date).getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  /**
   * Manual trigger for testing/demo from frontend or API
   */
  async triggerManualCheck(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const alerts = await this.processUserStaleApplications(user.id, user.email);
    return {
      message: 'Stale application scan completed',
      stale_count: alerts.length,
      alerts,
      dispatched_via: this.isMockSes ? 'Mock Logger (Local Simulation)' : 'AWS SES',
    };
  }

  private async processUserStaleApplications(userId: string, userEmail: string): Promise<StaleAlert[]> {
    const staleAlerts = await this.getStaleAlerts(userId);

    if (staleAlerts.length === 0) {
      this.logger.log(`No stale applications found for user ${userEmail}`);
      return [];
    }

    await this.sendStaleReminderEmail(userEmail, staleAlerts);
    return staleAlerts;
  }

  private async sendStaleReminderEmail(recipientEmail: string, staleAlerts: StaleAlert[]) {
    const subject = `JobTracker Reminder: ${staleAlerts.length} Application${staleAlerts.length > 1 ? 's' : ''} Awaiting Follow-Up`;
    const htmlBody = this.buildEmailHtml(recipientEmail, staleAlerts);

    if (this.isMockSes) {
      this.logger.log(
        `[MOCK SES EMAIL] TO: ${recipientEmail} | SUBJECT: ${subject} | STALE_COUNT: ${staleAlerts.length}`,
      );
      return;
    }

    try {
      const command = new SendEmailCommand({
        Source: this.senderEmail,
        Destination: {
          ToAddresses: [recipientEmail],
        },
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: htmlBody, Charset: 'UTF-8' },
          },
        },
      });

      await this.sesClient.send(command);
      this.logger.log(`SES reminder email successfully dispatched to ${recipientEmail}`);
    } catch (err: any) {
      this.logger.error(`AWS SES send error for ${recipientEmail}: ${err.message}`);
      throw err;
    }
  }

  private buildEmailHtml(userEmail: string, items: StaleAlert[]): string {
    const itemsList = items
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 16px; font-weight: 600; color: #1e293b;">${item.company_name}</td>
          <td style="padding: 12px 16px; color: #475569;">${item.role_title}</td>
          <td style="padding: 12px 16px; color: #64748b;">${new Date(item.applied_date).toISOString().split('T')[0]}</td>
          <td style="padding: 12px 16px; text-align: right;">
            <span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
              ${item.days_waiting} days
            </span>
          </td>
        </tr>`,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="background-color: #0284c7; padding: 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Job Application Follow-Up Reminder</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Keep your hiring pipeline moving forward</p>
            </div>
            
            <div style="padding: 24px;">
              <p style="color: #334155; font-size: 14px; line-height: 1.5;">
                Hello <strong>${userEmail}</strong>,
              </p>
              <p style="color: #475569; font-size: 14px; line-height: 1.5;">
                The following <strong>${items.length}</strong> applications have been in the <em>Applied</em> stage for over 14 days without an interview scheduled. Consider reaching out to the recruiter or hiring manager to check on your status.
              </p>

              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <thead>
                  <tr style="background-color: #f1f5f9; text-align: left; color: #475569; font-size: 12px; text-transform: uppercase;">
                    <th style="padding: 10px 16px;">Company</th>
                    <th style="padding: 10px 16px;">Role</th>
                    <th style="padding: 10px 16px;">Applied Date</th>
                    <th style="padding: 10px 16px; text-align: right;">Waiting</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                </tbody>
              </table>

              <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #0369a1;">
                  💡 <strong>Tip:</strong> Re-engaging with a polite email reaffirming your enthusiasm for the role increases interview callbacks by up to 30%!
                </p>
              </div>
            </div>

            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
              Sent by Job Application Tracker &bull; Automated Follow-Up Service
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
