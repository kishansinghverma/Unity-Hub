import chalk from "chalk";
import fs from "fs";
import path from "path";
import { style } from "./constants";
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

    constructor(source: string) {
        this.source = source;
    }

    private writeLog = (source: string, message: string, color: string, loggingStyle?: style) => {
        const header = `[${chalk.bold(source)} ${new Date().toLocaleTimeString()}]`;
        console.log(chalk.hex('#fff')(header), chalk.hex(color)[loggingStyle ?? style.none](message));
    }

    public success = (message: string, loggingStyle?: style, source = this.source) => this.writeLog(source, message, '#66bb6a', loggingStyle);

    public error = (message: string, loggingStyle?: style, source = this.source) => this.writeLog(source, message, '#f44336', loggingStyle);

    public warning = (message: string, loggingStyle?: style, source = this.source) => this.writeLog(source, message, '#ffa726', loggingStyle);

    public info = (message: string, loggingStyle?: style, source = this.source) => this.writeLog(source, message, '#29b6f6', loggingStyle);
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