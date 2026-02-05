import React, { createContext, useContext, useState, useEffect } from 'react'
import { Playlist, MusicTrack, YouTubeTrack, Track } from '../types/electron'

interface PlaylistContextType {
    playlists: Playlist[]
    createPlaylist: (name: string) => Promise<void>
    deletePlaylist: (id: string) => Promise<void>
    renamePlaylist: (id: string, newName: string) => Promise<void>
    addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>
    addTracksToPlaylist: (playlistId: string, tracks: Track[]) => Promise<void>
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>
    getPlaylist: (id: string) => Playlist | undefined
    setPlaylistCover: (id: string, coverImage: string) => Promise<void>
    reorderTracks: (playlistId, fromIndex: number, toIndex: number) => Promise<void>
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined)

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([])

    useEffect(() => {
        loadPlaylists()
    }, [])

    const loadPlaylists = async () => {
        try {
            const savedPlaylists = await window.electronAPI.loadPlaylists()
            setPlaylists(savedPlaylists)
        } catch (error) {
            console.error('Error while loading playlists:', error)
        }
    }

    const savePlaylists = async (updatedPlaylists: Playlist[]) => {
        try {
            const result = await window.electronAPI.savePlaylists(updatedPlaylists)
            if (result.success) {
                setPlaylists(updatedPlaylists)
            }
        } catch (error) {
            console.error('Error while saving playlists:', error)
        }
    }

    const createPlaylist = async (name: string) => {
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

    const deletePlaylist = async (id: string) => {
        const updatedPlaylists = playlists.filter(p => p.id !== id)
        await savePlaylists(updatedPlaylists)
    }

    const renamePlaylist = async (id: string, newName: string) => {
        const updatedPlaylists = playlists.map(p =>
            p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p
        )
        await savePlaylists(updatedPlaylists)
    }

    const addTrackToPlaylist = async (playlistId: string, track: Track) => {
        const updatedPlaylists = playlists.map(p => {
            if (p.id === playlistId) {
                const trackExists = p.tracks.some(t => {
                    const tType = t.type || 'local'
                    const trackType = track.type || 'local'

                    if (tType === 'local' && trackType === 'local') {
                        return (t as MusicTrack).path === (track as MusicTrack).path
                    }
                    if (tType !== 'local' && trackType !== 'local') {
                        return (t as YouTubeTrack).id === (track as YouTubeTrack).id
                    }
                    return false
                })
                if (!trackExists) {
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

    const addTracksToPlaylist = async (playlistId: string, tracksToAdd: Track[]) => {
        const updatedPlaylists = playlists.map(p => {
            if (p.id === playlistId) {
                const newTracks = [...p.tracks]
                let changed = false

                tracksToAdd.forEach(track => {
                    const trackExists = newTracks.some(t => {
                        const tType = t.type || 'local'
                        const trackType = track.type || 'local'

                        if (tType === 'local' && trackType === 'local') {
                            return (t as MusicTrack).path === (track as MusicTrack).path
                        }
                        if (tType !== 'local' && trackType !== 'local') {
                            return (t as YouTubeTrack).id === (track as YouTubeTrack).id
                        }
                        return false
                    })

                    if (!trackExists) {
                        newTracks.push(track)
                        changed = true
                    }
                })

                if (changed) {
                    return {
                        ...p,
                        tracks: newTracks,
                        updatedAt: Date.now()
                    }
                }
            }
            return p
        })
        await savePlaylists(updatedPlaylists)
    }

    const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
        const updatedPlaylists = playlists.map(p => {
            if (p.id === playlistId) {
                return {
                    ...p,
                    tracks: p.tracks.filter(t => {
                        const type = t.type || 'local'
                        const id = type === 'local' ? (t as MusicTrack).path : (t as YouTubeTrack).id
                        return id !== trackId
                    }),
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

    const setPlaylistCover = async (id: string, coverImage: string) => {
        const updatedPlaylists = playlists.map(p =>
            p.id === id ? { ...p, coverImage, updatedAt: Date.now() } : p
        )
        await savePlaylists(updatedPlaylists)
    }

    const reorderTracks = async (playlistId: string, fromIndex: number, toIndex: number) => {
        const updatedPlaylists = playlists.map(p => {
            if (p.id === playlistId) {
                const newTracks = [...p.tracks]
                const [movedTracks] = newTracks.splice(fromIndex, 1)
                newTracks.splice(toIndex, 0, movedTracks)

                return {
                    ...p,
                    tracks: newTracks,
                    updatedAt: Date.now()
                }
            }
            return p
        })
        await savePlaylists(updatedPlaylists)
    }

    return (
        <PlaylistContext.Provider
            value={{
                playlists,
                createPlaylist,
                deletePlaylist,
                renamePlaylist,
                addTrackToPlaylist,
                addTracksToPlaylist,
                removeTrackFromPlaylist,
                getPlaylist,
                setPlaylistCover,
                reorderTracks,
            }}
        >
            {children}
        </PlaylistContext.Provider>
    )
}

export const usePlaylists = () => {
    const context = useContext(PlaylistContext)
    if (!context) {
        throw new Error('usePlaylists must be used within PlaylistProvider')
    }
    return context
}