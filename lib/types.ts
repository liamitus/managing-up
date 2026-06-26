// "Managing Up" — shared types.

export type Status = "alive" | "fired" | "quit" | "pushed" | "ceo" | "acquired";

export interface Effect {
  clout?: number;
  cred?: number;
  receipts?: number;
  flag?: string; // set a flag for later callbacks
  note?: string; // a past-tense "highlight" added to your permanent record
}

export interface Choice {
  label: string;
  effect?: Effect;
  result?: string; // one-liner reaction shown right after you choose
  replyAll?: boolean; // styles the chaos option
  end?: { status: Status; title: string; reason: string }; // dramatic exits
}

export type CardKind = "card" | "onboard" | "review" | "incident" | "finale";
export type Channel =
  | "slack"
  | "dm"
  | "email"
  | "irl"
  | "calendar"
  | "hr"
  | "review"
  | "allhands";

export interface OfficeCard {
  id: string;
  kind?: CardKind;
  channel: Channel;
  from?: string;
  avatar?: string;
  text: string;
  choices: Choice[];
  requires?: (s: State) => boolean;
  minDay?: number;
}

export interface State {
  seed: string;
  practice: boolean;
  company: string;
  day: number;
  rankIdx: number;
  clout: number;
  cred: number;
  receipts: number;
  flags: Record<string, boolean>;
  record: string[];
  pile: string[];
  onboard: string[];
  reviewsDone: number;
  fired: Record<string, boolean>; // which incidents have fired
  status: Status;
  endTitle?: string;
  endReason?: string;
  card: OfficeCard | null;
}

export interface Fx {
  dClout: number;
  dCred: number;
  dReceipts: number;
  result?: string;
  toast?: string;
}
