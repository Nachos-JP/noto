import {contextBridge, ipcRenderer} from "electron";
import {IPC_CHANNELS, type NotoApi} from "../shared/ipc";
import type {AppState} from "../shared/todo";

const api: NotoApi = {
  loadState: () => ipcRenderer.invoke(IPC_CHANNELS.loadState),
  saveState: (state: AppState) =>
    ipcRenderer.invoke(IPC_CHANNELS.saveState, state),
};

contextBridge.exposeInMainWorld("noto", api);
