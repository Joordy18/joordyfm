import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

contextBridge.exposeInMainWorld('electronAPI', {
  selectMusicFiles: () => ipcRenderer.invoke('select-music-files'),
  getMusicMetadata: (filePath: string) => ipcRenderer.invoke('get-music-metadata', filePath),

  
  saveLibrary: (tracks: any[]) => ipcRenderer.invoke('save-library', tracks),
  loadLibrary: () => ipcRenderer.invoke('load-library'),
  removeTrack: (trackPath: string) => ipcRenderer.invoke('remove-track', trackPath),
  readAudioFile: (filePath: string) => ipcRenderer.invoke('read-audio-file', filePath),

})

