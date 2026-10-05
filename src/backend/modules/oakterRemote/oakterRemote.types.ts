import type { JsonValue } from '../../shared/types/json.js';

export type OakterCommandRequest = {
  commandId: string;
  remoteId: string | number;
};

export type OakterConnectionResponse = {
  RenewSessionResult: {
    ESPDevices: Array<{ Connected: boolean }>;
  };
};

export type OakterRequestHeader = {
  Brand: string;
  Version: string;
  App_Version: string;
  OS: string;
  OS_Version: string;
  Username: string;
  SessionId: string;
};

export type OakterCommandPayload = {
  Header: OakterRequestHeader;
  RemoteId: string | number;
  CommandId: string;
  OakRemoteId: string;
};

export type OakterCatalogPayload = {
  Header: OakterRequestHeader;
  OakRemoteId: string;
};

export type OakterConnectionPayload = OakterRequestHeader & {
  User: { Token: string };
};

export type OakterResponse = JsonValue;

export type OakterCommandResponse = {
  Response: string;
  Status: boolean;
};

export type OakterCatalogResponse = {
  Response: JsonValue;
  Status: boolean;
};
