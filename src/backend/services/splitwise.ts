import { requestParams } from "../common/constants";
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

    public addExpense = (expense: any, debitedFrom?: string) => {
        if (![66299282, 66299350].includes(expense.group_id) && debitedFrom && !expense.split_equally) {
            fetch(`${this.baseUrl}/create_expense`, this.getRequestParams('post', {
                date: expense.date,
                cost: expense.cost,
                description: expense.description,
                details: expense.details,
                group_id: debitedFrom,
                users__0__user_id: 40748243,
                users__0__paid_share: `${expense.cost}`,
                users__0__owed_share: "0",
                users__1__user_id: 62039516,
                users__1__paid_share: "0",
                users__1__owed_share: `${expense.cost}`
            })).then(getJsonResponse);
        };

        return fetch(`${this.baseUrl}/create_expense`, this.getRequestParams('post', expense)).then(getJsonResponse);
    }
}

export const splitwiseService = new SplitwiseService();