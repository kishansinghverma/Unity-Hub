import { Throwable } from "../common/models";
import { ExecutionResponse, EMandiAuthRequest, GatepassQuery } from "../common/types";
import { emandiClient } from "../services/emandiclient";
import { eMandiPortal } from "../common/constants";

const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const DEFAULT_LOOKBACK_DAYS = 7;
const DEFAULT_PAGE_LENGTH = 10;

class MandiProxy {

    public initializeSession = (request: EMandiAuthRequest): Promise<ExecutionResponse> => emandiClient.initializeSession(request);

    public getSessionStatus = (): Promise<ExecutionResponse> => emandiClient.getSessionStatus();

    public clearSession = (): Promise<ExecutionResponse> => emandiClient.clearSession();

    public getGatepasses = (query: GatepassQuery = {}): Promise<ExecutionResponse> => {
        const now = new Date();
        const fromDate = this.toPortalDate(query.startDate) ?? this.formatPortalDate(new Date(now.getTime() - DEFAULT_LOOKBACK_DAYS * 86_400_000));
        const toDate = this.toPortalDate(query.endDate) ?? this.formatPortalDate(now);

        return emandiClient.sendRequest({
            url: eMandiPortal.gatepassList,
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: new URLSearchParams({
                fromDate,
                toDate,
                draw: "1",
                start: "0",
                length: String(query.top ?? DEFAULT_PAGE_LENGTH),
                "order[0][column]": "1",
                "order[0][dir]": "desc"
            })
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
