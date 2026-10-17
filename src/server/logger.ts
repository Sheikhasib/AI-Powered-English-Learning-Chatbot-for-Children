/* eslint-disable no-console -- the one place allowed to write to the console */
const isProduction = process.env.NODE_ENV === "production";

/** Silent in production except errors, so logs never fill with child activity. */
export const logger = {
  debug: (...args: unknown[]) => {
    if (!isProduction) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (!isProduction) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    if (!isProduction) console.warn(...args);
  },
  error: (...args: unknown[]) => console.error(...args),
};
