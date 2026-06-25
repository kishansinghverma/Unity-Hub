import { KeyboardEvent, MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import {
    AirVent,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    CircleDot,
    Cpu,
    Focus,
    HouseWifi,
    Import,
    LucideIcon,
    Play,
    Power,
    PowerOff,
    Projector,
    SkipBack,
    SkipForward,
    Speaker,
    Tv,
    Undo2,
    Volume1,
    Volume2,
    VolumeX
} from "lucide-react";
import { Button, Container, Header, HeaderSubheader, Segment } from "semantic-ui-react";
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

let audioCtx: AudioContext | null = null;

const playFeedback = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        
        if (audioCtx) {
            if (audioCtx.state === "suspended") {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            // Fire TV-like navigation click (soft, low-pitched percussive "thock")
            osc.type = "sine";
            
            const now = audioCtx.currentTime;
            
            // Rapid pitch drop for percussive transient
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.03);

            // Very short, punchy amplitude envelope
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + 0.005); // quick attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04); // quick decay

            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc.start(now);
            osc.stop(now + 0.05);
        }
    } catch (e) {
        console.warn("Audio feedback failed", e);
    }
};

export const RemotePage = () => {
    const [pressedCommandKey, setPressedCommandKey] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "disconnected">("checking");
    const repeatIntervalRef = useRef<number | null>(null);

    const devices = useMemo(() => {
        const response = commandsData as CommandResponse;
        return response.Response ?? [];
    }, []);

    const issueCommand = (commandId: number, remoteId: number) => {
        playFeedback();
        fetch(Url.OakterRemoteCommand, { ...PostParams, body: JSON.stringify({ commandId, remoteId }) })
            .then(handleJsonResponse)
            .then(json => { if (!json.Status) throw new Error(json.Response) })
            .catch(handleError);
    };

    const stopCommandRepeat = () => {
        if (repeatIntervalRef.current !== null) {
            window.clearInterval(repeatIntervalRef.current);
            repeatIntervalRef.current = null;
        }
    };

    const press = (commandKey: string, commandId: number, remoteId: number) => {
        setPressedCommandKey(commandKey);
        
        issueCommand(commandId, remoteId);
        
        stopCommandRepeat();
        repeatIntervalRef.current = window.setInterval(() => {
            issueCommand(commandId, remoteId);
        }, 500);
    };

    const release = (commandKey: string) => {
        setPressedCommandKey((current) => (current === commandKey ? null : current));
        stopCommandRepeat();
    };

    // Cleanup interval on unmount
    useEffect(() => stopCommandRepeat, []);

    const getDeviceCategory = (deviceName: string): DeviceCategory => {
        const normalizedName = deviceName.toLowerCase();
        const matchedRule = DEVICE_CLASSIFICATION_RULES.find((rule) =>
            rule.keywords.some((keyword) => normalizedName.includes(keyword))
        );

        return matchedRule?.category ?? "generic";
    };

    const commandIconMap = useMemo(() => {
        const explicitMap: Record<string, LucideIcon> = {
            on: Power,
            off: PowerOff,
            mute: VolumeX,
            play: Play,
            next: SkipForward,
            previous: SkipBack,
            up: ArrowUp,
            down: ArrowDown,
            left: ArrowLeft,
            right: ArrowRight,
            back: Undo2,
            focus: Focus,
            input: Import,
            "temp up": ArrowUp,
            "temp down": ArrowDown,
            "volume up": Volume2,
            "volume down": Volume1
        };

        const keywordRules: Array<{ keywords: string[]; icon: LucideIcon }> = [
            { keywords: ["power off", "off"], icon: PowerOff },
            { keywords: ["power on", "on"], icon: Power },
            { keywords: ["mute"], icon: VolumeX },
            { keywords: ["volume up", "vol up"], icon: Volume2 },
            { keywords: ["volume down", "vol down"], icon: Volume1 },
            { keywords: ["temp up"], icon: ArrowUp },
            { keywords: ["temp down"], icon: ArrowDown },
            { keywords: ["previous", "prev"], icon: SkipBack },
            { keywords: ["next"], icon: SkipForward },
            { keywords: ["play"], icon: Play },
            { keywords: ["left"], icon: ArrowLeft },
            { keywords: ["right"], icon: ArrowRight },
            { keywords: ["up"], icon: ArrowUp },
            { keywords: ["down"], icon: ArrowDown },
            { keywords: ["back"], icon: Undo2 },
            { keywords: ["focus"], icon: Focus },
            { keywords: ["input"], icon: Cpu }
        ];

        const map: Record<string, LucideIcon> = {};
        for (const device of devices) {
            for (const command of device.CommandList) {
                const normalizedName = command.Name.trim().toLowerCase();
                if (map[normalizedName]) continue;

                const explicit = explicitMap[normalizedName];
                if (explicit) {
                    map[normalizedName] = explicit;
                    continue;
                }

                const matchedRule = keywordRules.find((rule) =>
                    rule.keywords.some((keyword) => normalizedName.includes(keyword))
                );
                map[normalizedName] = matchedRule?.icon ?? CircleDot;
            }
        }

        return map;
    }, [devices]);

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
                                        const CommandIcon = commandIconMap[command.Name.trim().toLowerCase()] ?? CircleDot;
                                        return (
                                            <Button
                                                key={command.Id}
                                                basic
                                                className={`remote-command-button${pressedCommandKey === commandKey ? " pressed" : ""}`}
                                                onPointerDown={() => press(commandKey, command.Id, device.Id)}
                                                onPointerUp={() => release(commandKey)}
                                                onPointerLeave={() => release(commandKey)}
                                                onPointerCancel={() => release(commandKey)}
                                                onBlur={() => release(commandKey)}
                                                onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                                                    if (event.repeat) return;
                                                    if (event.key === " " || event.key === "Enter") {
                                                        press(commandKey, command.Id, device.Id);
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
                                                }}
                                                aria-label={`${device.Name} - ${command.Name}`}
                                            >
                                                <span className="remote-command-icon-wrap">
                                                    <CommandIcon className="remote-command-fallback-icon" aria-hidden />
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
