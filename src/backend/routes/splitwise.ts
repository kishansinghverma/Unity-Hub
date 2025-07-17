import express from 'express';
import { replyError, replySuccess } from '../common/utils';
import { splitwise } from '../operations/splitwise';
import { validator } from '../common/validation';

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

router.get('/categories', (request, response) => {
    splitwise.listCategories()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.patch('/groups', (request, response) => {
    validator.validateRequest(request)
        .then(values => splitwise.updateGroupInfo(values)
            .then(replySuccess(response)))
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