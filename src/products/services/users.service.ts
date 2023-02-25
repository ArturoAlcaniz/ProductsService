import {InjectRepository} from "@nestjs/typeorm";
import {User} from "$/../../../entities-lib/src/entities/user.entity";
import {BaseService} from "../../commons/service.commons";
import {FindOneOptions, Repository} from "typeorm";
import {Injectable} from "@nestjs/common";

@Injectable()
export class UsersService extends BaseService<User> {

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>
    ) {
        super();
    }

    getRepository(): Repository<User> {
        return this.userRepository;
    }

    findOne(options: FindOneOptions<User>): Promise<User> {
        return this.getRepository().findOne(options);
    }
}
