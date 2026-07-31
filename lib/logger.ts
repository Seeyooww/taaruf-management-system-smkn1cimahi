const isProd = process.env.NODE_ENV === "production";

export const logger = {
  info: (message: string, ...meta: any[]) => {
    if (!isProd) {
      console.log(`[INFO] ${message}`, ...meta);
    }
  },
  warn: (message: string, ...meta: any[]) => {
    if (!isProd) {
      console.warn(`[WARN] ${message}`, ...meta);
    }
  },
  error: (message: string, error?: any) => {
    if (!isProd) {
      console.error(`[ERROR] ${message}`, error || "");
    } else {
      // Production Logger Wrapper
      // Avoids raw console dumping in production stdout/stderr
      const logPayload = {
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        digest: error?.digest || error?.message || String(error || ""),
      };
      // Structured log formatting
      process.stderr.write(JSON.stringify(logPayload) + "\n");
    }
  },
};
