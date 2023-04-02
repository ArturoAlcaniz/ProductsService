import {Controller, Get, Res} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import { Response } from 'express';
import * as promClient from 'prom-client';


@ApiTags("APP Controller")
@Controller()
export class AppController {
    @Get('metrics')
    async getMetrics(@Res() res: Response) {
      res.set('Content-Type', promClient.register.contentType);
      res.send(await promClient.register.metrics());
    }
}
