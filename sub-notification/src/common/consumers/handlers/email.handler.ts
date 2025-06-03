import { NotificationHandler } from "../interfaces/handler.interface";
import { NotificationMessage } from "../interfaces/notification.message.interface";

// Email notification handler
export class EmailNotificationHandler implements NotificationHandler {
  async handle(message: NotificationMessage): Promise<void> {
    console.log(`Processing email notification: ${message.id}`);
    console.log(`Recipient: ${message.user_id}`);
    console.log(`Email payload:`, message.payload);

    console.log(`Email notification ${message.id} processed successfully`);
  }
}
