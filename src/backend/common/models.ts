import chalk from "chalk";
import fs from "fs";
import path from "path";
import { source } from "./constants";
import { MulterError } from "multer";
import { ObjectId } from "mongodb";

export class String {
    public static empty = '';

    public static isNullOrEmpty = (chars: string) => (chars === null || chars.trim() === '');

    public static getEpoch = () => new Date().getTime();

    public static mongoId = (id: string) => new ObjectId(id);

    public static generateId = () => new ObjectId();

    public static getBase64Png = (assetName: string) => {
        const base64Image = fs.readFileSync(path.join(__dirname, `../assets/${assetName}`)).toString('base64');
        return `data:image/png;base64,${base64Image}`;
    }

    public static getTaggedString = (template: string, params: any) => {
        return Array.isArray(params) ?
            template.replace(/\${(\d+)}/g, (_, match) => params[parseInt(match)] ?? `\${${parseInt(match)}}`) :
            template.replace(/\${(.*?)}/g, (match, key) => params[key.trim()] || match);
    }

    public static capitalize = (str: string) => {
        if (!str) return '';
        let tokens = str.trim().split(' ');
        let capitals = tokens.map((token) => token.charAt(0).toUpperCase() + token.substring(1));
        const updatedString = capitals.join(' ');
        tokens = updatedString.split('.');
        capitals = tokens.map((token) => token.charAt(0).toUpperCase() + token.substring(1));
        return capitals.join('.');
    };
}

export class Logger {
    private source: string;

    constructor(source: source) {
        this.source = source;
    }

    private getMessage = (source: string, message: string) =>
        `[${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })} -> ${source}] ${message}`;

    public error = (message: string, source = this.source) => console.error(this.getMessage(source, message));

    public warning = (message: string, source = this.source) => console.warn(this.getMessage(source, message));

    public info = (message: string, source = this.source) => console.debug(this.getMessage(source, message));
}

export class CustomError {
    public static printException = (error: any) => {
        console.error('\n*---------* Handled Exception *---------*');
        console.log(error);
        console.error('*---------------------------------------*\n');
    }
}

export class Throwable extends Error {
    public statusCode: number;
    constructor(message: string, statusCode: number, stack?: string) {
        super();
        this.statusCode = statusCode;
        this.message = message;
        this.stack = stack;
    }
}

export class MulterThrowable extends MulterError {
    constructor(message: string) {
        super('LIMIT_UNEXPECTED_FILE');
        this.message = message;
    }
}