import {Controller, Get, Res} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {Response} from "express";
import * as promClient from "prom-client";

@ApiTags("APP Controller")
@Controller()
export class AppController {}
