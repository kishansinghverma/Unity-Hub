import 'dotenv/config';
import express from 'express';
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
import { source, style } from '../common/constants';

class ExpressServer {
    private logger: Logger;
    private address = process.env.ADDRESS || 'localhost';
    private port = parseInt(process.env.PORT || '8080');
    private router = express();

    constructor() {
        this.logger = new Logger(source.server);
    }

    private registerMiddleWares = () => {
        this.router.use(bodyParser.json({ limit: '5mb' }));
        this.router.use(bodyParser.urlencoded({ extended: true }));
        this.router.use(cors());
    }

    private registerStaticServer = () => {
        this.router.use("/emandi", express.static(path.resolve('dist/frontends/emandi')));
    }

    private registerRoutes = () => {
        this.router.get('/api/test', (request, response) => {});

        this.router.use('/api/emandi', emandiRoute);
        this.router.use('/api/expenses', expenseRoute);
        this.router.use('/api/files', fileRoute);
        this.router.use('/api/mqtt', mqttRoute);
        this.router.use('/api/splitwise', splitwiseRoute);
        this.router.use('/api/whatsapp', whatsappRoute);
        this.router.all("*", (req, res) => res.status(404).end());
    }

    public initialize = () => {
        this.registerMiddleWares();
        this.registerStaticServer();
        this.registerRoutes();
        this.router.listen(this.port, this.address, () => this.logger.success(`Unity server is live on ${this.port}! 🎉`, style.bold));
    }
}

export const httpServer = new ExpressServer();