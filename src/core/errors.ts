/** Base class for package errors with an optional machine-readable code. */
export class I18nToolsError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "I18nToolsError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigValidationError extends I18nToolsError {
  constructor(
    message: string,
    public readonly issues?: readonly { path: string; message: string }[]
  ) {
    super(message, "CONFIG_VALIDATION");
    this.name = "ConfigValidationError";
  }
}

export class CacheError extends I18nToolsError {
  constructor(message: string) {
    super(message, "CACHE");
    this.name = "CacheError";
  }
}
