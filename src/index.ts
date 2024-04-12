import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import emandiRoute from './backend/routes/emandi';
import splitwiseRoute from './backend/routes/splitwise';
import whatsappRoute from './backend/routes/whatsapp';
import fileRoute from './backend/routes/files';
import { Logger } from './backend/common/models';
import { constants, source, style } from './backend/common/constants';
import { MongoDb } from './backend/services/mongodb';

dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || '8080');
const address = process.env.ADDRESS || 'localhost';
const logger = new Logger(source.server);

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use("/emandi", express.static(path.resolve('dist/frontends/emandi')));

app.get('/api/test', (request, response) => {
    const db = new MongoDb(constants.emandi.database);
    db.getDocuments(constants.emandi.collections.parties, {}, {}).then(res => response.send(res));
});

app.use('/api/emandi', emandiRoute);
app.use('/api/files', fileRoute);
app.use('/api/splitwise', splitwiseRoute);
app.use('/api/whatsapp', whatsappRoute);
app.all("*", (req, res) => res.status(404).end());
app.listen(port, address, () => logger.success(`Unity server is live on ${port}! 🎉`, style.bold));