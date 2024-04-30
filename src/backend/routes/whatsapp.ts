import express from 'express';
import { whatsApp } from '../operations/whatsapp';
import { validator } from '../common/validation';
import { replySuccess, replyError } from '../common/utils';

const router = express.Router();

router.post('/webhook', (request, response) => {
    validator.validateRequest(request)
        .then(values => whatsApp.handleIncomingMessages(values))
        .catch().finally(() => response.end());
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