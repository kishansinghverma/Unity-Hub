import express from 'express';
import emandiRoute from './backend/routes/emandi';
import splitwiseRoute from './backend/routes/splitwise';
import dotenv from 'dotenv';
import { Logger } from './backend/common/models';
import { source, style } from './backend/common/constants';
import path from 'path';

dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || '8080');
const logger = new Logger(source.server);

app.use('/emandi', emandiRoute);
app.use('/splitwise', splitwiseRoute);
app.all("*", (req, res) => res.status(404).end());
app.listen(port, () => logger.success(`Unity server is live on ${port}! 🎉`, style.bold));