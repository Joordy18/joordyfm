import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { parseFile } from 'music-metadata'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs/promises'
import icon from '../../resources/icon.png?asset'
import ytdl from 'yt-dlp-exec'
import youtubesearchapi from 'youtube-search-api'

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

  if (result.canceled) {
    return []
  }

  return result.filePaths
})

const getLibraryPath = () => {
  return path.join(app.getPath('userData'), 'music-library.json')
}

const getPlaylistsPath = () => {
  return path.join(app.getPath('userData'), 'playlists.json')
}

// Handler for saving playlists
ipcMain.handle('save-playlists', async (event, playlists) => {
  try {
    const playlistsPath = getPlaylistsPath()
    await fs.writeFile(playlistsPath, JSON.stringify(playlists, null, 2), 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Error while saving playlists:', error)
    return { success: false, error: error.message }
  }
})

// Handler for loading playlists
ipcMain.handle('load-playlists', async () => {
  try {
    const playlistsPath = getPlaylistsPath()
    const data = await fs.readFile(playlistsPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    console.error('Error while loading playlists:', error)
    return []
  }
})


// Handler for extracting metadatas
ipcMain.handle('get-music-metadata', async (event, filePath: string) => {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error saving the library', error)
    return { success: false }
  }
})

// Handler for loading library
ipcMain.handle('load-library', async (event, tracks) => {
  try {
    const libraryPath = getLibraryPath()
    const data = await fs.readFile(libraryPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
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

// YouTube handlers

const getYouTubeDownloadsPath = () => {
  return path.join(app.getPath('userData'), 'downloads', 'youtube')
}

const getYouTubeTracksPath = () => {
  return path.join(app.getPath('userData'), 'youtube-tracks.json')
}

// On beginning creating YT downloads folder
app.whenReady().then(async () => {
  const downloadsPath = getYouTubeDownloadsPath()
  try {
    await fs.mkdir(downloadsPath, { recursive: true })
    console.log('YouTube downloads folder created:', downloadsPath)
  } catch (error) {
    console.error('Error creating downloads folder:', error)
  }
})

// Helper for parseing YT duration
function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number)
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  return 0
}

// Handler for researching on YT

ipcMain.handle('search-youtube', async (event, query: string) => {
  try {
    console.log('Searching YouTube for:', query)
    const results = await youtubesearchapi.GetListByKeyword(query, false, 20)

    const tracks = results.items
      .filter((item: any) => item.type === 'video')
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        channel: item.channelTitle || 'Unknown',
        duration: item.length?.simpleText ? parseDuration(item.length.simpleText) : 0,
        thumbnail: item.thumbnail?.thumbnails?.[0]?.url || '',
        url: `https://www.youtube.com/watch?v=${item.id}`,
        isDownloaded: false,
        type: 'youtube-stream'
      }))

    console.log(`Found ${tracks.length} results`)
    return tracks
  } catch (error) {
    console.error('YouTube search error:', error)
    return []
  }
})

// Handler for downloading from YT

ipcMain.handle('download-youtube', async (event, videoId: string) => {
  try {
    console.log('Downloading YouTube video:', videoId)
    const downloadsPath = getYouTubeDownloadsPath()
    const outputPath = path.join(downloadsPath, `${videoId}.%(ext)s`)

    // Fix for ffmpeg/ffprobe path in dev/prod
    const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')
    const ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')

    await ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
      output: outputPath,
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: 0, // Meilleure qualité
      embedThumbnail: true,
      addMetadata: true,
      noPlaylist: true
    }, {
      env: {
        ...process.env,
        PATH: `${path.dirname(ffmpegPath)}${path.delimiter}${path.dirname(ffprobePath)}${path.delimiter}${process.env.PATH}`
      }
    })

    const finalPath = path.join(downloadsPath, `${videoId}.mp3`)
    console.log('Download complete:', finalPath)

    return { success: true, localPath: finalPath }
  } catch (error) {
    console.error('YouTube download error:', error)
    return { success: false, error: error.message }
  }
})

// Get YT streaming URL

ipcMain.handle('get-youtube-stream-url', async (event, videoId: string) => {
  try {
    console.log('Getting stream URL for:', videoId)

    // Fix for ffmpeg/ffprobe path
    const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked')
    const ffprobePath = require('ffprobe-static').path.replace('app.asar', 'app.asar.unpacked')

    // Obtenir les infos avec yt-dlp
    const info: any = await ytdl(`https://www.youtube.com/watch?v=${videoId}`, {
      dumpSingleJson: true,
      format: 'bestaudio/best',
      noPlaylist: true
    }, {
      env: {
        ...process.env,
        PATH: `${path.dirname(ffmpegPath)}${path.delimiter}${path.dirname(ffprobePath)}${path.delimiter}${process.env.PATH}`
      }
    })

    // Extraire l'URL du meilleur format audio
    const audioFormat = info.formats?.find((f: any) => f.acodec !== 'none' && f.vcodec === 'none')
    const url = audioFormat?.url || info.url

    if (url) {
      console.log('Stream URL obtained')
      return { success: true, url }
    } else {
      throw new Error('No stream URL found')
    }
  } catch (error) {
    console.error('YouTube stream URL error:', error)
    return { success: false, error: error.message }
  }
})

// Save YT tracks

ipcMain.handle('save-youtube-tracks', async (event, tracks) => {
  try {
    const tracksPath = getYouTubeTracksPath()
    await fs.writeFile(tracksPath, JSON.stringify(tracks, null, 2), 'utf-8')
    console.log('YouTube tracks saved')
    return { success: true }
  } catch (error) {
    console.error('Error saving YouTube tracks:', error)
    return { success: false, error: error.message }
  }
})

// Load YT tracks

ipcMain.handle('load-youtube-tracks', async () => {
  try {
    const tracksPath = getYouTubeTracksPath()
    const data = await fs.readFile(tracksPath, 'utf-8')
    const tracks = JSON.parse(data)
    console.log(`Loaded ${tracks.length} YouTube tracks`)
    return tracks
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No YouTube tracks file found, returning empty array')
      return []
    }
    console.error('Error loading YouTube tracks:', error)
    return []
  }
})

// Delete YT download

ipcMain.handle('delete-youtube-download', async (event, videoId: string) => {
  try {
    const downloadsPath = getYouTubeDownloadsPath()
    const filePath = path.join(downloadsPath, `${videoId}.mp3`)

    await fs.unlink(filePath)
    console.log('YouTube download deleted:', videoId)
    return { success: true }
  } catch (error) {
    console.error('Error deleting YouTube download:', error)
    return { success: false, error: error.message }
  }
})