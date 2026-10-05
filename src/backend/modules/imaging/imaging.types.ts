export type OcrResponse = {
  IsErroredOnProcessing?: boolean;
  OCRExitCode?: number;
  ParsedResults?: Array<{
    TextOverlay?: unknown;
    TextOrientation?: string;
    FileParseExitCode?: number;
    ParsedText?: string;
    ErrorMessage?: string;
    ErrorDetails?: string;
  }>;
};

export type ExtractTextRequest = {
  Body: {
    base64string: string;
  };
};

export type GenerateQrRequest = {
  text: string;
  version: 8 | 14;
  maskPattern: 2 | 6;
  width: 1140 | 1620;
};
