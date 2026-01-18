import React, { createContext, useContext, useState, useEffect } from 'react'
import { Playlist, MusicTrack } from '../types/electron'

interface PlaylistContextType {
    playlists: Playlist[]
    createPlaylist: (name: string) => Promise<void>
    deletePlaylist: (id: string) => Promise<void>
    renamePlaylist: (id: string, newName: string) => Promise<void>
    addTrackToPlaylist: (playlistId: string, track: MusicTrack) => Promise<void>
    removeTrackFromPlaylist: (playlistId: string, trackPath: string) => Promise<void>
    getPlaylist: (id: string) => Playlist | undefined
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined)

export const PlaylistProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([])

    useEffect(() => {
        loadPlaylists()
    }, [])

    const loadPlaylists = async () => {
        try {
            const savedPlaylists = await window.electronAPI.loadPlaylists()
            setPlaylists(savedPlaylists)
        } catch (error){
            console.error('Error while loading playlists:', error)
        }
    }

    const savePlaylists = async (updatedPlaylists: Playlist[]) => {
        try {
            const result = await window.electronAPI.savePlaylists(updatedPlaylists)
            if (result.success){
                setPlaylists(updatedPlaylists)
            }
        } catch (error){
            console.error('Error while saving playlists:', error)
        }
    }

    const createPlaylist = async (name:string) => {
        const newPlaylist: Playlist = {
            id: `playlist_${Date.now()}`,
            name,
            tracks: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        const updatedPlaylists = [...playlists, newPlaylist]
        await savePlaylists(updatedPlaylists)
    }

    const deletePlaylist = async (id:string) => {
        const updatedPlaylists = playlists.filter(p => p.id !== id)
        await savePlaylists(updatedPlaylists)
    }

    const renamePlaylist = async (id:string, newName:string) => {
        const updatedPlaylists = playlists.map(p =>
            p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p
        )
        await savePlaylists(updatedPlaylists)
    }
    
    const addTrackToPlaylist = async (playlistId: string, track: MusicTrack) => {
        const updatedPlaylists = playlists.map( p => {
            if (p.id === playlistId){
                const trackExists = p.tracks.some(t => t.path === track.path)
                if (!trackExists){
                    return {
                        ...p,
                        tracks: [...p.tracks, track],
                        updatedAt: Date.now()
                    }
                }
            }
            return p
        })
        await savePlaylists(updatedPlaylists)
    }

    const removeTrackFromPlaylist = async (playlistId: string, trackPath: string) => {
        const updatedPlaylists = playlists.map(p => {
        if (p.id === playlistId) {
            return {
            ...p,
            tracks: p.tracks.filter(t => t.path !== trackPath),
            updatedAt: Date.now()
            }
        }
        return p
        })
        await savePlaylists(updatedPlaylists)
    }

    const getPlaylist = (id: string) => {
        return playlists.find(p => p.id === id)
     } 
  
     return (
    <PlaylistContext.Provider
      value={{
        playlists,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        getPlaylist
      }}
    >
      {children}
    </PlaylistContext.Provider>
  )
}

export const usePlaylists = () => {
    const context = useContext(PlaylistContext)
    if (!context){
        throw new Error('usePlaylists must be used within PlaylistProvider')
    }
    return context
}