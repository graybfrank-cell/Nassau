// Auto-generated module declarations
declare module "resend" {
  export class Resend {
    constructor(apiKey?: string);
    emails: {
      send: (params: any) => Promise<any>;
    };
  }
}

declare module "@anthropic-ai/sdk" {
  export default class Anthropic {
    constructor(config?: any);
    messages: {
      create: (params: any) => Promise<any>;
    };
  }
  export type MessageParam = any;
  export type Tool = any;
  export type TextBlock = any;
  export type ToolUseBlock = any;
  export type ToolResultBlockParam = any;
  export type MessageCreateParams = any;
}

declare module "@/generated/prisma/client" {
  export class PrismaClient {
    constructor(config?: any);
    [key: string]: any;
  }
}
