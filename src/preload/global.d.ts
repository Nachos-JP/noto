import type {NotoApi} from "../shared/ipc";

declare global {
  interface Window {
    noto: NotoApi;
  }
}

export {};
