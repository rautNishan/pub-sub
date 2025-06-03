import { NotificationMessage } from "./notification.message.interface";

export interface NotificationHandler {
  handle(message: NotificationMessage): Promise<void>;
}
