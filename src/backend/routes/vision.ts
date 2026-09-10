import express from 'express';
import { replyError, replySuccess } from '../common/utils';
import { vision } from '../operations/vision';

const router = express.Router();

router.post('/captcha', (request, response) => {
    vision.resolveCaptcha(request.body.base64string)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;
