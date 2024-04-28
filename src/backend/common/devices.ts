import { CustomDevice, NestDevice } from "./types";

const deviceAliases: { [key: string]: string } = {
    desklights: "desklights",
    desklight: "desklights",
    backlights: "backlights",
    backlight: "backlights",
    smartcfl: "smartcfl",
    smarttubelight: "smartcfl",
    smartcfllight: "smartcfl",
    deskcfl: "smartcfl",
    deskcfllight: "smartcfl",
    maincfl: "twincfl",
    twincfl: "twincfl",
    twinlight: "twincfl",
    twincfllight: "twincfl",
    twintubelight: "twincfl",
    upssocket: "upsplug",
    upsplug: "upsplug",
    camera: "camera",
    streetcamera: "camera",
    facadefrontlight: "facadefrontlight",
    frontfacadelight: "facadefrontlight",
    balconyfrontlight: "facadefrontlight",
    facadebacklight: "facadebacklight",
    backfacadelight: "facadebacklight",
    balconybacklight: "facadebacklight",
    alllights: "lightset",
    fulllights: "lightset",
    alllight: "lightset",
    fulllight: "lightset",
    allsystems: "all",
    allsystem: "all",
    all: "all"
};

const customDeviceGroups: CustomDevice = {
    desklights: { "switch/main": ["3"] },
    backlights: { "switch/main": ["1"] },
    ceilinglight: { "switch/main": ["3", "1"] },
    smartcfl: { "switch/main": ["2"] },
    twincfl: { "switch/main": ["0"] },
    upsplug: { "switch/extra": ["1"] },
    camera: { "switch/extra": ["2"] },
    facadefrontlight: { "switch/extra": ["3"] },
    facadebacklight: { "switch/extra": ["0"] },
    lightset: { "switch/main": ["0", "1", "2", "3"] },
    all: { "switch/main": ["0", "1", "2", "3"], "switch/extra": ["3"] }
};

export const nestDeviceGroupIds = {
    Light: '6326dfe578ac164b83eb85a4',
    CFL: '6326e3e778ac164b83eb85a7',
    ComboOne: '634667ba2c9920503522ae28',
    ComboTwo: '63469c352c9920503522ae31'
}

export const nestDeviceGroups: NestDevice = {
    desklights: { GroupId: nestDeviceGroupIds.Light, DeviceId: 'powerState1' },
    backlights: { GroupId: nestDeviceGroupIds.Light, DeviceId: 'powerState2' },
    smartcfl: { GroupId: nestDeviceGroupIds.CFL, DeviceId: 'powerState1' },
    twincfl: { GroupId: nestDeviceGroupIds.CFL, DeviceId: 'powerState2' },
    upsplug: { GroupId: nestDeviceGroupIds.ComboOne, DeviceId: 'powerState2' },
    camera: { GroupId: nestDeviceGroupIds.ComboTwo, DeviceId: 'powerState1' },
    facadebacklight: { GroupId: nestDeviceGroupIds.ComboOne, DeviceId: 'powerState1' },
    facadefrontlight: { GroupId: nestDeviceGroupIds.ComboTwo, DeviceId: 'powerState2' }
}

export const HelperDevices = ["assistant", "broadcast", "wait"];

export const getCustomDevice = (device: string) => {
    const targetDevice = deviceAliases[device];
    return targetDevice ? customDeviceGroups[targetDevice] : null;
}

export const getNestDevice = (device: string) => {
    const targetDevice = deviceAliases[device];
    return targetDevice ? nestDeviceGroups[targetDevice] : null;
}
