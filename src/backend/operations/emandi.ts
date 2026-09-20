import { Throwable } from "../common/models";
import { EMandiRecord, ExecutionResponse, EMandiAuthRequest, EMandiQuery } from "../common/types";
import { emandiService } from "../services/emandi";
import { eMandiPortal } from "../common/constants";
import { normalizePortalDate } from "../common/utils";

const DEFAULT_LOOKBACK_DAYS = 7;
const DEFAULT_COLLECTION_LIMIT = 50;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

type PortalRecordsQuery = {
    fromDate: string;
    toDate: string;
    limit: number;
    recordId?: string;
};

class EMandi {
    public initializeSession = (request: EMandiAuthRequest): Promise<ExecutionResponse> => emandiService.initializeSession(request);

    public getSessionStatus = (): Promise<ExecutionResponse> => emandiService.getSessionStatus();

    public clearSession = (): Promise<ExecutionResponse> => emandiService.clearSession();

    public getGatepasses = (query: EMandiQuery = {}): Promise<ExecutionResponse> => {
        if (query.id && query.date) return this.getGatepassById(query.id, query.date);
        return this.getPortalRecords(eMandiPortal.gatepassList, this.getCollectionQuery(query));
    };

    public getNiners = (query: EMandiQuery = {}): Promise<ExecutionResponse> => {
        if (query.id && query.date) return this.getNinerById(query.id, query.date);
        return this.getPortalRecords(eMandiPortal.ninerList, this.getCollectionQuery(query));
    };

    public getLatestGatepass = async (): Promise<ExecutionResponse> => {
        const response = await this.getPortalRecords(eMandiPortal.gatepassList, this.getLatestQuery());
        return this.getFirstRecord(response);
    };

    public getLatestNiner = async (): Promise<ExecutionResponse> => {
        const response = await this.getPortalRecords(eMandiPortal.ninerList, this.getLatestQuery());
        return this.getFirstRecord(response);
    };

    public getGatepassById = async (recordId: string, date: string): Promise<ExecutionResponse> => {
        const response = await this.getPortalRecords(eMandiPortal.gatepassList, this.getRecordQuery(recordId, date));
        return this.getFirstRecord(response);
    };

    public getNinerById = async (recordId: string, date: string): Promise<ExecutionResponse> => {
        const response = await this.getPortalRecords(eMandiPortal.ninerList, this.getRecordQuery(recordId, date));
        return this.getFirstRecord(response);
    };

    private getPortalRecords = (url: string, query: PortalRecordsQuery): Promise<ExecutionResponse> => {
        const headers = {
            "User-Agent": USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            Origin: eMandiPortal.baseUrl,
            Referer: `${eMandiPortal.baseUrl}${eMandiPortal.gatepasses}`,
        };
        const payload = new URLSearchParams({
            fromDate: query.fromDate,
            toDate: query.toDate,
            draw: "1",
            start: "0",
            length: String(query.limit),
            "search[value]": query.recordId ?? "",
            "order[0][column]": "1",
            "order[0][dir]": "desc"
        });

        return emandiService.sendRequest({
            url,
            method: "POST",
            headers,
            body: payload.toString()
        });
    };

    private getCollectionQuery = (query: EMandiQuery): PortalRecordsQuery => {
        const now = new Date();
        return {
            fromDate: normalizePortalDate(query.fromDate) ?? normalizePortalDate(new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * 86_400_000))!,
            toDate: normalizePortalDate(query.toDate) ?? normalizePortalDate(now)!,
            limit: query.limit ?? DEFAULT_COLLECTION_LIMIT
        };
    };

    private getLatestQuery = (): PortalRecordsQuery => {
        const now = new Date();
        return {
            fromDate: normalizePortalDate(new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * 86_400_000))!,
            toDate: normalizePortalDate(now)!,
            limit: 1
        };
    };

    private getRecordQuery = (recordId: string, date: string): PortalRecordsQuery => {
        const normalizedDate = normalizePortalDate(date);
        if (!normalizedDate) throw new Throwable("A valid date is required", 400);
        return {
            fromDate: normalizedDate,
            toDate: normalizedDate,
            limit: 1,
            recordId
        };
    };

    private getFirstRecord = (response: ExecutionResponse): ExecutionResponse => {
        const content = response.content;
        const records: EMandiRecord[] = content && Array.isArray(content.data) ? content.data : [];
        const record = records[0];
        return record ? { content: record, statusCode: 200 } : { content: null, statusCode: 404 };
    };
}

export const emandi = new EMandi();
