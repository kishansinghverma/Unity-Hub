export type GetTaggedVehicleRequest = {
    FromDate: string;
    ToDate: string;
    MobileNumber: string;
    InstrumentType: string;
};

export type TagVehicleRequest = {
    ContactNumber: string;
    InstrumentNumber: string;
    InstrumentType: number;
    InstrumentTypeName: string;
    VehicleTypeId: number;
    VehicleTypeName: string;
    VehicleNumber: string;
    Latitude: string;
    Longitude: string;
    IPAddress: string;
    VehicleImage: string;
    VehicleFullImage: string;
};
