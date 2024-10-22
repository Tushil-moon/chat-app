export type Chatdetail = {
  id?: string;
  participants: Record<string, boolean>;
  messages: Message[];
};

export type Message = {
  id?: string;
  text: string;
  senderId: string;
  receiverid: string;
  timestamp: number;
  readStatus: 'sent' | 'delivered' | 'read';
};
