import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import emandiRoute from './backend/routes/emandi';
import splitwiseRoute from './backend/routes/splitwise';
import whatsappRoute from './backend/routes/whatsapp';
import fileRoute from './backend/routes/files';
import { Logger } from './backend/common/models';
import { source, style } from './backend/common/constants';

dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || '8080');
const address = process.env.ADDRESS || 'localhost';
const logger = new Logger(source.server);

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/emandi', emandiRoute);
app.use('/files', fileRoute);
app.use('/splitwise', splitwiseRoute);
app.use('/whatsapp', whatsappRoute);
app.all("*", (req, res) => res.status(404).end());
app.listen(port, address, () => logger.success(`Unity server is live on ${port}! 🎉`, style.bold));