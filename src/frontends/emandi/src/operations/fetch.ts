import { capitalize, getDate, handleError, handleJsonResponse } from "./utils";
import { PatchParams, PostParams, States, Url } from "../common/constants";
import { BankEntry, GroupInfo, PhonePeEntry } from "../common/types";

export const createNewEntry = (formData: any) => {
    return fetch(Url.Push, {
        ...PostParams,
        body: JSON.stringify({
            date: getDate(),
            seller: capitalize(formData.seller),
            weight: parseInt(formData.weight),
            bags: parseInt(formData.bags),
            party: JSON.parse(formData.party),
            vehicleNumber: formData.vehicleNumber.replace(/\s/g, "").toUpperCase(),
            vehicleType: parseInt(formData.vehicleType)
        })
    });
}

export const createNewParty = (formData: any) => {
    return fetch(Url.Parties, {
        ...PostParams,
        body: JSON.stringify({
            name: capitalize(formData.name),
            mandi: capitalize(formData.mandi),
            state: States[formData.stateCode],
            stateCode: parseInt(formData.stateCode),
            distance: parseInt(formData.distance),
            licenceNumber: formData.licenceNumber.toUpperCase()
        })
    });
}

export const updateParty = (formData: any) => {
    const patchData = {
        _id: formData._id,
        name: capitalize(formData.name),
        mandi: capitalize(formData.mandi),
        state: States[formData.stateCode],
        stateCode: parseInt(formData.stateCode),
        distance: parseInt(formData.distance),
        licenceNumber: formData.licenceNumber?.toUpperCase()
    };

    return {
        executeRequest: () => fetch(Url.Parties, { ...PatchParams, body: JSON.stringify(patchData) }),
        data: patchData
    };
}

export const updateGroupInfo = (groupInfo: GroupInfo) => {
    return fetch(`${Url.ExpenseGroups}`, {
        ...PostParams,
        body: JSON.stringify(groupInfo)
    }).catch(handleError);
}

export const getDistance = (destination: string) => {
    return fetch(`${Url.Distance}=${destination}`);
}

export const uploadBankStatement = async (transactions: Array<BankEntry>) => {
    return fetch(`${Url.BankStatement}`, { ...PostParams, body: JSON.stringify(transactions) })
        .then(handleJsonResponse);
}

export const uploadPhonePeStatement = async (transactions: Array<PhonePeEntry>) => {
    return fetch(`${Url.PhonePeStatement}`, { ...PostParams, body: JSON.stringify(transactions) })
        .then(handleJsonResponse);
}


export const notifyViaWhatsApp = async (message: string) => {
    fetch(Url.NotificationUrl, {
        ...PostParams,
        body: JSON.stringify({ Message: message })
    }).catch(handleError);
}