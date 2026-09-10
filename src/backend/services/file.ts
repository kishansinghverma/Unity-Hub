import ejs from "ejs";
import crypto from "crypto";
import fs from "fs";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { chromium, Browser } from "playwright-chromium";
import { constants, source } from "../common/constants";
import { Logger, MulterThrowable, String } from "../common/models";
import { Request, Response } from "express";
import { EMandiGatepass, EMandiNiner, HtmlDocumentData, OperationResponse } from "../common/types";

class Files {
    private logger: Logger;

    constructor() {
        this.logger = new Logger(source.file);
    }

    private browserInstance: Browser | null = null;
    private browserInitPromise: Promise<void> | null = null;

    private initializeBrowser = async () => {
        if (this.browserInstance) return;

        this.browserInitPromise ??= chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--disable-accelerated-2d-canvas',
                '--disable-extensions',
                '--disable-background-networking'
            ]
        }).then(browser => {
            this.browserInstance = browser;
            this.logger.success("Chromium instance created succesfully.");
        }).catch(err => {
            this.browserInitPromise = null;
            throw err;
        });

        await this.browserInitPromise;
    };

    private storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, '../static')),
        filename: (req, file, cb) => cb(null, `${String.generateId()}${path.extname(file.originalname).toLowerCase()}`),
    });

    private fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        const allowedExtensions = ['.pdf'];
        if (allowedExtensions.includes(path.extname(file.originalname).toLowerCase())) return cb(null, true);
        else return cb(new MulterThrowable(constants.errors.fileTypeMismatch));
    };

    public fileUpload = multer({ storage: this.storage, fileFilter: this.fileFilter });

    public saveIncomingFile = (request: Request, response: Response): OperationResponse => {
        const executeUpload = fileService.fileUpload.single('file');
        return new Promise((resolve, reject) => {
            executeUpload(request, response, (err) => {
                if (err) reject(err);
                else if (!request.file) reject(new MulterThrowable(constants.errors.fileExpected));
                else resolve({ content: request.file.filename, statusCode: 201 });
            });
        })
    };

    private renderTemplate = (templateName: string, data: object) => {
        const templatePath = path.join(__dirname, '../assets', templateName);
        const pdfContents = { data: { ...data, logo: String.getBase64Png('logo_emandi.png') } };
        return new Promise<string>((resolve, reject) => {
            ejs.renderFile(templatePath, pdfContents, (err, data) => {
                if (err) reject(err);
                else resolve(data)
            });
        });
    };

    public generateNinerPdfFromHtml = async (content: HtmlDocumentData) => {
        const htmlContent = await this.renderTemplate('template_niner_html.ejs', content);
        return this.generatePdfDocument(htmlContent);
    };

    public generateGatepassPdfFromHtml = async (content: HtmlDocumentData) => {
        const htmlContent = await this.renderTemplate('template_gatepass_html.ejs', content);
        return this.generatePdfDocument(htmlContent);
    };

    public generateNinerPdfFromJson = async (content: EMandiNiner & { qr: string }) => {
        const htmlContent = await this.renderTemplate('template_niner_json.ejs', content);
        return this.generatePdfDocument(htmlContent);
    };

    public generateGatepassPdfFromJson = async (content: EMandiGatepass & { qr: string }) => {
        const htmlContent = await this.renderTemplate('template_gatepass_json.ejs', content);
        return this.generatePdfDocument(htmlContent);
    };

    private generatePdfDocument = async (htmlContent: string) => {
        const docPrefix = 2;
        const hashId = crypto.randomBytes(16).toString("hex");
        const fileName = `${docPrefix}${hashId}.pdf`;
        const dirPath = path.join(__dirname, '../static');
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
        const filePath = `${dirPath}/${fileName}`;

        await this.initializeBrowser();
        const context = await this.browserInstance!.newContext();
        const page = await context.newPage();

        try {
            await page.setContent(htmlContent);
            const pdfContent = await page.pdf({ format: 'A4', landscape: true });
            fs.writeFileSync(filePath, pdfContent);
            return fileName;
        } finally {
            await context.close();
        }
    }

    public readPdf = (fileName: string) => fs.readFileSync(path.join(__dirname, '../static', fileName));
}

export const fileService = new Files();
