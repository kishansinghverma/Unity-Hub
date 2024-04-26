import express from 'express';
import { whatsApp } from '../operations/whatsapp';
import { validator } from '../common/validation';
import { replySuccess, replyError } from '../common/utils';
import { greenApi } from '../common/constants';

const router = express.Router();

router.post('/sendtext/emandi', (request, response) => {
    validator.validateRequest(request)
        .then(({ message }) => whatsApp.sendMessage(greenApi.groupId.emandi, message)
            .then(replySuccess(response)))
        .catch(replyError(response));
});

router.post('/sendtext/unityhub', (request, response) => {
    validator.validateRequest(request)
        .then(({ message }) => whatsApp.sendMessage(greenApi.groupId.unityHub, message)
            .then(replySuccess(response)))
        .catch(replyError(response));
});

router.post('/sharetext/emandi/:number', (request, response) => {
    whatsApp.shareMessageViaGroup(request.params.number, greenApi.groupId.emandi, request.body.message)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/sharetext/unityhub/:number', (request, response) => {
    whatsApp.shareMessageViaGroup(request.params.number, greenApi.groupId.unityHub, request.body.message)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/sharefile/emandi/:number', (request, response) => {
    // whatsApp.shareUploadedFileViaGroup(request.params.number, greenApi.groupId.emandi, request.body.message)
    //     .then(replySuccess(response))
    //     .catch(replyError(response));
})

router.post('/sharefile/unityhub/:number', (request, response) => {
    // whatsApp.shareUploadedFileViaGroup(request.params.number, greenApi.groupId.unityHub, request.body.message)
    //     .then(replySuccess(response))
    //     .catch(replyError(response));
});


export default router;