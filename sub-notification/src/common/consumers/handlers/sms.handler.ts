import { NotificationHandler } from "../interfaces/handler.interface";
import { NotificationMessage } from "../interfaces/notification.message.interface";

export class SmsNotificationHandler implements NotificationHandler {
  async handle(message: NotificationMessage): Promise<void> {
    console.log(`Processing SMS notification: ${message.id}`);
    console.log(`Recipient: ${message.user_id}`);
    console.log(`SMS payload:`, message.payload);

    console.log(`SMS notification ${message.id} processed successfully`);
  }
}
