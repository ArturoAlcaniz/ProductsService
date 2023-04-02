import './paths';
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as Prometheus from 'prom-client';
import cookieParser from 'cookie-parser';

async function bootstrap() {
    const promBundle = require('express-prom-bundle');
    // Configura el almacenamiento persistente para las métricas
    const prometheus = new Prometheus.Registry();
    Prometheus.collectDefaultMetrics({ register: prometheus });

    // Crea la aplicación NestJS
    const app = await NestFactory.create(ApplicationModule, {
        snapshot: true,
    });

    // Configura Swagger
    const config = new DocumentBuilder()
        .setTitle('API Document')
        .setDescription('TFG')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    // Configura los middleware globales
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: true,
        }),
    );
    app.use(cookieParser());

    // Agrega el middleware de prometheus
    app.use(
        promBundle({
            includeMethod: true,
            includePath: true,
            promClient: {
                register: prometheus,
            },
            metricsPath: '/metrics',
        }),
    );

    // Registra la métrica http_requests_total
    const httpRequestCounter = new Prometheus.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'path', 'status'],
        registers: [prometheus],
    });
    app.use((req, res, next) => {
        const end = res.end;
        res.end = function (...args) {
            httpRequestCounter.labels(req.method, req.path, res.statusCode.toString()).inc();
            end.apply(res, args);
        };
        next();
    });

    // Inicia la aplicación
    await app.listen(process.env.USERS_CONTAINER_PORT);
}
bootstrap();
