import React, { createContext, useContext, useState, useRef, useEffect, act } from 'react'
import { MusicTrack } from '../types/electron'

type RepeatMode = 'no-repeat' | 'repeat-all' | 'repeat-one'

interface AudioContextType {
  currentTrack: MusicTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  play: (track: MusicTrack) => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  next: () => void
  previous: () => void
  playlist: MusicTrack[]
  setPlaylist: (tracks: MusicTrack[]) => void
  repeatMode: RepeatMode
  toggleRepeatMode: () => void
  shuffle: boolean
  toggleShuffle: () => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)
  const [playlist, setPlaylist] = useState<MusicTrack[]>([])
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('no-repeat')
  const [shuffle, setShuffle] = useState(false)
  const [shuffledPlaylist, setShuffledPlaylist] = useState<MusicTrack[]>([])
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentTrackRef = useRef<MusicTrack | null>(null)
  const playlistRef = useRef<MusicTrack[]>([])
  const shuffledPlaylistRef = useRef<MusicTrack[]>([])
  const repeatModeRef = useRef<RepeatMode>('no-repeat')
  const shuffleRef = useRef(false)

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

  const shuffleArray = (array: MusicTrack[]): MusicTrack[] => {
    const shuffled = [...array]
    for (let i = shuffled.length-1; i>0; i--){
      const j = Math.floor(Math.random() * (i+1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  useEffect(() => {
    if (shuffle && playlist.length > 0){
      if (currentTrack){
        const otherTracks = playlist.filter(t => t.path !== currentTrack.path)
        const shuffled = shuffleArray(otherTracks)
        setShuffledPlaylist([currentTrack, ...shuffled])
      } else {
        setShuffledPlaylist(shuffleArray(playlist))
      }
    }
  }, [shuffle, playlist])

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

      if (!track || activePlaylist.length === 0){
        setIsPlaying(false)
        return
      }

      const currentIndex = activePlaylist.findIndex(t => t.path === track.path)

      if (mode === 'repeat-one'){
        if (audioRef.current){
            audioRef.current.currentTime = 0
            audioRef.current.play()
        }
      } else if (mode === 'repeat-all'){
        const nextIndex = (currentIndex+1) % activePlaylist.length
        playTrack(activePlaylist[nextIndex])
      } else {
        // no-repeat
        if (currentIndex < activePlaylist.length - 1){
            playTrack(activePlaylist[currentIndex+1])
        } else {
            setIsPlaying(false)
            setCurrentTrack(null)
            setCurrentTime(0)
        }
      }
    }

    const handleError = (e: Event) => {
      console.error('Erreur audio:', e)
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

  const playTrack = async (track: MusicTrack) => {
    if (audioRef.current) {
      try {
        const buffer = await window.electronAPI.readAudioFile(track.path)
        
        if (buffer) {
          const blob = new Blob([new Uint8Array(buffer)], { type: 'audio/mpeg' })
          const url = URL.createObjectURL(blob)
          
          if (audioRef.current.src) {
            URL.revokeObjectURL(audioRef.current.src)
          }
          
          audioRef.current.src = url
          audioRef.current.volume = volume
          await audioRef.current.play()
          setCurrentTrack(track)
          setIsPlaying(true)
        }
      } catch (error) {
        console.error('Error while listening:', error)
        setIsPlaying(false)
      }
    }
  }

  const play = (track: MusicTrack) => {
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
    if (currentTrack){
      const activePlaylist = shuffle ? shuffledPlaylist : playlist

      if (activePlaylist.length > 0){
        const currentIndex = activePlaylist.findIndex(t => t.path === currentTrack.path)
        const nextIndex = (currentIndex+1) % activePlaylist.length
        play(activePlaylist[nextIndex])
      }
    }
  }

  const previous = () => {
    if (currentTrack){
      const activePlaylist = shuffle ? shuffledPlaylist : playlist

      if (activePlaylist.length > 0){
        const currentIndex = activePlaylist.findIndex(t => t.path === currentTrack.path)
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