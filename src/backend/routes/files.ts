import express from 'express';
import path from 'path';
import { replyError, replySuccess } from '../common/utils';
import { files } from '../operations/files';
import { validator } from '../common/validation';

const router = express.Router();

router.use("/", express.static(path.join(__dirname, '../static')));

router.post("/", (request, response) => {
    files.uploadFile(request, response)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post("/html", (request, response) => {
    validator.validateRequest(request)
        .then((data) => files.createAndSharePdf(data)
            .then(res => res.statusCode === 200 ? response.redirect(`/api/files/pdf/${res.content}`) : replySuccess(response)(res)))
        .catch(replyError(response));
});

router.post("/printable", (request, response) => {
    console.log('Working...');
    response.end();
});

export default router;