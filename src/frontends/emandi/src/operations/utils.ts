import React from "react";
import { toast } from "react-toastify";
import { HttpStatusCode } from "../common/constants";
import { BaseSyntheticEvent } from "react";
import { InputOnChangeData, DropdownProps, CheckboxProps } from "semantic-ui-react";
import { Party, Record } from "../common/types";

export class StringUtils {
    public static empty = '';
}

export const handleError = (error: Error) => toast.error(error.message);

export const trimInput = (e: BaseSyntheticEvent) => { e.currentTarget.value = e.target.value.trim() };

export const getRandom = (length: number) => Math.random().toString(36).substring(2, 2 + length);

export const triggerValidation = (e: BaseSyntheticEvent, field: InputOnChangeData | DropdownProps) => validateField(field);

export const handleResponse = async (response: Response, customError?: string): Promise<void> => {
    if (response.ok) return;
    if (customError) throw new Error(`Error ${response.status} : ${customError}`);

    const json = await response.json().catch(() => undefined);
    const genericError = HttpStatusCode[response.status];
    const errorMessage = json?.isError ? (json?.message ?? genericError): genericError;
    throw new Error(`Error ${response.status} : ${errorMessage}`);
}

export const handleJsonResponse = async <T>(response: Response, customError?: string): Promise<T> => {
    await handleResponse(response, customError);

    const data = await response.json().catch(() => undefined);
    
    if (typeof data === 'object') {
        if ((typeof data.content === 'object') || (typeof data.content === 'string'))
            return data.content as T;

        return data as T;
    }

    throw new Error("The server returned an unexpected response.");
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

export const formatDisplayDate = (value: string) => {
    const formattedDate = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (formattedDate)
        return `${formattedDate[1].padStart(2, '0')}-${formattedDate[2].padStart(2, '0')}-${formattedDate[3]}`;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return `${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
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

export const ReactState = <T>(value: T) => {
    const state = React.useState<T>(value);
    return {
        get: () => state[0],
        set: state[1]
    }
};

export const ContentState = <T>(value: T, isLoading = true) => {
    const contentState = ReactState(value);
    const loadingState = ReactState(isLoading)

    return {
        content: contentState.get(),
        isLoading: loadingState.get(),
        setContent: (state: T) => contentState.set(state),
        setLoading: (state: boolean) => loadingState.set(state),
        startLoading: () => loadingState.set(true),
        stopLoading: () => loadingState.set(false)
    }
};

export const ModalState = <T>(modalParams: T, isOpen = false) => {
    const openState = ReactState(isOpen);
    const paramState = ReactState(modalParams);

    return {
        params: paramState.get(),
        isOpen: openState.get(),
        setParams: (state: T) => paramState.set(state),
        open: () => openState.set(true),
        close: () => openState.set(false)
    }
};

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
            .then((response) => handleJsonResponse<Array<Record<T>>>(response))
            .then((data) => {
                const records = data ?? [];
                this.records.set(this.sortDescending ? records.reverse() : records);
                this.pageCount.set(Math.ceil(records.length / this.pageSize));
            })
            .catch(handleError)
            .finally(() => { this.isFetching.set(false) });
    }

    public getPaginated = () => this.records.get().slice((this.currentPage.get() - 1) * this.pageSize, this.currentPage.get() * this.pageSize);
}
