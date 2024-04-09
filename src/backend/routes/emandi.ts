import express from 'express';
import { constants, source, style } from '../common/constants';
import * as emandiOperation from '../operations/emandi';
import path from 'path';
import { Logger } from '../common/models';
import { whatsApp } from '../operations/whatsapp';

const router = express.Router();
const logger = new Logger(source.route);

router.use("/", express.static(path.resolve('dist/frontends/emandi')));

router.get("/api", async (req, res) => {
    logger.info(constants.message.serviceOk, style.bold);
    emandiOperation.validateInstance()
        .then(response => res.status(response.statusCode).json(response.content))
        .catch(err => res.status(500).send(err.message));
});

router.get("/api/init", (req, res) => {
    emandiOperation.initializeDatabase()
        .then(() => res.status(200).send(constants.message.initializeDb))
        .catch(err => res.status(500).send(err.message));
});

router.get("/api/peek", (req, res) => {
    emandiOperation.peekRecord()
        .then(response => res.status(response.statusCode).send(response.content))
        .catch(err => res.status(500).send(err.message))
});

router.get("/api/pop", (req, res) => {
    emandiOperation.popRecord()
        .then(response => res.status(response.statusCode).send(response.content))
        .catch(err => res.status(500).send(err.message));
});

router.get("/api/queued", (req, res) => {
    emandiOperation.getQueued()
        .then(response => res.status(response.statusCode).json(response.content))
        .catch(err => res.status(500).send(err.message));
});

router.get("/api/processed", (req, res) => {
    emandiOperation.getProcessed()
        .then(response => res.status(response.statusCode).json(response.content))
        .catch(err => res.status(500).send(err.message));
});

router.get("/api/parties", (req, res) => {
    emandiOperation.getParties()
        .then(response => res.status(response.statusCode).json(response.content))
        .catch(err => res.status(500).send(err.message));
});

router.get("/api/requeue/:id", (req, res) => {
    emandiOperation.requeueRecord(req.params.id)
        .then(response => res.status(response.statusCode).json(response.content))
        .catch(err => res.status(500).send(err.message));
});

router.post("/api/push", (req, res) => {
    if (Object.keys(req.body).length > 0) {
        emandiOperation.queueRecord(req.body)
            .then(async response => {
                const { name, mandi, state } = req.body.party;
                await whatsApp.sendMessageToUnityHub(`New Gatepass Requested For ${name}, ${mandi}, ${state}. Click To Proceed : https://emandi.up.gov.in/Traders/Dashboard`);
                return response;
            })
            .then(response => res.status(response.statusCode).send(response.content))
            .catch(err => res.status(500).send(err.message));
    }
    else
        res.status(400).send(constants.errors.missingParams);
});

router.post("/api/parties", (req, res) => {
    if (Object.keys(req.body).length > 0) {
        emandiOperation.addParty(req.body)
            .then(response => res.status(response.statusCode).send(response.content))
            .catch(err => res.status(500).send(err.message));
    }
    else
        res.status(400).send(constants.errors.missingParams);
});

router.patch("/api/parties", (req, res) => {
    emandiOperation.updateParty(req.body)
        .then(response => res.status(response.statusCode).send(response.content))
        .catch(err => res.status(500).send(err.message));
});

router.patch("/api/entry", (req, res) => {
    if (Object.keys(req.body).length > 0 && req.body.rate && !isNaN(req.body.rate)) {
        emandiOperation.updateRecordAtHead(req.body)
            .then(response => res.status(response.statusCode).send(response.content))
            .catch(err => res.status(500).send(err.message));
    }
    else
        res.status(400).send(constants.errors.missingParams);
});

router.delete("/api/entry/:id", (req, res) => {
    emandiOperation.deleteRecord(req.params.id)
        .then(response => res.status(response.statusCode).send(response.content))
        .catch(err => res.status(500).send(err.message));
});

router.delete("/api/parties/:id", (req, res) => {
    emandiOperation.deleteParty(req.params.id)
        .then(response => res.status(response.statusCode).send(response.content))
        .catch(err => res.status(500).send(err.send));
});

export default router;
