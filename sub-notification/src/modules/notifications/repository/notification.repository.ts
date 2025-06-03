import { Repository } from "typeorm";
import { BaseRepository } from "../../../common/database/base/repository/base.repository";
import { NotificationEnity } from "../entity/notification.entity";

export class NotificationRepository extends BaseRepository<NotificationEnity> {
  constructor(private readonly repo: Repository<NotificationEnity>) {
    super(repo);
  }
}
