import PDFDocument from 'pdfkit';
import { LogSource } from '../../core/logging/log-sources.js';
import type { Logger, ScopedLogger } from '../../core/logging/logger.js';
import type { Cell, TextOptions } from '../emandi/emandi.types.js';
import type { NinerPayload } from './file.types.js';

export class NinerRenderer {
  private readonly margin = 36;
  private readonly padding = 4;
  private readonly logoPath = new URL('../../assets/logo_emandi.png', import.meta.url);
  private readonly regularFontPath = new URL('../../assets/anek-deva-regular.ttf', import.meta.url);
  private readonly boldFontPath = new URL('../../assets/anek-deva-bold.ttf', import.meta.url);
  private readonly logger: ScopedLogger;

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger.for(LogSource.File);
  }

  generate = async (payload: NinerPayload): Promise<Buffer> => this.generatePdf((document) => this.render(document, payload));

  render = (document: PDFKit.PDFDocument, payload: NinerPayload): void => {
    const left = this.margin;
    const width = document.page.width - this.margin * 2;
    document.rect(6, 6, document.page.width - 12, document.page.height - 12).lineWidth(0.6).strokeColor('#000').stroke();
    const imageSize = 90;
    let y = this.drawHeader(document, payload, left, width, imageSize);
    const columns = this.scale([12, 12, 19, 19, 19, 19], width);
    const infoRows: Cell[][] = [
      [this.label('पुस्तक संख्या'), this.value(payload.book_number), this.label('क्रम संख्या'), this.value(payload.serial_number), this.label('विक्रय/ नीलाम का दिनांक एवं समय'), this.value(payload.dateofissue)],
      [this.label('मंडी'), this.value(payload.mandi_name), { ...this.label('मंडी क्षेत्र में प्रधान स्थल/ उप मंडी स्थल/ विक्रय स्थल का नाम'), span: 2 }, { ...this.value(payload.trade_mandi), span: 2 }],
      [this.label('आढ़तिया / व्यापारी का लाइसेंस संख्या'), this.value(payload.trader_license_number), this.label('आढ़तिया / व्यापारी फर्म का नाम व जिला'), this.value(payload.vikreta_details), this.label('आढ़तिया / व्यापारी का नाम'), this.value(payload.trader_name)],
      [this.label('क्रेता फर्म का राज्य'), this.value(payload.buyer_state), this.label('क्रेता का लाइसेंस संख्या'), this.value(payload.buyer_license_no), this.label('क्रेता फर्म का नाम व जिला'), this.value(payload.kreta_details)],
      [this.label('वाहन'), this.value(payload.vehicleName), this.label('वाहन संख्या'), this.value(payload.vehicle_no), this.label(''), this.value('')]
    ];
    y = this.drawRows(document, infoRows, left, y, columns) + 10;

    const itemColumns = this.scale([70, 70, 80, 70, 100, 150, 90, 140], width);
    y += this.drawRow(document, [
      this.header('कृषि उत्पादन का नाम'), this.header('किस्म'), this.header('तौल / मात्रा / माप', '(कुंतल में)'), this.header('दर', '(प्रति कुंतल)'),
      this.header('विक्रेता को भुगतान की गयी शुद्ध धनराशि', '₹'), this.header('व्यापारिक परिव्यय', '₹'), this.header('कुल धनराशि', '₹'), this.header('अभियुक्ति')
    ], left, y, itemColumns);
    y += this.drawRow(document, [
      this.center(payload.crop_name_hi || payload.crop_code), this.center(payload.crop_type), this.center(payload.crop_weight), this.center(payload.crop_rate),
      this.center(payload.crop_amount), { parts: [this.fees(payload), `कुल व्यापारिक परिव्यय: ${payload.total_tax}`] }, this.center(payload.total_amount), this.center(payload.six_r_id)
    ], left, y, itemColumns);
    y += 14;
    document.font('AnekDevanagariRegular').fontSize(8.5).fillColor('#000');
    const footerLabel = 'व्यापारी का पूरा नाम:  ';
    const footerLabelWidth = document.widthOfString(footerLabel);
    this.drawText(document, footerLabel, left, y, { width: width / 2, align: 'left' }, false);
    this.drawText(document, payload.trader_name, left + footerLabelWidth, y, { width: width / 2 - footerLabelWidth, align: 'left' }, true);
    document.font('AnekDevanagariRegular').text('व्यापारी का हस्ताक्षर', left + width / 2, y, { width: width / 2, align: 'right' });
    this.drawContentBorder(document, y + 18);
  };

  private drawHeader = (document: PDFKit.PDFDocument, payload: NinerPayload, left: number, width: number, imageSize: number): number => {
    const textX = left + imageSize + 10;
    const textWidth = width - 2 * (imageSize + 10);
    document.image(this.logoPath.pathname, left, left, { fit: [imageSize, imageSize] });
    document.image(this.decodeDataUrl(payload.qr), left + width - imageSize, left, { fit: [imageSize, imageSize] });
    const heading = 'कृषि उत्पादन मंडी समिति ';
    document.font('AnekDevanagariRegular').fontSize(9);
    const headingWidth = document.widthOfString(heading);
    document.font('AnekDevanagariBold').fontSize(9);
    const mandiWidth = document.widthOfString(payload.mandi_name);
    const headingX = textX + (textWidth - headingWidth - mandiWidth) / 2;
    document.font('AnekDevanagariRegular').fontSize(9).text(heading, headingX, left, { lineBreak: false });
    document.font('AnekDevanagariBold').fontSize(9).text(payload.mandi_name, headingX + headingWidth, left, { lineBreak: false });
    document.font('AnekDevanagariRegular').fontSize(9).text('(प्रपत्र-9)', textX, left + 16, { width: textWidth, align: 'center' });
    document.font('AnekDevanagariRegular').fontSize(9).text('[ नियम 76(12) देखिये ]', textX, left + 31, { width: textWidth, align: 'center' });
    document.font('AnekDevanagariRegular').fontSize(9).text('आढ़तिया / थोक व्यापारी का बिल', textX, left + 46, { width: textWidth, align: 'center' });
    document.font('AnekDevanagariRegular').fontSize(9).text('(केवल विक्रय के प्रथम सौदे के लिए)', textX, left + 62, { width: textWidth, align: 'center' });
    document.font('AnekDevanagariBold').fontSize(9).text('मण्डी समिति(जहाँ विक्रय सौदा हुआ है) प्रति', textX, left + 78, { width: textWidth, align: 'center' });
    return Math.max(left + imageSize, left + 90) + 10;
  };

  private drawRows = (document: PDFKit.PDFDocument, rows: Cell[][], x: number, y: number, widths: number[]): number => rows.reduce((nextY, row) => nextY + this.drawRow(document, row, x, nextY, widths), y);

  private drawRow = (document: PDFKit.PDFDocument, cells: Cell[], x: number, y: number, widths: number[]): number => {
    let column = 0;
    const laidOut = cells.map((cell) => {
      const span = cell.span || 1;
      const width = widths.slice(column, column + span).reduce((sum, value) => sum + value, 0);
      const result = { cell, x: x + widths.slice(0, column).reduce((sum, value) => sum + value, 0), width };
      column += span;
      return result;
    });
    const height = Math.max(...laidOut.map(({ cell, width }) => this.cellHeight(document, cell, width)));
    laidOut.forEach(({ cell, x: cellX, width }) => this.drawCell(document, cell, cellX, y, width, height));
    return height;
  };

  private drawCell = (document: PDFKit.PDFDocument, cell: Cell, x: number, y: number, width: number, height: number): void => {
    if (cell.fill) document.save().rect(x, y, width, height).fill(cell.fill).restore();
    document.rect(x, y, width, height).lineWidth(0.6).strokeColor('#ccc').stroke();
    document.fillColor('#000').font(cell.bold ? 'AnekDevanagariBold' : 'AnekDevanagariRegular').fontSize(cell.size || 8.5);
    const options = { width: width - 2 * this.padding, align: cell.align || 'left' as const };
    if (!cell.parts) return void this.drawText(document, cell.text || '', x + this.padding, y + this.padding, options, cell.bold || false);
    const parts = cell.parts;
    let textY = y + this.padding;
    parts.forEach((part, index) => {
      if (index) {
        textY += 2;
        document.moveTo(x + this.padding, textY).lineTo(x + width - this.padding, textY).lineWidth(0.5).stroke();
        textY += 4;
      }
      this.drawText(document, part, x + this.padding, textY, options, cell.bold || index === parts.length - 1);
      textY += document.heightOfString(part, options);
    });
  };

  private drawText = (document: PDFKit.PDFDocument, text: string, x: number, y: number, options: TextOptions, bold: boolean): void => {
    document.font(bold ? 'AnekDevanagariBold' : 'AnekDevanagariRegular').text(text, x, y, options);
  };

  private cellHeight = (document: PDFKit.PDFDocument, cell: Cell, width: number): number => {
    document.font(cell.bold ? 'AnekDevanagariBold' : 'AnekDevanagariRegular').fontSize(cell.size || 8.5);
    const options = { width: width - 2 * this.padding, align: cell.align || 'left' as const };
    return (cell.parts || [cell.text || '']).reduce((height, part) => height + document.heightOfString(part, options), 2 * this.padding + (cell.parts ? 6 * (cell.parts.length - 1) : 0));
  };

  private label = (text: string): Cell => ({ text, align: 'left' });
  private value = (text: string | undefined): Cell => ({ text: text || '', bold: true, align: 'left' });
  private header = (first: string, second?: string): Cell => ({ text: second ? `${first}\n${second}` : first, bold: true, align: 'center', fill: '#fafafa', size: 8.5 });
  private center = (text: string | undefined): Cell => ({ text: text || '', bold: true, align: 'center' });
  private scale = (values: number[], width: number): number[] => { const factor = width / values.reduce((sum, value) => sum + value, 0); return values.map((value) => value * factor); };
  private fees = (payload: NinerPayload): string => [['मंडी शुल्क 1 %', payload.mandi_fee || 'NA'], ['विकास सेस 0.5 %', payload.dev_fee || 'NA'], ['तौलाई 0', payload.weighing_fee || '0'], ['दलाली 0 %', payload.commission_fee || '0'], ['पल्लेदारी 0', payload.porter_fee || '0'], ['टैक्स 0 %', payload.tax || '0'], ['आढ़त 0 %', payload.agent_fee || '0'], ['अन्य व्यय 0 %', payload.other_fee || '0']].map(([label, value]) => `${label}: ${value}`).join('\n');
  private decodeDataUrl = (value: string): Buffer => Buffer.from(value.split(',')[1] || value, 'base64');
  private drawContentBorder = (document: PDFKit.PDFDocument, bottom: number): void => { document.rect(12, 12, document.page.width - 24, bottom - 12).lineWidth(0.6).strokeColor('#ff0000').stroke(); };

  private generatePdf = async (draw: (document: PDFKit.PDFDocument) => void): Promise<Buffer> => {
    this.logger.info('Rendering Niner Pdf...');
    const document = new PDFDocument({ size: 'A4', layout: 'landscape', margin: this.margin });
    document.registerFont('AnekDevanagariRegular', this.regularFontPath.pathname);
    document.registerFont('AnekDevanagariBold', this.boldFontPath.pathname);
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    const completed = new Promise<Buffer>((resolve, reject) => { document.on('end', () => resolve(Buffer.concat(chunks))); document.on('error', reject); });
    draw(document);
    document.addPage();
    draw(document);
    document.end();
    return completed;
  };
}
