import chalk from "chalk";
import { constants, style } from "./constants";

export class String {
    public static empty = '';
    public static isNullOrEmpty = (chars: string) => (chars === null || chars.trim() === '');
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

    public static getErrorResponse = (error: any): { content: any, statusCode: number } => {
        switch (error.code) {
            case 11000:
                return { content: constants.errors.duplicateRecord, statusCode: 409 };
            default:
                return { content: error.message, statusCode: 500 };
        }
    }

    public static handleErrorAndGetResponse = (error: any) => {
        this.printException(error);
        return this.getErrorResponse(error);
    }
}

export class Throwable extends Error {
    public statusCode: number;
    constructor(message: string, statusCode: number) {
        super();
        this.statusCode = statusCode;
        this.message = message;
    }
}