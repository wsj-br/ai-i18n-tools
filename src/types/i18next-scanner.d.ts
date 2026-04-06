declare module "i18next-scanner" {
  export class Parser {
    constructor(options?: Record<string, unknown>);
    parseFuncFromString(content: string, callback?: (key: string) => void): void;
  }
}
