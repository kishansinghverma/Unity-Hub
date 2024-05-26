import express from 'express';
import { expenses } from '../operations/expense';
import { replyError, replySuccess } from '../common/utils';

const router = express.Router();

router.get('/', (request, response) => {
    expenses.getTransactions()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/', (request, response) => {
    expenses.addTransaction(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.delete('/:id', (request, response) => {
    expenses.deleteTransaction(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;