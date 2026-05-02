import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { AirVent, Cpu, HouseWifi, LucideIcon, Projector, Speaker, Tv } from "lucide-react";
import { Button, Container, Header, HeaderSubheader, Icon, Segment } from "semantic-ui-react";
import { PostParams, Url } from "../common/constants";
import { handleError, handleJsonResponse } from "../operations/utils";
import commandsData from "../static/commands.json";
import "./remote.css";

type RemoteCommand = {
    Id: number;
    Name: string;
    ImagePath: string;
};

type RemoteDevice = {
    Id: number;
    Name: string;
    CommandList: RemoteCommand[];
};

type CommandResponse = {
    Response: RemoteDevice[];
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
    const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "disconnected">("checking");

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

    const issueCommand = (commandId: number, remoteId: number) => {
        fetch(Url.OakterRemoteCommand, { ...PostParams, body: JSON.stringify({ commandId, remoteId }) })
            .then(handleJsonResponse)
            .then(json => { if (!json.Status) throw new Error(json.Response) })
            .catch(handleError);
    };

    useEffect(() => {
        let isMounted = true;
        const checkConnection = () => {
            fetch(Url.OakterRemoteIsConnected)
                .then(handleJsonResponse)
                .then((json) => {
                    const isConnected = Boolean(json?.isConnected);
                    if (isMounted) setConnectionStatus(isConnected ? "connected" : "disconnected");
                })
                .catch(() => {
                    if (isMounted) setConnectionStatus("disconnected");
                });
        };

        checkConnection();
        const timerId = window.setInterval(checkConnection, 10000);
        return () => {
            isMounted = false;
            window.clearInterval(timerId);
        };
    }, []);

    return (
        <Container className="remote-page">
            <Segment className="remote-devices-container">
                <div className="remote-devices">
                    <div className="remote-page-header">
                        <div className="remote-page-title-wrap">
                            <div className="remote-title-icon">
                                <HouseWifi size={28} strokeWidth={1.5} />
                            </div>
                            <Header as="h2" className="remote-page-title">
                                Smart Remote
                                <HeaderSubheader>
                                    {devices.length} Devices Connected
                                </HeaderSubheader>
                            </Header>
                        </div>
                        <span className={`stat-value ${connectionStatus}`}>
                            {connectionStatus === "checking" ? "Checking" : connectionStatus === "connected" ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                    {devices.map((device) => {
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

                                                    issueCommand(command.Id, device.Id);
                                                }}
                                                aria-label={`${device.Name} - ${command.Name}`}
                                            >
                                                <span className="remote-command-icon-wrap">
                                                    {command.ImagePath && !brokenImages[imageKey] ? (
                                                        <img
                                                            className="remote-command-image"
                                                            src={new URL(command.ImagePath.replace(/^\//, ""), IR_COMMAND_BASE_URL).toString()}
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
                            </div>
                        );
                    })}
                </div>
            </Segment>
        </Container>
    );
};
