import { capitalize, getDate, handleError } from "./utils";
import { PatchParams, PostParams, States, Url } from "../common/constants";
import { EntryImages } from "../common/types";

export const createNewEntry = (formData: any, images: EntryImages = {}) => {
    return fetch(Url.Dispatches, {
        ...PostParams,
        body: JSON.stringify({
            date: getDate(),
            seller: capitalize(formData.seller),
            weight: parseInt(formData.weight),
            bags: parseInt(formData.bags),
            party: JSON.parse(formData.party),
            vehicleNumber: formData.vehicleNumber.replace(/\s/g, "").toUpperCase(),
            vehicleType: parseInt(formData.vehicleType),
            vehicleImage: images.vehicleImage,
            numberPlateImage: images.numberPlateImage
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
