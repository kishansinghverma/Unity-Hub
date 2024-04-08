import express from 'express';
import path from 'path';
import { generateId, replyError, replySuccess } from '../common/utils';
import { files } from '../operations/files';

const router = express.Router();

router.use("/", express.static(path.join(__dirname, '../static')));

router.post("/", (request, response) => {
    files.saveIncomingFile(request, response)
        .then(replySuccess(response))
        .catch(replyError(response));
})

router.post("/printable", (request, response) => {
    console.log('Working...');
    response.end();
});

export default router;