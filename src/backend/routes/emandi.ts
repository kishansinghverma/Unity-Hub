import express from 'express';
import { replyError, replySuccess } from '../common/utils';
import { emandi } from '../operations/emandi';

const router = express.Router();

router.get('/session', (request, response) => {
    emandi.getSessionStatus()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/init', (request, response) => {
    emandi.initialize(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/gatepasses', (request, response) => {
    emandi.getGatepasses(request.query)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/gatepasses/latest', (request, response) => {
    emandi.getLatestGatepass()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/niners', (request, response) => {
    emandi.getNiners(request.query)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/niners/latest', (request, response) => {
    emandi.getLatestNiner()
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;
