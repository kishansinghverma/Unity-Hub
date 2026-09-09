import ejs from "ejs";
import crypto from "crypto";
import fs from "fs";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import { chromium, Browser } from "playwright-chromium";
import { constants, source } from "../common/constants";
import { Logger, MulterThrowable, String } from "../common/models";
import { Request, Response } from "express";
import { CreatePdfRequest, OperationResponse } from "../common/types";

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

    private renderPdf = (content: CreatePdfRequest) => {
        const templatePath = path.join(__dirname, '../assets/template_emandi.ejs');
        const pdfContents = { data: { ...content, logo: String.getBase64Png('logo_emandi.png') } };
        return new Promise<string>((resolve, reject) => {
            ejs.renderFile(templatePath, pdfContents, (err, data) => {
                if (err) reject(err);
                else resolve(data)
            });
        });
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

    public generatePdfFromHtml = async (content: CreatePdfRequest) => {
        const docPrefix = 2;
        const hashId = crypto.randomBytes(16).toString("hex");
        const fileName = `${docPrefix}${hashId}.pdf`;
        const dirPath = path.join(__dirname, '../static');
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
        const filePath = `${dirPath}/${fileName}`;

        const htmlContent = await this.renderPdf(content);

        await this.initializeBrowser();
        const context = await this.browserInstance!.newContext();
        const page = await context.newPage();

        try {
            await page.setContent(htmlContent as string);
            const pdfContent = await page.pdf({ format: 'A4', landscape: true });
            fs.writeFileSync(filePath, pdfContent);
            return fileName;
        } finally {
            await context.close();
        }
    }

    public parseNinerReceipt = async (htmlContent: string): Promise<{ party: string, tables: string[], qr: string }> => {
        await this.initializeBrowser();
        const context = await this.browserInstance!.newContext();
        const page = await context.newPage();

        try {
            const html = /<base\b/i.test(htmlContent)
                ? htmlContent
                : htmlContent.replace(/<head\b[^>]*>/i, match => `${match}<base href="https://emandi.up.gov.in/">`);

            await page.setContent(html, { waitUntil: 'load' });
            const parsed = await page.evaluate(() => {
                const contents = document.querySelector('#content');
                const qrElement = contents && contents.querySelector('#qrcode img');
                const partyElement = document.querySelector('tbody > tr:nth-child(4) > td:nth-child(6) > label');
                const tableElements = contents ? contents.querySelectorAll('.table') : [];
                const detailTable = contents && contents.querySelector('.row .col-md-12 table');

                return {
                    party: partyElement ? (partyElement.textContent || '').trim() : '',
                    qr: qrElement ? (qrElement.getAttribute('src') || '') : '',
                    tables: [
                        tableElements[0] ? tableElements[0].outerHTML : '',
                        detailTable ? detailTable.outerHTML : '',
                    ],
                };
            });

            if (!parsed.party || !parsed.qr || parsed.tables.some(table => !table)) {
                throw new Error('Unable to parse 9R receipt.');
            }

            return {
                ...parsed,
                tables: parsed.tables.map(table => table.replace(/<i\b[^>]*\bfa-rupee\b[^>]*><\/i>/gi, '₹')),
            };
        } finally {
            await context.close();
        }
    }

    public parseGatepassReceipt = async (htmlContent: string): Promise<{ party: string, tables: string[], qr: string }> => {
        await this.initializeBrowser();
        const context = await this.browserInstance!.newContext();
        const page = await context.newPage();

        try {
            const html = /<base\b/i.test(htmlContent)
                ? htmlContent
                : htmlContent.replace(/<head\b[^>]*>/i, match => `${match}<base href="https://emandi.up.gov.in/">`);

            await page.setContent(html, { waitUntil: 'load' });
            const parsed = await page.evaluate(() => {
                const contents = document.querySelector('#content');
                const qrElement = contents && contents.querySelector('#qrcode img');
                const partyElement = document.querySelector('tbody > tr:nth-child(1) > td:nth-child(8) > label');
                const tables = contents ? contents.querySelectorAll('.table') : [];
                const detailTables = contents ? contents.querySelectorAll('.row .col-md-12 table') : [];
                const detailRow = contents && contents.querySelector('.row .col-md-12 .row');

                return {
                    party: partyElement ? (partyElement.textContent || '').trim() : '',
                    qr: qrElement ? (qrElement.getAttribute('src') || '') : '',
                    tables: [
                        tables[0] ? tables[0].outerHTML : '',
                        detailTables[0] ? detailTables[0].outerHTML : '',
                        detailTables[1] ? detailTables[1].outerHTML : '',
                        detailTables[2] ? detailTables[2].outerHTML : '',
                        detailRow ? detailRow.outerHTML : '',
                    ],
                };
            });

            if (!parsed.party || !parsed.qr || parsed.tables.slice(0, 4).some(table => !table)) {
                throw new Error('Unable to parse gatepass receipt.');
            }

            return {
                ...parsed,
                tables: parsed.tables.map(table => table.replace(/<i\b[^>]*\bfa-rupee\b[^>]*><\/i>/gi, '₹')),
            };
        } finally {
            await context.close();
        }
    }
}

export const fileService = new Files();
