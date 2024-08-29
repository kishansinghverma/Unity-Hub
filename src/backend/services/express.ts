import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import emandiRoute from '../routes/emandi';
import splitwiseRoute from '../routes/splitwise';
import whatsappRoute from '../routes/whatsapp';
import fileRoute from '../routes/files';
import mqttRoute from '../routes/mqtt';
import expenseRoute from '../routes/expense';
import { Logger } from '../common/models';
import { source } from '../common/constants';

class ExpressServer {
    private logger: Logger;
    private address = process.env.ADDRESS || 'localhost';
    private port = parseInt(process.env.PORT || '8080');
    private router = express();
    private tracer = (request: Request, response: Response, next: NextFunction) => {
        const ipAddress = request.ip || request.connection.remoteAddress;
        const method = request.method;
        const path = request.originalUrl;
        console.error(`[${method}] ${ipAddress} -> ${path}`);
        next();
    }

    constructor() {
        this.logger = new Logger(source.server);
    }

    private registerMiddleWares = () => {
        this.router.use(this.tracer);
        this.router.use(bodyParser.json({ limit: '5mb' }));
        this.router.use(bodyParser.urlencoded({ extended: true }));
        this.router.use(cors());
    }

    private registerStaticServer = () => {
        this.router.use("/emandi", express.static(path.resolve('dist/frontends/emandi')));
        this.router.get('/emandi/*', (req, res) => { res.sendFile(path.join(path.resolve('dist/frontends/emandi'), 'index.html')) });
    }

    private registerRoutes = () => {
        this.router.get('/api/test', (request, response) => { });

        this.router.use('/api/emandi', emandiRoute);
        this.router.use('/api/expenses', expenseRoute);
        this.router.use('/api/files', fileRoute);
        this.router.use('/api/mqtt', mqttRoute);
        this.router.use('/api/splitwise', splitwiseRoute);
        this.router.use('/api/whatsapp', whatsappRoute);
        this.router.all("*", (req, res) => res.status(404).end());
    }

    public initialize = () => {
        console.log('\x1b[33m%s\x1b[0m', 'This is a colored output...');
        this.registerMiddleWares();
        this.registerStaticServer();
        this.registerRoutes();
        this.router.listen(this.port, this.address, () => this.logger.info(`Unity server is live on ${this.port}! 🎉`));
    }
}

export const httpServer = new ExpressServer();