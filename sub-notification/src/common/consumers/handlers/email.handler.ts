import { NotificationService } from "../../../modules/notifications/services/notification.service";
import { NotificationHandler } from "../interfaces/handler.interface";
import { NotificationMessage } from "../interfaces/notification.message.interface";

// Email notification handler
export class EmailNotificationHandler implements NotificationHandler {
  async handle(
    message: NotificationMessage,
    retries: number = 0
  ): Promise<any> {
    const notificationService = NotificationService.getInstance();
    try {
      console.log(`Processing email notification: ${message.id}`);
      console.log(`Recipient: ${message.user_id}`);
      console.log(`Email payload:`, message.payload);
      console.log(`Retry count: ${retries}`);
      await this.mockEmailSending(message);
      console.log(`Email notification ${message.id} processed successfully`);
      await notificationService.create({
        notification_id: message.id,
        user_id: message.user_id,
        type: message.type,
        payload: message.payload,
        staus: "processed",
        retry_count: retries,
        porcessed_at: new Date(),
        failed_at: null,
      });
      return {
        notification_id: message.id,
        status: "processed",
        retry_count: retries,
      };
    } catch (error) {
      if (retries >= 3) {
        await notificationService.create({
          notification_id: message.id,
          user_id: message.user_id,
          type: message.type,
          payload: "failed",
          staus: message.status,
          retry_count: retries,
          porcessed_at: new Date(),
          failed_at: new Date(),
        });
      }
      throw error;
    }
  }

  private async mockEmailSending(message: NotificationMessage): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    const shouldFail = Math.random() < 0.4;

    if (shouldFail) {
      const failureTypes = [
        "SMTP_CONNECTION_ERROR",
        "INVALID_EMAIL_ADDRESS",
        "RATE_LIMIT_EXCEEDED",
        "TEMPLATE_RENDERING_ERROR",
      ];

      const failureType =
        failureTypes[Math.floor(Math.random() * failureTypes.length)];

      console.log(
        `Email sending failed for notification ${message.id}: ${failureType}`
      );
      throw new Error(`Email sending failed: ${failureType}`);
    }

    console.log(`Email sent successfully to user ${message.user_id}`);
    console.log(`Subject: ${this.getEmailSubject(message)}`);
    console.log(`Sent at: ${new Date().toISOString()}`);
  }

  private getEmailSubject(message: NotificationMessage): string {
    const payload = message.payload as any;
    return payload?.subject || "Notification from Our Service";
  }
}
