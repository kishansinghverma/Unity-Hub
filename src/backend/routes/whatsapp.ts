import express from 'express';
import { whatsApp } from '../operations/whatsapp';
import { validator } from '../common/validation';
import { replySuccess, replyError } from '../common/utils';
import { Logger } from '../common/models';
import { source } from '../common/constants';

const router = express.Router();
const logger = new Logger(source.route);

router.post('/webhook', (request, response) => {
    validator.validateRequest(request)
        .then(whatsApp.handleIncomingMessages)
        .catch(({ message }) => logger.error(`test->${message}`))
        .finally(() => response.end());
});

router.post('/sendtext/emandi', (request, response) => {
    validator.validateRequest(request)
        .then(({ message }) => whatsApp.sendMessageToEmandiGroup(message)
            .then(replySuccess(response)))
        .catch(replyError(response));
});

router.post('/sendtext/unityhub', (request, response) => {
    validator.validateRequest(request)
        .then(({ message }) => whatsApp.sendMessageToUnityGroup(message)
            .then(replySuccess(response)))
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