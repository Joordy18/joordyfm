export interface MusicTrack {
    path: string
    title: string
    artist: string
    album: string
    duration: number
    year?: number
    genre?: string
    cover?: Buffer
    type: 'local'
}

export interface YouTubeTrack {
    id: string
    title: string
    channel: string
    duration: number
    thumbnail: string
    url: string
    isDownloaded: boolean
    localPath?: string
    type: 'youtube-stream' | 'youtube-downloaded'
}

export type Track = MusicTrack | YouTubeTrack

export interface Playlist {
    id: string
    name: string
    tracks: Track[]
    coverImage?: string
    createdAt: number
    updatedAt: number
}


declare global {
    interface Window {
        electronAPI: {
            selectMusicFiles: () => Promise<string[]>
            getMusicMetadata: (filePath: string) => Promise<MusicTrack | null>
            saveLibrary: (tracks: MusicTrack[]) => Promise<{ success: boolean; error?: string }>
            loadLibrary: () => Promise<MusicTrack[]>
            removeTrack: (trackPath: string) => Promise<{ success: boolean; tracks?: MusicTrack[]; error?: string }>
            readAudioFile: (filePath: string) => Promise<Buffer | null>

            // Playlists
            savePlaylists: (playlists: Playlist[]) => Promise<{ success: boolean; error?: string }>
            loadPlaylists: () => Promise<Playlist[]>

            // YouTube
            searchYouTube: (query: string) => Promise<YouTubeTrack[]>
            downloadYouTube: (videoId: string) => Promise<{ success: boolean; localPath?: string; error?: string }>
            getYouTubeStreamUrl: (videoId: string) => Promise<{ success: boolean; url?: string; error?: string }>
            saveYouTubeTracks: (tracks: YouTubeTrack[]) => Promise<{ success: boolean; error?: string }>
            loadYouTubeTracks: () => Promise<YouTubeTrack[]>
            deleteYouTubeDownload: (videoId: string) => Promise<{ success: boolean; error?: string }>
        }
    }
}