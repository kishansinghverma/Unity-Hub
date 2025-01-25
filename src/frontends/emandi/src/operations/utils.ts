import React from "react";
import { toast } from "react-toastify";
import { HttpStatusCode } from "../common/constants";
import { BaseSyntheticEvent } from "react";
import { InputOnChangeData, DropdownProps, CheckboxProps } from "semantic-ui-react";
import { Party, Record, SplitwiseGroupResponse, SplitwiseGroupsResponse } from "../common/types";

export const handleError = (error: Error) => toast.error(error.message);

export const trimInput = (e: BaseSyntheticEvent) => { e.currentTarget.value = e.target.value.trim() };

export const getRandom = (length: number) => Math.random().toString(36).substring(2, 2 + length);

export const triggerValidation = (e: BaseSyntheticEvent, field: InputOnChangeData | DropdownProps) => validateField(field);

export const handleResponse = (response: Response, errorMessage?: string) => {
    if (!response.ok)
        throw new Error(`Error ${response.status} : ${errorMessage ? errorMessage : HttpStatusCode[response.status]}`);
}

export const handleJsonResponse = (response: Response, errorMessage?: string) => {
    handleResponse(response, errorMessage);
    return response.json();
}

export const getFormData = (event: BaseSyntheticEvent) => {
    const fields: Array<HTMLInputElement> = event.currentTarget.getElementsByTagName('input');
    const formData: { [key: string]: string } = {};
    [...fields].forEach(field => { if (field.name) formData[field.name] = field.value });
    return formData;
}

export const validateField = (field: InputOnChangeData | DropdownProps | CheckboxProps) => {
    const targetDiv = document.getElementsByName(field.name)[0].parentElement?.parentElement;
    field.required && !field.value ? targetDiv?.classList.add('error') : targetDiv?.classList.remove('error');
}

export const isFormValid = ({ currentTarget }: BaseSyntheticEvent) => {
    let isFormValid = true;
    const fields = currentTarget.getElementsByTagName('input');

    for (const field of fields) {
        const element = field.parentElement.parentElement;
        if (field.required && !field.value) {
            element.classList.add('error');
            isFormValid = false;
        }
        else
            element.classList.remove('error');
    }

    !isFormValid && toast.error("कृपया आवश्यक जानकारी उपलब्ध करायें.");
    return isFormValid;
}

export const getDate = (epoch?: number) => {
    const currentDate = epoch ? new Date(epoch) : new Date();
    const day = currentDate.getDate()
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    return `${day}-${month}-${year}`;
}

export const getDateTime = (epoch?: number) => (`${getDate(epoch)}, ${epoch ? new Date(epoch).toLocaleTimeString() : new Date().toLocaleTimeString()}`);

export const capitalize = (str: string) => {
    if (!str) return '';
    let tokens = str.trim().split(' ');
    let capitals = tokens.map((token) => token.charAt(0).toUpperCase() + token.substring(1));
    const updatedString = capitals.join(' ');
    tokens = updatedString.split('.');
    capitals = tokens.map((token) => token.charAt(0).toUpperCase() + token.substring(1));
    return capitals.join('.');
}

export const MandiOptionsMapper = (party: Record<Party>) => {
    const { _id, ...restParams } = party;
    return {
        key: _id,
        value: JSON.stringify(restParams),
        text: `${party.name}, ${party.mandi}`
    }
}

export const SplitwiseGroupMapper = ({ group }: SplitwiseGroupResponse) => ({
    id: group.id,
    name: group.name,
    avatar: group.avatar.large,
    due: group.simplified_debts.find(item => (item.to === 62039516))?.amount ?? '0',
    members: group.members
});

export const SplitwiseGroupsMapper = (data: SplitwiseGroupsResponse) => {
    return data.groups.map(item => (SplitwiseGroupMapper({ group: item })));
}

export const ReactState = <T>(value: T) => {
    const state = React.useState<T>(value);
    return {
        get: () => state[0],
        set: state[1]
    }
}

export class TableRenderer<T> {
    private url: string;
    private pageSize: number
    private sortDescending = false;
    public records = ReactState<Array<Record<T>>>([]);
    public pageCount = ReactState(0);
    public currentPage = ReactState(1);
    public isFetching = ReactState(true);

    constructor(url: string, pageSize = 5, sortDescending = false) {
        this.url = url;
        this.pageSize = pageSize
        this.sortDescending = sortDescending;
    }

    public render = () => {
        this.isFetching.set(true);
        fetch(this.url)
            .then(handleJsonResponse)
            .then((data: Array<Record<T>>) => {
                this.records.set(this.sortDescending ? data.reverse() : data);
                this.pageCount.set(Math.ceil(data.length / this.pageSize));
            })
            .catch(handleError)
            .finally(() => { this.isFetching.set(false) });
    }

    public getPaginated = () => this.records.get().slice((this.currentPage.get() - 1) * this.pageSize, this.currentPage.get() * this.pageSize);
}