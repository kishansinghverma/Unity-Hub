import express from 'express';
import { documents } from '../operations/documents';
import { replyError, replySuccess } from '../common/utils';

const router = express.Router();

router.post('/gatepasses', (request, response) => {
    documents.createGatepass(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post('/niners', (request, response) => {
    documents.createNiner(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;
