import express from "express";
import { replyError, replySuccess } from "../common/utils";
import { validator } from "../common/validation";
import { oakterRemote } from "../operations/oakterremote";

const router = express.Router();

router.get("/isconnected", (request, response) => {
    oakterRemote.isConnected()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/devices", (request, response) => {
    oakterRemote.getDevices()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post("/command", (request, response) => {
    validator.validateRequest(request)
        .then(({ commandId, remoteId }) => oakterRemote.issueCommand(commandId, remoteId)
            .then(replySuccess(response)))
        .catch(replyError(response));
});

export default router;
