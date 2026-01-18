export interface MusicTrack {
    path: string
    title: string
    artist: string
    album: string
    duration: number
    year?: number
    genre?: string
    cover?: Buffer
}

declare global {
    interface Window {
        electronAPI: {
            selectMusicFiles: () => Promise<string[]>
            getMusicMetadata: (filePath:string) => Promise<MusicTract | null>
            saveLibrary: (tracks: MusicTrack[]) => Promise<{success: boolean; error?: string}>
            loadLibrary: () => Promise<MusicTrack[]>
            removeTrack: (trackPath: string) => Promise<{success: boolean; tracks?: MusicTrack[]; error?: string }>
            readAudioFile: (filePath: string) => Promise<Buffer | null>
        }
    }
}