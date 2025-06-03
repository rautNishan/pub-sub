import { NotificationService } from "../../../modules/notifications/services/notification.service";
import { NotificationHandler } from "../interfaces/handler.interface";
import { NotificationMessage } from "../interfaces/notification.message.interface";

export class SmsNotificationHandler implements NotificationHandler {
  async handle(
    message: NotificationMessage,
    retries: number = 0
  ): Promise<any> {
    const notificationService = NotificationService.getInstance();
    try {
      console.log(`Processing SMS notification: ${message.id}`);
      console.log(`Recipient: ${message.user_id}`);
      console.log(`SMS payload:`, message.payload);

      await this.mockSMSSending(message);
      await notificationService.createOrUpdate({
        notification_id: message.id,
        user_id: message.user_id,
        type: message.type,
        payload: message.payload,
        status: "processed",
        retry_count: retries,
        processed_at: new Date(),
        failed_at: null,
      });
      console.log(`SMS notification ${message.id} processed successfully`);
      return {
        notification_id: message.id,
        status: "processed",
        retry_count: retries,
      };
    } catch (error) {
      if (retries >= 3) {
        await notificationService.createOrUpdate({
          notification_id: Number(message.id),
          user_id: Number(message.user_id),
          type: message.type,
          payload: message.payload,
          status: "failed",
          retry_count: retries,
          processed_at: null,
          failed_at: new Date(),
        });
      }
      throw error;
    }
  }

  private async mockSMSSending(message: NotificationMessage): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    const shouldFail = Math.random() < 0.4;

    if (shouldFail) {
      const failureTypes = [
        "SMS_ERROR_CUSTOM_1",
        "NUMBER_NOT_AVAILABLE",
        "RATE_LIMIT_EXCEEDED",
        "TEMPLATE_RENDERING_ERROR",
      ];

      const failureType =
        failureTypes[Math.floor(Math.random() * failureTypes.length)];

      console.log(
        `Sms sending failed for notification ${message.id}: ${failureType}`
      );
      throw new Error(`Sms sending failed: ${failureType}`);
    }

    console.log(`Sms sent successfully to user ${message.user_id}`);

    console.log(`Sent at: ${new Date().toISOString()}`);
  }
}
