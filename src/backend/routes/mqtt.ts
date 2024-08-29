import express from 'express';
import { mqtt } from '../operations/mqtt';

const router = express.Router();

router.get('/printer/status', (request, response) => {
    mqtt.getPrinterStatus().then(console.log).then(() => response.end()).catch((err)=>response.send(err));
});

export default router;