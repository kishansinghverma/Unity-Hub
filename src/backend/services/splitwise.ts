import { requestParams } from "../common/constants";
import { SelfPaidExpense, SettlementExpense, SharedExpense } from "../common/types";
import { getJsonResponse } from "../common/utils";

class SplitwiseService {
    private apiToken;
    private baseUrl;

    constructor() {
        this.apiToken = process.env.SPLITWISE_API_TOKEN as string;
        this.baseUrl = process.env.SPLITWISE_API_URL as string;
    }

    private getRequestParams = (method: "get" | "post", body?: any) => {
        const params = requestParams[method] as any;
        params.headers.Authorization = `Bearer ${this.apiToken}`;
        if (body) params.body = JSON.stringify(body);
        return params;
    }

    public listGroups = () => fetch(`${this.baseUrl}/get_groups`, this.getRequestParams('get')).then(getJsonResponse);

    public getGroup = (groupId: string) => fetch(`${this.baseUrl}/get_group/${groupId}`, this.getRequestParams('get')).then(getJsonResponse);

    public addExpense = (expense: SharedExpense | SelfPaidExpense | SettlementExpense) => (
        fetch(`${this.baseUrl}/create_expense`, this.getRequestParams('post', expense)).then(getJsonResponse)
    );
}

export const splitwiseService = new SplitwiseService();