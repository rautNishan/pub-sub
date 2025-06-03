import { NotificationMessage } from "./notification.message.interface";

export interface NotificationHandler {
  handle(message: NotificationMessage, retryCount: number): Promise<any>;
}
