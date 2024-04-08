import express from 'express';
import { whatsApp } from '../operations/whatsapp';
import { validator } from '../common/validation';
import { handleJsonResponse, replySuccess, replyError } from '../common/utils';

const router = express.Router();

router.post('/sendtext/emandi', (request, response) => {
    validator.validateRequest(request)
        .then(({ message }) =>
            whatsApp.sendMessageToEmandi(message)
                .then(handleJsonResponse)
                .then(replySuccess(response))
        )
        .catch(replyError(response));
})

router.post('/sendtext/unityhub', (request, response) => {
    validator.validateRequest(request)
        .then(({ message }) =>
            whatsApp.sendMessageToUnityHub(message)
                .then(handleJsonResponse)
                .then(replySuccess(response))
        )
        .catch(replyError(response));
})

export default router;