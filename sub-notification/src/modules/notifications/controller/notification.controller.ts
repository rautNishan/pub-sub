import { NotificationService } from "../services/notification.service";

export class NotificationController {
  private _notificationService: NotificationService;
  constructor() {
    this._notificationService = NotificationService.getInstance();
    console.log("Service instance");
  }
  async getAll(options?: { page: number; limit: number }) {
    const data = await this._notificationService.getAll({
      options: {
        skip: options?.page,
        take: options?.limit,
      },
    });
    return data;
  }

  async getSummary() {
    return this._notificationService.getSummary();
  }
}
