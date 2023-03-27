import Joi from "joi";
import {
    DeepPartial,
    DeleteResult,
    EntityMetadata,
    FindManyOptions,
    FindOneOptions,
    FindOptionsWhere,
    Repository,
    SelectQueryBuilder,
} from "typeorm";
import { RelationMetadata } from "typeorm/metadata/RelationMetadata";

export abstract class BaseService<T> {
    private readonly relationCache: Record<string, EntityMetadata> = {};

    constructor(protected readonly repository: Repository<T>) { }

    private async createQueryBuilder({
        where,
        relations = [],
    }: FindOneOptions<T> & { relations?: string[] } = {}): Promise<SelectQueryBuilder<T>> {
        const queryBuilder = this.repository.createQueryBuilder();
        const metadata: any = this.repository.metadata;
    
        if (where) {
            queryBuilder.where(where);
        }
    
        for (const relation of relations) {
            let relMetadata = this.relationCache[relation];
    
            if (!relMetadata) {
                relMetadata = metadata.relations.find((r: RelationMetadata) => r.propertyName === relation);
    
                if (!relMetadata) {
                    throw new Error(`Relation '${relation}' not found on entity '${metadata.name}'.`);
                }
    
                this.relationCache[relation] = relMetadata;
            }
    
            queryBuilder.leftJoinAndSelect(`${metadata.name}.${relation}`, relation);
        }
    
        return queryBuilder;
    }

    /**
     * Finds entities that match the given conditions.
     * @param conditions - The conditions to match.
     * @returns A promise that resolves with an array of matching entities.
     */
    async find(conditions?: FindManyOptions<T> & { relations?: string[], order?: any }): Promise<T[]> {
        const schema = Joi.object({
            where: Joi.object(),
            order: Joi.object(),
            skip: Joi.number().integer().min(0),
            take: Joi.number().integer().min(1),
            relations: Joi.array().items(Joi.string()),
        });

        try {
            const validatedConditions = await schema.validateAsync(conditions);

            const queryBuilder: SelectQueryBuilder<T> = await this.createQueryBuilder(validatedConditions);

            const result = await queryBuilder.getMany();
            return result;
        } catch (error) {
            throw new Error(`Error finding entities: ${error.message}`);
        }
    }

    /**
     * Finds the first entity that matches the given conditions.
     * @param options - The query options.
     * @returns A promise that resolves with the first matching entity, or undefined if no entity was found.
     */
    async findOne(options?: FindOneOptions<T> & { relations?: string[] }): Promise<T | undefined> {
        const queryBuilder = await this.createQueryBuilder(options);

        return await queryBuilder.getOne();
    }

    /**
     * Finds all entities.
     * @returns A promise that resolves with an array of all entities.
     */
    async findAll(): Promise<T[]> {
        return await this.repository.find();
    }

    /**
     * Saves the given entity.
     * @param entity - The entity to save.
     * @returns A promise that resolves with the saved entity.
     */
    async save(entity: DeepPartial<T>): Promise<T> {
        try {
            return await this.repository.save(entity);
        } catch (error) {
            throw new Error(`Could not save entity: ${error.message}`);
        }
    }

    /**
     * Saves the given entities.
     * @param entities - The entities to save.
     * @returns A promise that resolves with an array of the saved entities.
     */
    async saveMany(entities: T[]): Promise<T[]> {
        const savedEntities = await this.repository.save(entities);
        return savedEntities;
    }

    /**
     * Removes the given entity.
     * @param entity - The entity to remove.
     * @returns A promise that resolves when the entity is removed.
     */
    async remove(entity: T): Promise<void> {
        try {
            if (!entity) {
                throw new Error('Entity cannot be null or undefined');
            }

            await this.repository.remove(entity);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Deletes the entity with the given ID.
     * @param id - The ID of the entity to delete.
     * @returns A promise that resolves when the entity is deleted.
     */
    async delete(conditions: FindOptionsWhere<T> | string[] | number[]): Promise<DeleteResult> {
        return await this.repository.delete(conditions);
    }

    /**
     * Deletes the entities with the given IDs.
     * @param ids - The IDs of the entities to delete.
     */
    async deleteMany(
        conditions: FindOptionsWhere<T> | string[] | number[]
    ): Promise<DeleteResult> {
        return await this.repository.delete(conditions);
    }

    /**
     * Counts the entities that match the given conditions.
     * @param conditions - The conditions to match.
     */
    async count(conditions?: DeepPartial<T>): Promise<number> {
        const queryBuilder = await this.createQueryBuilder();

        if (conditions) {
            Object.entries(conditions).forEach(([key, value]) => {
                queryBuilder.andWhere(`${this.repository.metadata.name}.${key} = :${key}`, { [key]: value });
            });
        }

        return await queryBuilder.getCount();
    }
}