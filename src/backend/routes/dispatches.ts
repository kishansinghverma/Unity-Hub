import express from 'express';
import { dispatches } from '../operations/dispatches';
import { replyError, replySuccess } from '../common/utils';

const router = express.Router();

router.get('/status', (request, response) => {
    dispatches.validateInstance()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/queued', (request, response) => {
    dispatches.getQueuedDispatches()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/processed', (request, response) => {
    dispatches.getProcessedDispatches()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/peek', (request, response) => {
    dispatches.peekDispatch()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/pop', (request, response) => {
    dispatches.popDispatch()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/push', (request, response) => {
    dispatches.queueDispatch(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.patch('/finalize', (request, response) => {
    dispatches.finalize(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/requeue/:id', (request, response) => {
    dispatches.requeueDispatch(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.delete('/:id', (request, response) => {
    dispatches.deleteQueuedDispatch(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/parties', (request, response) => {
    dispatches.getParties()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/parties', (request, response) => {
    dispatches.addParty(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.patch('/parties/:id', (request, response) => {
    dispatches.updateParty(request.params.id, request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.delete('/parties/:id', (request, response) => {
    dispatches.deleteParty(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;
