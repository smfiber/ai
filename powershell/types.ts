export enum Mode {
  Generate = 'generate',
  Refactor = 'refactor',
}

export enum Sender {
  User = 'user',
  AI = 'ai',
  Error = 'error',
}

export interface ChatMessage {
  sender: Sender;
  text: string;
}
