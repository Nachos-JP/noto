import type {AppState} from "./todo";

export const IPC_CHANNELS = {
  loadState: "todo:load-state",
  saveState: "todo:save-state",
} as const;

export interface NotoApi {
  loadState: () => Promise<AppState>;
  saveState: (state: AppState) => Promise<AppState>;
}
