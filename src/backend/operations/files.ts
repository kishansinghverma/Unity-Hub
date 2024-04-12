import multer, { FileFilterCallback } from "multer";
import path from "path";
import { generateId } from "../common/utils";
import { Request, Response } from "express";
import { MulterThrowable } from "../common/models";
import { constants } from "../common/constants";
import { OperationResponse } from "../common/types";

class Files {
    private storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, '../static')),
        filename: (req, file, cb) => cb(null, `${generateId()}${path.extname(file.originalname).toLowerCase()}`),
    });
    
    private fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const allowedExtensions = ['.pdf'];
        if (allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
        else return cb(new MulterThrowable(constants.errors.fileTypeMismatch));
    };
    
    private fileUpload = multer({ storage: this.storage, fileFilter: this.fileFilter });
    
    public saveIncomingFile = (request: Request, response: Response): OperationResponse => {
        const executeUpload = this.fileUpload.single('file');
        return new Promise((resolve, reject) => {
            executeUpload(request, response, (err) => {
                if (err) reject(err);
                else if (!request.file) reject(new MulterThrowable(constants.errors.fileExpected));
                else resolve({ content: request.file.filename, statusCode: 201 });
            });
        })
    }
}

export const files = new Files();