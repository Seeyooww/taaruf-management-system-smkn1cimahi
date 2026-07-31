const isProd = process.env.NODE_ENV === "production";

export const logger = {
  info: (message: string, ...meta: unknown[]) => {
    if (!isProd) {
      console.log(`[INFO] ${message}`, ...meta);
    }
  },
  warn: (message: string, ...meta: unknown[]) => {
    if (!isProd) {
      console.warn(`[WARN] ${message}`, ...meta);
    }
  },
  error: (message: string, error?: unknown) => {
    if (!isProd) {
      console.error(`[ERROR] ${message}`, error || "");
    } else {
      const errObj = error as { digest?: string; message?: string } | undefined;
      const logPayload = {
        level: "error",
        timestamp: new Date().toISOString(),
        message,
        digest: errObj?.digest || errObj?.message || String(error || ""),
      };
      process.stderr.write(JSON.stringify(logPayload) + "\n");
    }
  },
};
