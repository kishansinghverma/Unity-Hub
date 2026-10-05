export const Ocr = {
  OcrApiUrl: 'https://api.ocr.space/parse/image'
} as const;

export const Emandi = {
  BaseUrl: 'https://emandi.up.gov.in',
  Routes: {
    LoginPage: '/Account/index',
    Login: '/Account',
    GatepassList: '/Traders/SP_Get_Gatepass_List',
    NinerList: '/Traders/SP_Get_9R_List',
    TradersIndex: '/Traders/index'
  },
  CredentialsKey: 'EmandiCredentials',
  SessionTtl: 30 * 60 * 1000,
  RequestTimeout: 30_000,
  MaxLoginAttempts: 3,
  UserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'
} as const;

export const VehicleTagging = {
  BaseRoute: '/api/VehicleTaggingAPI',
  Routes: {
    getVehicle: '/GetVehicleNumberByGatepass',
    getTaggingData: '/GetVechicleTaggingData',
    getVehicleTypes: '/GetVehicleMasterData',
    insertTaggingData: '/InsertVehcileTaggingData'
  }
} as const;

export const OakterRemote = {
  Routes: {
    sendCommand: '/api/ir/send',
    deviceCatalog: '/api/ir/remotes/v2'
  },
  Headers: {
    Brand: 'OAKTER',
    Version: '5.3',
    App_Version: '8.9',
    OS: 'iOS',
    OS_Version: '26.400000'
  },
  CatalogFile: 'src/backend/assets/oak-devices.json',
  RequestTimeout: 30_000
} as const;

export const CronJobs = {
  CleanupSchedule: '0 1 * * *',
  StaticPath: 'src/backend/static'
} as const;

export const MongoDatabases = {
  EMandi: {
    database: 'E-Mandi',
    collections: {
      queued: 'Queued',
      processed: 'Processed',
      parties: 'Parties',
    },
  },
  Deployment: {
    database: 'Deployment',
    collections: {
      keyVault: 'KeyVault',
    },
  },
} as const;

export const WhatsApp = {
  GreenApi: {
    Routes: {
      sendMessage: 'sendMessage',
      sendFileByUrl: 'sendFileByUrl',
      uploadFile: 'uploadFile'
    },
    Group: {
      EMandi: '120363153442141119@g.us',
      UnityHub: '120363265204710984@g.us'
    }
  }
} as const;

export const Snippets = {
  GatepassRequested: 'Gatepass requested for {0}, {1}, {2}. Proceed here: https://emandi.up.gov.in/Traders/Dashboard',
  GatepassQrData: 'Gatepass no:{0},Issue from:{1},Crop:{2},Weight:{3},Vehicle no:{4},applicationnumber:{5}date & time of issue :{6} {7}InstrumentType:Gatepass,http://emandi.up.gov.in/',
  NinerQrData: 'SerialNo:{0},Mandi:{1},Crop:{2}InstrumentType:9R,http://emandi.up.gov.in/'
} as const;

export const MimeTypes = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heif: 'image/heif',
  heic: 'image/heic',
  pdf: 'application/pdf',
  default: 'application/octet-stream'
} as const;
