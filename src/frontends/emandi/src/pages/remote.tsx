import { KeyboardEvent, MouseEvent, useMemo, useState } from "react";
import { AirVent, Cpu, HouseWifi, LucideIcon, Projector, Speaker, Tv } from "lucide-react";
import { Button, Container, Header, HeaderSubheader, Icon, Segment } from "semantic-ui-react";
import { toast } from "react-toastify";
import commandsData from "../static/commands.json";

type RemoteCommand = {
    Id: number;
    Name: string;
    ImagePath: string;
    IRCommand: string;
};

type RemoteDevice = {
    Id: number;
    Name: string;
    CommandList: RemoteCommand[];
};

type CommandResponse = {
    Response: RemoteDevice[];
    Status: boolean;
};

type DeviceCategory = "airconditioner" | "speaker" | "projector" | "tv" | "generic";

type DeviceClassificationRule = {
    category: DeviceCategory;
    keywords: string[];
};

const IR_COMMAND_BASE_URL = process.env.REACT_APP_IR_COMMAND_BASE_URL ?? "http://oakter.co:64807/";
const DEVICE_CLASSIFICATION_RULES: DeviceClassificationRule[] = [
    { category: "airconditioner", keywords: ["ac", "air conditioner", "airconditioner", "cooler"] },
    { category: "speaker", keywords: ["speaker", "soundbar", "audio", "boat", "govo"] },
    { category: "projector", keywords: ["projector", "beamer"] },
    { category: "tv", keywords: ["tv", "television", "smart tv"] }
];
const DEVICE_ICONS: Record<DeviceCategory, LucideIcon> = {
    airconditioner: AirVent,
    speaker: Speaker,
    projector: Projector,
    tv: Tv,
    generic: Cpu
};

export const RemotePage = () => {
    const [brokenImages, setBrokenImages] = useState<{ [key: string]: boolean }>({});
    const [pressedCommandKey, setPressedCommandKey] = useState<string | null>(null);

    const devices = useMemo(() => {
        const response = commandsData as CommandResponse;
        return response.Response ?? [];
    }, []);
    const press = (commandKey: string) => setPressedCommandKey(commandKey);
    const release = (commandKey: string) => {
        setPressedCommandKey((current) => (current === commandKey ? null : current));
    };
    const getDeviceCategory = (deviceName: string): DeviceCategory => {
        const normalizedName = deviceName.toLowerCase();
        const matchedRule = DEVICE_CLASSIFICATION_RULES.find((rule) =>
            rule.keywords.some((keyword) => normalizedName.includes(keyword))
        );

        return matchedRule?.category ?? "generic";
    };

    return (
        <Container className="remote-page">
            <Segment className="remote-devices-container">
                <div className="remote-devices">
                    <div className="remote-page-header">
                        <div className="remote-page-title-wrap">
                            <span className="remote-title-icon">
                                <HouseWifi size={24} />
                            </span>
                            <div className="remote-page-title-block">
                                <Header as="h2" className="remote-page-title">
                                    Smart Switch Dashboard
                                    <HeaderSubheader>
                                        One place to control all your devices.
                                    </HeaderSubheader>
                                </Header>
                            </div>
                        </div>
                    </div>
                    {devices.map((device, index) => {
                        const deviceCategory = getDeviceCategory(device.Name);
                        const DeviceFallbackIcon = DEVICE_ICONS[deviceCategory];
                        return (
                        <div key={device.Id} className="remote-device-section">
                            <div className="remote-device-title-row">
                                <Header as="h3" className="remote-device-title">
                                    <DeviceFallbackIcon className="remote-device-fallback-lucide" aria-hidden />
                                    <Header.Content>{device.Name}</Header.Content>
                                </Header>
                                <div className="remote-device-title-line" />
                            </div>

                            <div className="remote-command-grid">
                                {device.CommandList.map((command) => {
                                    const commandKey = `${device.Id}-${command.Id}`;
                                    const imageKey = `${device.Id}-${command.Id}`;
                                    return (
                                    <Button
                                        key={command.Id}
                                        basic
                                        className={`remote-command-button${pressedCommandKey === commandKey ? " pressed" : ""}`}
                                        onPointerDown={() => press(commandKey)}
                                        onPointerUp={() => release(commandKey)}
                                        onPointerLeave={() => release(commandKey)}
                                        onPointerCancel={() => release(commandKey)}
                                        onBlur={() => release(commandKey)}
                                        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                                            if (event.key === " " || event.key === "Enter") {
                                                press(commandKey);
                                            }
                                        }}
                                        onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
                                            if (event.key === " " || event.key === "Enter") {
                                                release(commandKey);
                                            }
                                        }}
                                        onClick={(event: MouseEvent<HTMLButtonElement>) => {
                                            // Keep focus for keyboard users, blur only for pointer clicks.
                                            if (event.detail > 0) {
                                                (event.currentTarget as HTMLButtonElement).blur();
                                            }

                                            toast.info(`Command "${command.Name}" is UI-only for now.`, {
                                                toastId: `remote-preview-${commandKey}`,
                                                autoClose: 900
                                            });
                                        }}
                                        aria-label={`${device.Name} - ${command.Name}`}
                                    >
                                        <span className="remote-command-icon-wrap">
                                            {command.ImagePath && !brokenImages[imageKey] ? (
                                                <img
                                                    className="remote-command-image"
                                                    src={new URL(command.ImagePath, IR_COMMAND_BASE_URL).toString()}
                                                    alt={command.Name}
                                                    loading="lazy"
                                                    onError={(event) => {
                                                        event.currentTarget.style.display = "none";
                                                        setBrokenImages((current) => ({ ...current, [imageKey]: true }));
                                                    }}
                                                />
                                            ) : (
                                                <Icon name="dot circle outline" className="remote-command-fallback-icon" />
                                            )}
                                        </span>
                                        <span className="remote-command-label">{command.Name}</span>
                                    </Button>
                                    );
                                })}
                            </div>

                            {index < devices.length - 1 && <div className="remote-device-section-gap" />}
                        </div>
                        );
                    })}
                </div>
            </Segment>
        </Container>
    );
};
