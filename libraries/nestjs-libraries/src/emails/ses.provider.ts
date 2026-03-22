import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { EmailInterface } from '@gitroom/nestjs-libraries/emails/email.interface';

const ses = new SESv2Client({
  region: process.env.AWS_SES_REGION || 'us-east-1',
});

export class SesProvider implements EmailInterface {
  name = 'ses';
  validateEnvKeys = ['EMAIL_FROM_ADDRESS'];

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    emailFromName: string,
    emailFromAddress: string,
    replyTo?: string
  ) {
    try {
      const result = await ses.send(
        new SendEmailCommand({
          FromEmailAddress: `${emailFromName} <${emailFromAddress}>`,
          Destination: { ToAddresses: [to] },
          Content: {
            Simple: {
              Subject: { Data: subject },
              Body: { Html: { Data: html } },
            },
          },
          ...(replyTo && { ReplyToAddresses: [replyTo] }),
        })
      );

      return result;
    } catch (err) {
      console.error('SES email send error:', err);
      throw err;
    }
  }
}
