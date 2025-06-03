import { Column, Entity } from "typeorm";
import { DataBaseBaseEntity } from "../../../common/database/base/entities/base.entity";

export const NotificationEntityName = "notifications";
@Entity({
  name: NotificationEntityName,
})
export class NotificationEnity extends DataBaseBaseEntity {
  @Column({
    type: "int",
    name: "notification_id",
    nullable: false,
    unique: false,
  })
  notification_id: number;

  @Column({
    type: "int",
    name: "user_id",
    nullable: false,
    unique: false,
  })
  user_id: number;

  @Column({
    type: "varchar",
    name: "type",
    nullable: false,
    unique: false,
  })
  type: string;

  @Column("json", { nullable: true })
  payload: object;

  @Column({
    type: "enum",
    enum: ["pending", "processing", "processed", "failed"],
    default: "pending",
  })
  status: "pending" | "processing" | "processed" | "failed";

  @Column({ type: "int", default: 0 })
  retry_count: number;

  @Column({ type: "timestamp", nullable: true })
  processed_at: Date | null;

  @Column({ type: "timestamp", nullable: true })
  failed_at: Date | null;
}
