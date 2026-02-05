import React, { createContext, useContext, useState, useRef, useEffect } from 'react'
import { MusicTrack, YouTubeTrack, Track } from '../types/electron'

type RepeatMode = 'no-repeat' | 'repeat-all' | 'repeat-one'
type SourceType = 'local' | 'youtube-stream' | 'youtube-downloaded'

interface AudioContextType {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  currentSource: SourceType | null
  play: (track: Track) => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  next: () => void
  previous: () => void
  playlist: Track[]
  setPlaylist: (tracks: Track[]) => void
  repeatMode: RepeatMode
  toggleRepeatMode: () => void
  shuffle: boolean
  toggleShuffle: () => void
  isOnline: boolean
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('no-repeat')
  const [shuffle, setShuffle] = useState(false)
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Track[]>([])
  const [currentSource, setCurrentSource] = useState<SourceType | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentTrackRef = useRef<Track | null>(null)
  const playlistRef = useRef<Track[]>([])
  const shuffledPlaylistRef = useRef<Track[]>([])
  const repeatModeRef = useRef<RepeatMode>('no-repeat')
  const shuffleRef = useRef(false)

  // Online status
  const [isOnline, setIsOnline] = useState(window.navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    currentTrackRef.current = currentTrack
  }, [currentTrack])

  useEffect(() => {
    playlistRef.current = playlist
  }, [playlist])

  useEffect(() => {
    shuffledPlaylistRef.current = shuffledPlaylist
  }, [shuffledPlaylist])

  useEffect(() => {
    repeatModeRef.current = repeatMode
  }, [repeatMode])

  useEffect(() => {
    shuffleRef.current = shuffle
  }, [shuffle])

  const shuffleArray = (array: Track[]): Track[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  useEffect(() => {
    if (shuffle && playlist.length > 0) {
      if (currentTrack) {
        const trackId = getTrackId(currentTrack)
        const otherTracks = playlist.filter(t => getTrackId(t) !== trackId)
        const shuffled = shuffleArray(otherTracks)
        setShuffledPlaylist([currentTrack, ...shuffled])
      } else {
        setShuffledPlaylist(shuffleArray(playlist))
      }
    }
  }, [shuffle, playlist])

  // Helper pour obtenir un ID unique pour chaque track
  const getTrackId = (track: Track): string => {
    if (!track.type || track.type === 'local') {
      return (track as MusicTrack).path
    } else {
      return (track as YouTubeTrack).id
    }
  }

  useEffect(() => {
    audioRef.current = new Audio()

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration)
      }
    }

    const handleEnded = () => {
      const track = currentTrackRef.current
      const originalList = playlistRef.current
      const shuffledList = shuffledPlaylistRef.current
      const mode = repeatModeRef.current
      const isShuffled = shuffleRef.current

      const activePlaylist = isShuffled ? shuffledList : originalList

      if (!track || activePlaylist.length === 0) {
        setIsPlaying(false)
        return
      }

      const trackId = getTrackId(track)
      const currentIndex = activePlaylist.findIndex(t => getTrackId(t) === trackId)

      if (mode === 'repeat-one') {
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play()
        }
      } else if (mode === 'repeat-all') {
        const nextIndex = (currentIndex + 1) % activePlaylist.length
        playTrack(activePlaylist[nextIndex])
      } else {
        if (currentIndex < activePlaylist.length - 1) {
          playTrack(activePlaylist[currentIndex + 1])
        } else {
          setIsPlaying(false)
          setCurrentTrack(null)
          setCurrentTime(0)
        }
      }
    }

    const handleError = (e: Event) => {
      console.error('Audio error:', e)
      setIsPlaying(false)
    }

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
    audioRef.current.addEventListener('ended', handleEnded)
    audioRef.current.addEventListener('error', handleError)

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audioRef.current.removeEventListener('ended', handleEnded)
        audioRef.current.removeEventListener('error', handleError)
      }
    }
  }, [])

  const playTrack = async (track: Track) => {
    if (!audioRef.current) return

    try {
      const currentVolume = audioRef.current.volume

      // Nettoyer l'ancienne source
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src)
      }

      // Lecture selon le type de track
      // Lecture selon le type de track
      if (!track.type || track.type === 'local') {
        // Lecture locale (existant)
        const buffer = await window.electronAPI.readAudioFile(track.path)

        if (buffer) {
          const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/mpeg' })
          const url = URL.createObjectURL(blob)

          audioRef.current.src = url
          audioRef.current.volume = currentVolume
          await audioRef.current.play()
          setCurrentTrack(track)
          setCurrentSource('local')
          setIsPlaying(true)
        }
      } else if (track.type === 'youtube-downloaded') {
        // Lecture d'un téléchargement YouTube
        if (track.localPath) {
          const buffer = await window.electronAPI.readAudioFile(track.localPath)

          if (buffer) {
            const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/mpeg' })
            const url = URL.createObjectURL(blob)

            audioRef.current.src = url
            audioRef.current.volume = currentVolume
            await audioRef.current.play()
            setCurrentTrack(track)
            setCurrentSource('youtube-downloaded')
            setIsPlaying(true)
          }
        }
      } else if (track.type === 'youtube-stream') {
        // Check internet connection
        if (!isOnline) {
          alert('You are offline. Connect to the internet to stream music.')
          setIsPlaying(false)
          return
        }

        // Streaming YouTube
        const result = await window.electronAPI.getYouTubeStreamUrl(track.id)

        if (result.success && result.url) {
          audioRef.current.src = result.url
          audioRef.current.volume = currentVolume
          await audioRef.current.play()
          setCurrentTrack(track)
          setCurrentSource('youtube-stream')
          setIsPlaying(true)
        } else {
          throw new Error(result.error || 'Failed to get stream URL')
        }
      }
    } catch (error) {
      console.error('Error while playing:', error)
      setIsPlaying(false)
    }
  }

  const play = (track: Track) => {
    playTrack(track)
  }

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resume = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const setVolume = (vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol
      setVolumeState(vol)
    }
  }

  const next = () => {
    if (currentTrack) {
      const activePlaylist = shuffle ? shuffledPlaylist : playlist

      if (activePlaylist.length > 0) {
        const trackId = getTrackId(currentTrack)
        const currentIndex = activePlaylist.findIndex(t => getTrackId(t) === trackId)
        const nextIndex = (currentIndex + 1) % activePlaylist.length
        play(activePlaylist[nextIndex])
      }
    }
  }

  const previous = () => {
    if (currentTrack) {
      const activePlaylist = shuffle ? shuffledPlaylist : playlist

      if (activePlaylist.length > 0) {
        const trackId = getTrackId(currentTrack)
        const currentIndex = activePlaylist.findIndex(t => getTrackId(t) === trackId)
        const previousIndex = currentIndex === 0 ? activePlaylist.length - 1 : currentIndex - 1
        play(activePlaylist[previousIndex])
      }
    }
  }

  const toggleRepeatMode = () => {
    setRepeatMode(current => {
      if (current === 'no-repeat') return 'repeat-all'
      if (current === 'repeat-all') return 'repeat-one'
      return 'no-repeat'
    })
  }

  const toggleShuffle = () => {
    setShuffle(!shuffle)
  }

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        currentSource,
        play,
        pause,
        resume,
        seek,
        setVolume,
        next,
        previous,
        playlist,
        setPlaylist,
        repeatMode,
        toggleRepeatMode,
        shuffle,
        toggleShuffle,
        isOnline,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}