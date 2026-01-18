import { app, shell, BrowserWindow, ipcMain, dialog, protocol } from 'electron'
import { parseFile } from 'music-metadata'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs/promises'
import icon from '../../resources/icon.png?asset'
import { get } from 'http'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // // Enable local files loading
  // protocol.registerFileProtocol('file', (request, callback) => {
  //   const pathname = decodeURI(request.url.replace('file:///', ''))
  //   callback(pathname)
  // })

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// Handler for selecting local songs
ipcMain.handle('select-music-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Audio Files',
        extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'mp4']
      }
    ]
  })

  if (result.canceled){
    return []
  }

  return result.filePaths
})





const getLibraryPath = () => {
  return path.join(app.getPath('userData'), 'music-library.json')
}


// Handler for extracting metadatas
ipcMain.handle('get-music-metadata', async (event, filePath: string) =>{
  try {
    const metadata = await parseFile(filePath)

    return {
      path: filePath,
      title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
      artist: metadata.common.artist || 'Artiste inconnu',
      album: metadata.common.album || 'Album inconnu',
      duration: metadata.format.duration || 0,
      year: metadata.common.year,
      genre: metadata.common.genre?.[0],
      cover: metadata.common.picture?.[0]?.data // Cover image in Buffer
    }
  } catch (error){
    console.error('Error while listening for the metadatas', error)
    return null
  }
})

// Handle for saving library
ipcMain.handle('save-library', async (event, tracks) => {
  try {
    const libraryPath = getLibraryPath()
    await fs.writeFile(libraryPath, JSON.stringify(tracks, null, 2), 'utf-8')
    return { success: true }
  } catch (error){
    console.error('Error saving the library', error)
    return {success: false}
  }
})

// Handler for loading library
ipcMain.handle('load-library', async (event, tracks) => {
  try {
    const libraryPath = getLibraryPath()
    const data = await fs.readFile(libraryPath, 'utf-8')
    return JSON.parse(data)
  } catch (error){
    if (error.code === 'ENOENT') { // if file doesn't exist, return empty table
      return []
    }
    console.error('Error while loading:', error)
    return []
  }
})

// Handler for removing a track from library
ipcMain.handle('remove-track', async (event, trackPath) => {
  try {
    const libraryPath = getLibraryPath()
    const data = await fs.readFile(libraryPath, 'utf-8')
    const tracks = JSON.parse(data)
    
    const updatedTracks = tracks.filter((track: any) => track.path !== trackPath)
    
    await fs.writeFile(libraryPath, JSON.stringify(updatedTracks, null, 2), 'utf-8')
    return { success: true, tracks: updatedTracks }
  } catch (error) {
    console.error('Error while deleting:', error)
    return { success: false, error: error.message }
  }
})

// Handler for reading audio file
ipcMain.handle('read-audio-file', async (event, filePath: string) => {
  try {
    const buffer = await fs.readFile(filePath)
    return buffer
  } catch (error) {
    console.error('Erreur lecture fichier audio:', error)
    return null
  }
})