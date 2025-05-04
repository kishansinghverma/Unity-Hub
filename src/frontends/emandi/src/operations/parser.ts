import * as pdfjsLib from "pdfjs-dist";
import * as XLSX from 'xlsx';
import { BankEntry, PhonePeEntry } from "../common/types";
import { TransactionMetaData } from "../common/constants";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

const isFloat = (number: number) => Number(number) === number && number % 1 !== 0;

const getNumberAt = (sheet: XLSX.WorkSheet, cellAddress: string): number | null => {
    const data = sheet[cellAddress]?.v;
    if (data === undefined || data === null) return null;
    return isNaN(parseFloat(data)) ? null : parseFloat(data);
};

const getStringAt = (sheet: XLSX.WorkSheet, cellAddress: string): string | null => {
    const data = sheet[cellAddress]?.v;
    if (data === undefined || data === null) return null;
    return String(data).trim();
};

const parseHdfcStatement = (sheet: XLSX.WorkSheet) => {
    const transactions: Array<BankEntry> = [];
    const range = XLSX.utils.decode_range(sheet["!ref"] || "");
    if (!range) throw new Error('Empty worksheet found!');

    for (let row = range.s.r + 1; row <= range.e.r + 1; row++) {
        const cellAddress = `A${row}`;
        const txnDate = dayjs(getStringAt(sheet, cellAddress), "DD/MM/YY", true);
        if (txnDate.isValid()) {
            const date = txnDate.toDate();
            const description = getStringAt(sheet, `B${row}`) ?? '** UNIDENTIFIED **';
            const debit = getNumberAt(sheet, `E${row}`);
            const credit = getNumberAt(sheet, `F${row}`)
            const type = debit === null ? 'Credit' : 'Debit';
            const amount = credit ?? debit ?? 0;
            transactions.push({ date, description, amount, type, bank: 'HDFC' })
        }
    }

    return transactions;
}

const parseSbiStatement = (sheet: XLSX.WorkSheet) => {
    const transactions: Array<BankEntry> = [];
    const range = XLSX.utils.decode_range(sheet["!ref"] || "");
    if (!range) throw new Error('Empty worksheet found!');

    for (let row = range.s.r + 1; row <= range.e.r + 1; row++) {
        const cellAddress = `A${row}`;
        if (isFloat(getNumberAt(sheet, cellAddress) ?? 0)) {
            const parsedDate = XLSX.SSF.parse_date_code(getNumberAt(sheet, cellAddress));
            const date = new Date(parsedDate.y, parsedDate.m - 1, parsedDate.d);
            const description = getStringAt(sheet, `C${row}`) ?? '** UNIDENTIFIED **';
            const debit = getNumberAt(sheet, `E${row}`);
            const credit = getNumberAt(sheet, `F${row}`)
            const type = debit === null ? 'Credit' : 'Debit';
            const amount = credit ?? debit ?? 0;
            transactions.push({ date, description, amount, type, bank: 'SBI' })
        }
    }

    return transactions;
}

export const extractDataFromExcel = async (file: File) => {
    const reader = new FileReader();
    const binaryString = await new Promise((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result);
        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });

    const workbook = XLSX.read(binaryString, { type: "binary" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (getStringAt(sheet, 'A1')?.includes('HDFC BANK')) return parseHdfcStatement(sheet);
    else if (getStringAt(sheet, 'B8')?.includes('SBNCHQ-GEN')) return parseSbiStatement(sheet);
    else throw Error("Unsupported Excel file provided.")
}

export const parsePhonePeStatement = async (file: File) => {
    let tokens: Array<string> = [];
    const transactions: Array<PhonePeEntry> = [];
    const meta = TransactionMetaData;
    const fileBuffer = await file.arrayBuffer();
    const document = await pdfjsLib.getDocument({ data: fileBuffer }).promise;

    for (let index = 1; index <= document.numPages; index++) {
        const page = await document.getPage(index);
        const textContent = await page.getTextContent();
        tokens = [...tokens, ...textContent.items.filter((t: any) => Boolean(t.str?.trim())).map((t: any) => t.str)];
    }

    if (!tokens[0].includes('Transaction Statement'))
        throw new pdfjsLib.InvalidPDFException('Invalid PhonePe statement.');

    tokens.forEach((item, index) => {
        if (item.includes('Transaction ID')) {
            const transaction = {
                date: dayjs(`${tokens[index - 3]} - ${tokens[index - 2]}`, 'MMM DD, YYYY - hh:mm A').toDate(),
                recipient: tokens[index - 1].replace('Paid to', '').replace('Received from', '').replace('Bill paid -', '').trim(),
                transactionId: tokens[index].split(':')[1].trim(),
                utr: tokens[index + 1].split(':')[1].trim(),
                bank: meta[tokens[index + 2].trim()].Account,
                type: meta[tokens[index + 2].trim()].Type,
                amount: Boolean(tokens[index + 4].replace('INR', '').trim()) ?
                    parseFloat(tokens[index + 4].replace('INR', '').trim()) : parseFloat(tokens[index + 5].trim())
            };
            transactions.push(transaction);
        }
    });

    return transactions;
};