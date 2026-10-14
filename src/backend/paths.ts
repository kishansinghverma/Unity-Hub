import path from "path";
import { fileURLToPath } from "url";

export const rootDir = path.dirname(fileURLToPath(import.meta.url));
export const staticDir = path.join(rootDir, "static");
export const assetsDir = path.join(rootDir, "assets");