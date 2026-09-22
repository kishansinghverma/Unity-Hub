export type CreateDispatchRequest = {
    date: string;
    seller: string;
    weight: number;
    bags: number;
    vehicleNumber: string;
    vehicleType: number;
    vehicleImage?: string;
    numberPlateImage?: string;
    party: {
        name: string;
        mandi: string;
        state: string;
        stateCode: number;
        distance: number;
        licenceNumber?: string;
    };
};

export type FinalizeDispatchRequest = {
    gatepassId?: string;
    ninerId?: string;
    rate?: string | 0;
};
