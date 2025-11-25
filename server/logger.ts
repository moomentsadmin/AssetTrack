import pino from "pino";

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

const pinoOptions: pino.LoggerOptions = {
  level,
  base: { pid: false },
  timestamp: pino.stdTimeFunctions.isoTime,
};

let logger: pino.Logger;

if (process.env.NODE_ENV === "production") {
  logger = pino(pinoOptions);
} else {
  // Use pretty printing during development for readability
  const transport = pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  });
  logger = pino({ ...pinoOptions, transport } as any);
}

export default logger;

export function log(message: string, source = "express") {
  logger.info({ source }, message as any);
}
