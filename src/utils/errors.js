"use strict";

export class CustomException extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class PlannerError extends CustomException {}
export class BrowserNavigationError extends CustomException {}
export class SSAnalysisError extends CustomException {}
export class CritiqueError extends CustomException {}
export class SkillError extends CustomException {}
export class ConfigurationError extends CustomException {}
