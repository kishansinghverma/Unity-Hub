import express from 'express';
import { documents } from '../operations/documents';
import { replyError } from '../common/utils';

const router = express.Router();

router.post('/gatepasses', (request, response) => {
    documents.createGatepass(request.body)
        .then(result => {
            if (result.statusCode === 200) {
                response.type('application/pdf');
                response.attachment(result.content.fileName);
                return response.send(result.content.pdf);
            }
            return response.status(result.statusCode).json(result.content ?? {});
        })
        .catch(replyError(response));
});

router.post('/niners', (request, response) => {
    documents.createNiner(request.body)
        .then(result => {
            if (result.statusCode === 200) {
                response.type('application/pdf');
                response.attachment(result.content.fileName);
                return response.send(result.content.pdf);
            }
            return response.status(result.statusCode).json(result.content ?? {});
        })
        .catch(replyError(response));
});

export default router;
