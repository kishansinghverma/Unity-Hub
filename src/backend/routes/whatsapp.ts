import express from 'express';
import { whatsApp } from '../operations/whatsapp';
import { replySuccess, replyError } from '../common/utils';
import { Logger } from '../common/models';
import { source } from '../common/constants';

const router = express.Router();
const logger = new Logger(source.route);

router.post('/webhook', (request, response) => {
    whatsApp.handleIncomingMessages(request.body)
        .catch(({ message }) => logger.error(message))
        .finally(() => response.end());
});

router.post('/sendtext/emandi', (request, response) => {
    whatsApp.sendMessageToEmandiGroup(request.body.message)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/sendtext/unityhub', (request, response) => {
    whatsApp.sendMessageToUnityGroup(request.body.message)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/sharetext/unityhub/:number', (request, response) => {
    whatsApp.shareMessageViaUnityGroup(request.params.number, request.body.message)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/sharefile/unityhub/:number', (request, response) => {
    whatsApp.shareFileViaUnityGroup(request, response)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;
