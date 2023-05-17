// shim.d.ts
import { ProtocolWithReturn } from "webext-bridge";
import { DictEntry } from './dict';

declare module "webext-bridge" {
  export interface ProtocolMap {
    // search: { text: string, originalText: string };
    // to specify the return type of the message,
    // use the `ProtocolWithReturn` type wrapper
    search: ProtocolWithReturn<{ text: string, originalText: string }, DictEntry | null>;
  }
}