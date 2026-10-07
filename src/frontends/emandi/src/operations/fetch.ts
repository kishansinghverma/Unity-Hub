import { capitalize, getDate, handleError } from "./utils";
import { PatchParams, PostParams, States, Url } from "../common/constants";
import { EntryImages } from "../common/types";

export const createNewEntry = (formData: any, images: EntryImages = {}) => {
    const payload = new FormData();
    payload.append('date', new Date().toISOString());
    payload.append('seller', capitalize(formData.seller));
    payload.append('weight', parseInt(formData.weight).toString());
    payload.append('bags', parseInt(formData.bags).toString());
    payload.append('party', formData.party);
    payload.append('vehicleNumber', formData.vehicleNumber.replace(/\s/g, "").toUpperCase());
    payload.append('vehicleType', parseInt(formData.vehicleType).toString());
    if (images.vehicleImage) payload.append('vehicleImage', images.vehicleImage);
    if (images.numberPlateImage) payload.append('numberPlateImage', images.numberPlateImage);

    return fetch(`${Url.Dispatches}/push`, {
        method: PostParams.method,
        body: payload
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
    const requestData = {
        name: capitalize(formData.name),
        mandi: capitalize(formData.mandi),
        state: States[formData.stateCode],
        stateCode: parseInt(formData.stateCode),
        distance: parseInt(formData.distance),
        licenceNumber: formData.licenceNumber?.toUpperCase()
    };

    return {
        executeRequest: () => fetch(`${Url.Parties}/${formData._id}`, { ...PatchParams, body: JSON.stringify(requestData) }),
        data: { _id: formData._id, ...requestData }
    };
}

export const getDistance = (destination: string) => {
    return fetch(`${Url.Distance}=${destination}`);
}

export const notifyViaWhatsApp = async (message: string) => {
    fetch(Url.NotificationUrl, {
        ...PostParams,
        body: JSON.stringify({ Message: message })
    }).catch(handleError);
}
