import express from 'express';
import { replyError, replySuccess } from '../common/utils';
import { splitwise } from '../operations/splitwise';

const router = express.Router();

router.get('/group/:id', (request, response) => {
    splitwise.getGroupDetails(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/groups', (request, response) => {
    splitwise.listGroups()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/transactions', (request, response) => {
    splitwise.addExpense(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/settlement', (request, response) => {
    splitwise.settleExpenses(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;