import express from 'express';
import { replyError, replySuccess } from '../common/utils';
import { validator } from '../common/validation';
import { mandiProxy } from '../operations/mandiproxy';

const router = express.Router();

router.post('/init', (request, response) => {
    validator.validateRequest(request)
        .then(body => mandiProxy.init(body))
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/status', (request, response) => {
    mandiProxy.getStatus()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/logout', (request, response) => {
    mandiProxy.logout()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/gatepasses', (request, response) => {
    mandiProxy.getGatepasses(request.query, request.method, request.headers, request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;
