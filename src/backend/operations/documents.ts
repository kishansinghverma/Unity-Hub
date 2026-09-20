import { greenApi } from "../common/constants";
import { Throwable, ValidationError } from "../common/models";
import { EMandiGatepass, EMandiNiner, ExecutionResponse, GatepassDocumentRequest, NinerDocumentRequest } from "../common/types";
import { CreateDocumentResponse, DocumentActionResponse } from "../common/types/inbound/response/Documents";
import { getGatepassQrData, getNinerQrData } from "../common/utils";
import { fileService } from "../services/file";
import { mqttService } from "../services/mqtt";
import { whatsAppService } from "../services/whatsapp";
import { emandi } from "./emandi";
import { vision } from "./vision";

class Documents {
    public createGatepass = async (request: GatepassDocumentRequest): Promise<ExecutionResponse> => {
        const document = request.source.type === "html"
            ? await this.createGatepassFromHtml(request.source)
            : await this.createGatepassFromJson(request);

        return this.completeDocumentRequest(request, document, "Gatepass");
    };

    public createNiner = async (request: NinerDocumentRequest): Promise<ExecutionResponse> => {
        const document = request.source.type === "html"
            ? await this.createNinerFromHtml(request.source)
            : await this.createNinerFromJson(request);

        return this.completeDocumentRequest(request, document, "Niner");
    };

    private createGatepassFromHtml = async (source: Extract<GatepassDocumentRequest["source"], { type: "html" }>) => ({
        fileName: await fileService.generateGatepassPdfFromHtml({ tables: source.tables, qr: source.qr }),
        party: source.party
    });

    private createNinerFromHtml = async (source: Extract<NinerDocumentRequest["source"], { type: "html" }>) => ({
        fileName: await fileService.generateNinerPdfFromHtml({ tables: source.tables, qr: source.qr }),
        party: source.party
    });

    private createGatepassFromJson = async (request: Exclude<GatepassDocumentRequest, { source: { type: "html" } }>) => {
        const gatepass = await this.resolveGatepass(request);
        const qr = await vision.generateQR(getGatepassQrData({
            serialNumber: gatepass.serial_number,
            issueFrom: gatepass.trader_name,
            crop: gatepass.crop_name,
            weight: gatepass.crop_weight,
            vehicleNumber: gatepass.vehicle_no,
            applicationNumber: gatepass.id,
            issueDate: gatepass.dateofissue,
            issueTime: gatepass.timeofissue
        }), 14, 1620);

        return {
            fileName: await fileService.generateGatepassPdfFromJson({ ...gatepass, qr }),
            party: gatepass.kreta_mandi
        };
    };

    private createNinerFromJson = async (request: Exclude<NinerDocumentRequest, { source: { type: "html" } }>) => {
        const niner = await this.resolveNiner(request);
        const qr = await vision.generateQR(getNinerQrData({
            serialNumber: niner.serial_number,
            mandi: niner.mandi_name_eng,
            crop: niner.crop_name_eng
        }), 8, 1140);

        return {
            fileName: await fileService.generateNinerPdfFromJson({ ...niner, qr }),
            party: niner.kreta_details
        };
    };

    private completeDocumentRequest = async (request: { download: boolean; print: boolean; share: boolean }, document: { fileName: string; party: string }, documentType: "Gatepass" | "Niner"): Promise<ExecutionResponse> => {
        const print = await this.performAction(request.print, () => mqttService.publishPrinterAction("print", document.fileName));

        const share = await this.performAction(request.share, async () => {
            await whatsAppService.sendLocalFile(greenApi.groupId.emandi, document.fileName, `*${documentType}:* ${document.party}`);
        });

        const download: DocumentActionResponse = request.download ? { status: "success" } : { status: "not_requested" };
        const downloadLink = request.download ? { downloadUrl: `/api/files/${document.fileName}` } : {};

        const response: CreateDocumentResponse = {
            fileName: document.fileName,
            print, share, download,
            ...downloadLink
        };

        const hasFailure = [print, share, download].some(action => action.status === "failed");
        return { content: response, statusCode: hasFailure ? 207 : 200 };
    };

    private performAction = async (requested: boolean, action: () => void | Promise<void>): Promise<DocumentActionResponse> => {
        if (!requested) return { status: "not_requested" };

        try {
            await action();
            return { status: "success" };
        } catch (error) {
            return {
                status: "failed",
                error: error instanceof Error ? error.message : String(error)
            };
        }
    };

    private resolveGatepass = async (request: Exclude<GatepassDocumentRequest, { source: { type: "html" } }>): Promise<EMandiGatepass> => {
        if (request.source.type === "html") throw new ValidationError("HTML source cannot resolve a gatepass record");

        const response = request.source.type === "latest"
            ? await emandi.getLatestGatepass()
            : await emandi.getGatepassById(request.source.gatepassId, request.source.date);

        if (!response.content) throw new Throwable("Gatepass record not available!", 404);
        return response.content as EMandiGatepass;
    };

    private resolveNiner = async (request: NinerDocumentRequest): Promise<EMandiNiner> => {
        if (request.source.type === "html") throw new ValidationError("HTML source cannot resolve a niner record");

        const response = request.source.type === "latest"
            ? await emandi.getLatestNiner()
            : await emandi.getNinerById(request.source.ninerId, request.source.date);

        if (!response.content) throw new Throwable("Niner record not available!", 404);
        return response.content as EMandiNiner;
    };
}

export const documents = new Documents();
