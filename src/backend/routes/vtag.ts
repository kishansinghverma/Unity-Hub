import express from "express";
import { replyError, replySuccess } from "../common/utils";
import { vtag } from "../operations/vtag";

const router = express.Router();

router.get("/vehicles/types", (request, response) => {
    vtag.getVehicleTypes()
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/vehicles/:gatepassId", (request, response) => {
    vtag.getVehicle(request.params.gatepassId)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.get("/entries", (request, response) => {
    vtag.getTaggingData(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

router.post("/entries", (request, response) => {
    vtag.insertTaggingData(request.body)
        .then(replySuccess(response))
        .catch(replyError(response));
});

export default router;
