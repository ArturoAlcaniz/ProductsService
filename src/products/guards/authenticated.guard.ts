import {CanActivate, ExecutionContext, Injectable} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {User} from "$/../../../entities-lib/src/entities/user.entity";
import {UsersService} from "../services/users.service";
import {firstValueFrom, lastValueFrom} from "rxjs";
import {HttpService} from "@nestjs/axios";

@Injectable()
export class AuthenticatedGuard implements CanActivate {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private httpService: HttpService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        if (!request.cookies["jwt"]) {
            return false;
        }

        const cookie = request.cookies["jwt"];

        try {
            if (!this.jwtService.verify(cookie)) {
                return false;
            }
        } catch (err) {
            return false;
        }

        const user = this.jwtService.decode(cookie)["userId"];

        const userLoggedIn = await (await lastValueFrom(
            this.httpService.post(
                `http://${process.env.USERS_CONTAINER_NAME}:${process.env.USERS_CONTAINER_PORT}/auth/loggedIn`,
                JSON.stringify({user: user}),
                {
                    headers: {"content-type": "application/json"}
                }
            )
        )).data;

        if (cookie != userLoggedIn) {
            return false;
        }

        let userEntity: User = await this.usersService.findOne({
            where: {id: user},
        });

        request.user = userEntity;

        return true;
    }
}
