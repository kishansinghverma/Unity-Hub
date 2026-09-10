
import { ExecutionResponse } from "../common/types";
import { fileService } from "../services/file";
import { Request, Response } from "express";

class Files {
    public uploadFile = (request: Request, response: Response) => fileService.saveIncomingFile(request, response);

}

export const files = new Files();
