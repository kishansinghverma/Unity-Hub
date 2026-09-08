import { Throwable } from "../common/models";
import { ExecutionResponse, EMandiAuthRequest, MandiQuery } from "../common/types";
import { emandiClient } from "../services/emandiclient";
import { eMandiPortal } from "../common/constants";

const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const DEFAULT_LOOKBACK_DAYS = 7;
const DEFAULT_PAGE_LENGTH = 10;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

class MandiProxy {
    public initializeSession = (request: EMandiAuthRequest): Promise<ExecutionResponse> => emandiClient.initializeSession(request);

    public getSessionStatus = (): Promise<ExecutionResponse> => emandiClient.getSessionStatus();

    public clearSession = (): Promise<ExecutionResponse> => emandiClient.clearSession();

    public getGatepasses = (query: MandiQuery = {}): Promise<ExecutionResponse> => this.getMandiRecords(eMandiPortal.gatepassList, query);

    public getNiners = (query: MandiQuery = {}): Promise<ExecutionResponse> => this.getMandiRecords(eMandiPortal.ninerList, query);

    private async getMandiRecords(url: string, query: MandiQuery): Promise<ExecutionResponse> {
        const now = new Date();
        const fromDate = this.toPortalDate(query.startDate) ?? this.formatPortalDate(new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * 86_400_000));
        const toDate = this.toPortalDate(query.endDate) ?? this.formatPortalDate(now);
        const length = query.top ?? ((query.startDate || query.endDate) ? DEFAULT_PAGE_LENGTH : 1);

        const headers = {
            "User-Agent": USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            Origin: eMandiPortal.baseUrl,
            Referer: `${eMandiPortal.baseUrl}${eMandiPortal.gatepasses}`,
        };
        const payload = new URLSearchParams({
            fromDate,
            toDate,
            draw: "1",
            start: "0",
            length: String(length),
            "order[0][column]": "1",
            "order[0][dir]": "desc"
        });

        return emandiClient.sendRequest({
            url,
            method: "POST",
            headers,
            body: payload.toString()
        });
    };

    private formatPortalDate = (date: Date): string => {
        const dd = String(date.getDate()).padStart(2, "0");
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}/${date.getFullYear()}`;
    };

    private toPortalDate = (input?: string): string | undefined => {
        const trimmed = input?.trim();
        if (!trimmed) return undefined;

        const match = trimmed.match(DATE_PATTERN);
        if (!match) throw new Throwable("Dates must use DD/MM/YYYY format", 400);

        const [, dayValue, monthValue, yearValue] = match;

        const day = Number(dayValue);
        const month = Number(monthValue);
        const year = Number(yearValue);
        const parsed = new Date(year, month - 1, day);

        if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
            throw new Throwable("Dates must be valid calendar dates", 400);
        }

        return this.formatPortalDate(parsed);
    };
}

export const mandiProxy = new MandiProxy();
