import { DeepPartial, Repository } from "typeorm";
import { NotificationRepository } from "../repository/notification.repository";
import { DBConnection } from "../../../database/connections/database.connection";
import { NotificationEnity } from "../entity/notification.entity";
import {
  ICreateOptions,
  IFindAllOptions,
  IFindByIdOptions,
  IFindOneOption,
  IOnlyEntityManager,
  IPaginatedData,
  IUpdateOptions,
  IUpdateRawOptions,
} from "../../../common/database/interfaces/database.interface";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

export class NotificationService {
  private _notificationRepo: NotificationRepository;
  private static _notificationService: NotificationService;

  private constructor() {
    const _repo: Repository<NotificationEnity> =
      DBConnection.getConnection().getRepository(NotificationEnity);
    this._notificationRepo = new NotificationRepository(_repo);
  }

  public static getInstance(): NotificationService {
    if (!NotificationService._notificationService) {
      //If it is static use Class name instead of this keyword
      NotificationService._notificationService = new NotificationService();
    }
    return NotificationService._notificationService;
  }

  async create(data: any, options?: ICreateOptions) {
    return await this._notificationRepo.create(data, options);
  }

  async getSummary() {
    return this._notificationRepo
      .createQueryBuilder("n")
      .select("n.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("n.status")
      .getRawMany();
  }

  async update(
    data: DeepPartial<NotificationEnity>,
    options?: IUpdateOptions
  ): Promise<NotificationEnity> {
    return await this._notificationRepo.update(data, options);
  }

  async getById(
    id: number,
    options?: IFindByIdOptions<NotificationEnity>
  ): Promise<NotificationEnity | null> {
    return await this._notificationRepo.getById(id, options);
  }

  async getOne(
    options?: IFindOneOption<NotificationEnity>
  ): Promise<NotificationEnity | null> {
    return await this._notificationRepo.getOne(options);
  }

  async getAll(
    options?: IFindAllOptions<NotificationEnity>
  ): Promise<IPaginatedData<NotificationEnity>> {
    return this._notificationRepo.getAll(options);
  }

  async softDelete(
    entity: NotificationEnity,
    options?: IOnlyEntityManager
  ): Promise<NotificationEnity> {
    return await this._notificationRepo.softDelete(entity, options);
  }
  async restore(
    entity: NotificationEnity,
    options?: IOnlyEntityManager
  ): Promise<NotificationEnity> {
    return await this._notificationRepo.restore(entity, options);
  }

  async hardDelete(
    entity: NotificationEnity,
    options?: IOnlyEntityManager
  ): Promise<NotificationEnity> {
    return await this._notificationRepo.hardDelete(entity, options);
  }

  async updateRaw(
    data: QueryDeepPartialEntity<NotificationEnity>,
    options: IUpdateRawOptions<NotificationEnity>
  ) {
    return await this._notificationRepo._updateRaw(data, options);
  }

  async createOrUpdate(data: any): Promise<any> {
    const existing = await this._notificationRepo.getOne({
      options: {
        where: { notification_id: data.notification_id },
      },
    });

    if (existing) {
      // Update
      await this._notificationRepo.update(
        { notification_id: data.notification_id },
        data
      );
      return { ...existing, ...data };
    } else {
      return this._notificationRepo.create(data);
    }
  }
}
