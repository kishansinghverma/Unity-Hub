import { capitalize } from "./utils";
import {
    DistanceMatrixApiKey,
    PatchParams,
    PostParams,
    States,
    Url
} from "../common/constants";
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
    if (images.numberPlateImage) payload.append('plateImage', images.numberPlateImage);

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
            licenceNumber: formData.licenceNumber?.toUpperCase() || undefined
        })
    });
};

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

export const getDistance = async (destination: string): Promise<number> => {
    const trimmed = destination.trim();
    if (!trimmed) {
        throw new Error("Destination cannot be empty.");
    }

    const cleaned = trimmed
        .replace(/[\u093C]/g, "")
        .replace(/\s+(mandi|market|subji\s+mandi|grain\s+mandi|मंडी|बाजार|सब्जी\s+मंडी|अनाज\s+मंडी)$/i, "")
        .trim();

    const isCoordinate = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(cleaned || trimmed);
    const destinationQuery = isCoordinate || /india|भारत/i.test(cleaned || trimmed)
        ? (cleaned || trimmed)
        : `${cleaned || trimmed}, India`;

    const queryKey = encodeURIComponent(DistanceMatrixApiKey);
    const target = encodeURIComponent(destinationQuery);
    const url = `${Url.DistanceMatrix}?origins=Sadabad,%20India&destinations=${target}&key=${queryKey}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Unable to calculate driving route to destination.");
    }

    const data = await response.json();
    if (data.status !== "OK") {
        throw new Error(data.error_message || "Unable to locate destination mandi.");
    }

    const element = data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
        throw new Error(`Location not found for "${trimmed}".`);
    }

    const distanceMeters = element?.distance?.value;
    if (typeof distanceMeters !== "number") {
        throw new Error("Distance information not available.");
    }

    return Math.ceil(distanceMeters / 1000);
};
