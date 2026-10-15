"use strict";

const LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

class Logger {
  constructor(name = "AgenticBrowser") {
    this.name = name;
  }

  _format(level, message, meta = null) {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] [${level}] [${this.name}] ${message}`;
    if (meta && Object.keys(meta).length > 0) {
      try {
        formatted += ` ${JSON.stringify(meta)}`;
      } catch {
        formatted += ` [Circular / Unserializable Meta]`;
      }
    }
    return formatted;
  }

  debug(message, meta) {
    if (process.env.DEBUG) {
      console.debug(this._format("DEBUG", message, meta));
    }
  }

  info(message, meta) {
    console.log(this._format("INFO", message, meta));
  }

  warn(message, meta) {
    console.warn(this._format("WARN", message, meta));
  }

  error(message, meta) {
    console.error(this._format("ERROR", message, meta));
  }
}

export const logger = new Logger();
