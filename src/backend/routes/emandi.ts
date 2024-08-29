import express from 'express';
import { constants, source } from '../common/constants';
import { eMandi } from '../operations/emandi';
import { Logger } from '../common/models';
import { replyError, replySuccess } from '../common/utils';
import { validator } from '../common/validation';

const router = express.Router();
const logger = new Logger(source.route);

router.get("/", async (request, response) => {
    logger.info(constants.message.ping);
    eMandi.validateInstance()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/init", (request, response) => {
    eMandi.initializeDatabase()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/peek", (request, response) => {
    eMandi.peekRecord()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/pop", (request, response) => {
    eMandi.popRecord()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/queued", (request, response) => {
    eMandi.getQueued()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/processed", (request, response) => {
    eMandi.getProcessed()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/parties", (request, response) => {
    eMandi.getParties()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/requeue/:id", (request, response) => {
    eMandi.requeueRecord(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post("/push", (request, response) => {
    validator.validateRequest(request)
        .then(values => eMandi.queueRecord(values)
            .then(replySuccess(response)))
        .catch(replyError(response))
});

router.post("/parties", (request, response) => {
    validator.validateRequest(request)
        .then(values => eMandi.addParty(values)
            .then(replySuccess(response)))
        .catch(replyError(response))
});

router.patch("/parties", (request, response) => {
    eMandi.updateParty(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.patch("/entry", (request, response) => {
    validator.validateRequest(request)
        .then(values =>
            eMandi.updateRecordAtHead(values)
                .then(replySuccess(response)))
        .catch(replyError(response));
});

router.delete("/entry/:id", (request, response) => {
    eMandi.deleteRecord(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.delete("/parties/:id", (request, response) => {
    eMandi.deleteParty(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;
