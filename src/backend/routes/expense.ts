import express, { response } from 'express';
import { expenses } from '../operations/expense';
import { replyError, replySuccess } from '../common/utils';
import { validator } from '../common/validation';
import { request } from 'http';

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

router.get('/descriptions', (request, response) => {
    expenses.getDescriptions()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/statement/bank', (request, response) => {
    expenses.getBankStatement()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get('/statement/phonepe', (request, response) => {
    expenses.getPhonePeStatement()
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

router.post('/statement/bank', (request, response) => {
    validator.validateRequest(request)
        .then(values => expenses.updateBankStatement(values)
            .then(replySuccess(response)))
        .catch(replyError(response));
});

router.post('/statement/phonepe', (request, response) => {
    validator.validateRequest(request)
        .then(values => expenses.updatePhonePeStatement(values)
            .then(replySuccess(response)))
        .catch(replyError(response));
});

router.post('/finalize', (request, response) => {
    expenses.finalizeTransaction(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/process/bank/:id', (request, response) => {
    expenses.processBankTransaction(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/process/phonepe/:id', (request, response) => {
    expenses.processPhonePeTransaction(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/process/draft/:id', (request, response) => {
    expenses.processDraftTransaction(request.params.id)
        .then(replySuccess(response))
        .catch(replyError(response));
});


export default router;