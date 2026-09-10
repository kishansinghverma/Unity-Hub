import express from "express";
import { replyError, replySuccess } from "../common/utils";
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

router.post("/syncdevices", (request, response) => {
    oakterRemote.syncDevices()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post("/command", (request, response) => {
    oakterRemote.issueCommand(request.body.commandId, request.body.remoteId)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;
