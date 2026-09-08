import express from 'express';
import { replyError, replySuccess } from '../common/utils';
import { validator } from '../common/validation';
import { mandiProxy } from '../operations/mandiproxy';

const router = express.Router();

router.post('/init', (request, response) => {
    validator.validateRequest(request)
        .then(values => mandiProxy.initializeSession(values)
            .then(replySuccess(response)))
        .catch(replyError(response));
});

router.get('/status', (request, response) => {
    mandiProxy.getSessionStatus()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/logout', (request, response) => {
    mandiProxy.clearSession()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/gatepass', (request, response) => {
    validator.validateRequest(request, request.query)
        .then(values => mandiProxy.getGatepasses(values)
            .then(replySuccess(response)))
        .catch(replyError(response));
});

export default router;
