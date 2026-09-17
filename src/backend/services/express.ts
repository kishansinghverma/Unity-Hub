import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import http from 'http';
import emandiRoute from '../routes/emandi';
import dispatchesRoute from '../routes/dispatches';
import splitwiseRoute from '../routes/splitwise';
import whatsappRoute from '../routes/whatsapp';
import fileRoute from '../routes/files';
import mqttRoute from '../routes/mqtt';
import expenseRoute from '../routes/expense';
import oakterRemoteRoute from '../routes/oakterremote';
import documentsRoute from '../routes/documents';
import visionRoute from '../routes/vision';
import vtagRoute from '../routes/vtag';
import { Logger } from '../common/models';
import { source } from '../common/constants';
import { validationMiddleware } from '../common/validationMiddleware';

class ExpressServer {
    private logger: Logger;
    private address = process.env.ADDRESS || '0.0.0.0';
    private port = parseInt(process.env.PORT || '8080');
    private router = express();
    private server = http.createServer(this.router);

    private tracer = (request: Request, response: Response, next: NextFunction) => {
        this.logger.log(`${request.method} -> ${request.originalUrl}`);
        next();
    }

    constructor() {
        this.logger = new Logger(source.http);
    }

    private registerMiddleWares = () => {
        this.router.use(this.tracer);
        this.router.use(bodyParser.json({ limit: '5mb' }));
        this.router.use(bodyParser.urlencoded({ extended: true }));
        this.router.use(cors());
        this.router.use(validationMiddleware);
    }

    private registerStaticServer = () => {
        this.router.use("/emandi", express.static(path.resolve('dist/frontends/emandi')));
        this.router.get('/emandi/*', (req, res) => { res.sendFile(path.join(path.resolve('dist/frontends/emandi'), 'index.html')) });

        this.router.use("/remote", express.static(path.resolve('dist/frontends/emandi')));
        this.router.get('/remote*', (req, res) => { res.sendFile(path.join(path.resolve('dist/frontends/emandi'), 'index.html')) });
    }

    private registerRoutes = () => {
        this.router.use('/api/emandi', emandiRoute);
        this.router.use('/api/dispatches', dispatchesRoute);
        this.router.use('/api/expenses', expenseRoute);
        this.router.use('/api/files', fileRoute);
        this.router.use('/api/documents', documentsRoute);
        this.router.use('/api/vision', visionRoute);
        this.router.use('/api/vtag', vtagRoute);
        this.router.use('/api/mqtt', mqttRoute);
        this.router.use('/api/oakterremote', oakterRemoteRoute);
        this.router.use('/api/splitwise', splitwiseRoute);
        this.router.use('/api/whatsapp', whatsappRoute);
        this.router.all("*", (req, res) => res.status(404).end());
    }

    public initialize = () => {
        this.registerMiddleWares();
        this.registerStaticServer();
        this.registerRoutes();
        this.server.listen(this.port, this.address, () => this.logger.success(`Unity server is live on ${this.port}! 🎉`));
    }
}

export const httpServer = new ExpressServer();
