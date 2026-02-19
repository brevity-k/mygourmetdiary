import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ExpoPushMessage {
  to: string;
  title?: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class ExpoPushClient {
  private readonly logger = new Logger(ExpoPushClient.name);
  private readonly endpoint = 'https://exp.host/--/api/v2/push/send';

  async sendPushNotifications(messages: ExpoPushMessage[]): Promise<void> {
    if (messages.length === 0) return;

    try {
      const { data } = await axios.post<{ data: ExpoPushTicket[] }>(
        this.endpoint,
        messages,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      // Log errors, but don't throw — push is fire-and-forget
      for (let i = 0; i < data.data.length; i++) {
        const ticket = data.data[i];
        if (ticket.status === 'error') {
          this.logger.warn(
            `Push failed for ${messages[i].to}: ${ticket.message} (${ticket.details?.error})`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Expo push request failed', error);
    }
  }
}
