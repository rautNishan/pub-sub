import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationInit1748937993361 implements MigrationInterface {
  name = "NotificationInit1748937993361";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_status_enum" AS ENUM('pending', 'processing', 'processed', 'failed')`
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "notification_id" integer NOT NULL, "user_id" integer NOT NULL, "type" character varying NOT NULL, "payload" json, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'pending', "retry_count" integer NOT NULL DEFAULT '0', "processed_at" TIMESTAMP, "failed_at" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
  }
}
