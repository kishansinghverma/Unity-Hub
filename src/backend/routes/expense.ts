import express from 'express';
import { expenses } from '../operations/expense';
import { replyError, replySuccess } from '../common/utils';
import { validator } from '../common/validation';

const router = express.Router();

router.get('/', (request, response) => {
    expenses.getTransactions()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/init', (request, response) => {
    expenses.initializeDatabase()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/lastrefinement', (request, response) => {
    expenses.getLastRefinementDate()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/groups/:groupId/sharedstatus', (request, response) => {
    expenses.getGroupSharing(parseInt(request.params.groupId))
        .then(replySuccess(response))
        .catch(replyError);
});

router.get('/descriptions', (request, response) => {
    expenses.getDescriptions()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/', (request, response) => {
    expenses.addTransaction(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/description', (request, response) => {
    expenses.addDescription(request.body.item)
        .then(replySuccess(response))
        .catch(replyError(response));
})

router.post('/groups', (request, response) => {
    validator.validateRequest(request)
        .then(values => expenses.updateGroupInfo(values)
            .then(replySuccess(response)))
        .catch(replyError(response));
});

router.delete('/:id', (request, response) => {
    expenses.deleteTransaction(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;