import React, { useState } from 'react'
import { YouTubeTrack } from '../types/electron'
import { useAudio } from '../contexts/AudioContext'
import {
  MagnifyingGlassIcon,
  PlayIcon,
  DownloadIcon,
  CheckCircledIcon,
  Cross2Icon,
  PlusIcon
} from '@radix-ui/react-icons'
import { usePlaylists } from '../contexts/PlaylistContext'
import { MusicTrack } from '../types/electron'

const YouTube: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<YouTubeTrack[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const [downloadedTracks, setDownloadedTracks] = useState<YouTubeTrack[]>([])

  // Playlist Modal State
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [trackToAdd, setTrackToAdd] = useState<YouTubeTrack | null>(null)

  const { play, setPlaylist } = useAudio()
  const { playlists, addTrackToPlaylist } = usePlaylists()

  // Charger les tracks téléchargés au démarrage
  React.useEffect(() => {
    loadDownloadedTracks()
  }, [])

  const loadDownloadedTracks = async () => {
    try {
      const tracks = await window.electronAPI.loadYouTubeTracks()
      setDownloadedTracks(tracks)
    } catch (error) {
      console.error('Error loading downloaded tracks:', error)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await window.electronAPI.searchYouTube(searchQuery.trim())

      // Marquer les tracks déjà téléchargés
      const downloadedIds = new Set(downloadedTracks.map(t => t.id))
      const updatedResults = results.map(track => ({
        ...track,
        isDownloaded: downloadedIds.has(track.id),
        localPath: downloadedTracks.find(t => t.id === track.id)?.localPath
      }))

      setSearchResults(updatedResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleStream = (track: YouTubeTrack) => {
    const streamTrack: YouTubeTrack = {
      ...track,
      type: 'youtube-stream'
    }
    setPlaylist([streamTrack])
    play(streamTrack)
  }

  const handleDownload = async (track: YouTubeTrack) => {
    setDownloadingIds(prev => new Set(prev).add(track.id))

    try {
      const result = await window.electronAPI.downloadYouTube(track.id)

      if (result.success && result.localPath) {
        // Créer le track téléchargé
        const downloadedTrack: YouTubeTrack = {
          ...track,
          isDownloaded: true,
          localPath: result.localPath,
          type: 'youtube-downloaded'
        }

        // Mettre à jour la liste des tracks téléchargés
        const updatedDownloaded = [...downloadedTracks, downloadedTrack]
        setDownloadedTracks(updatedDownloaded)

        // Sauvegarder
        await window.electronAPI.saveYouTubeTracks(updatedDownloaded)

        // Mettre à jour les résultats de recherche
        setSearchResults(prev => prev.map(t =>
          t.id === track.id
            ? { ...t, isDownloaded: true, localPath: result.localPath }
            : t
        ))

        console.log('Download complete:', track.title)

        // Sync with Library
        try {
          const metadata = await window.electronAPI.getMusicMetadata(result.localPath)
          if (metadata) {
            const currentLibrary = await window.electronAPI.loadLibrary()
            if (!currentLibrary.some((t: MusicTrack) => t.path === metadata.path)) {
              const newLibrary = [...currentLibrary, metadata]
              await window.electronAPI.saveLibrary(newLibrary)
            }
          }
        } catch (libError) {
          console.error('Error adding to library:', libError)
        }

      } else {
        console.error('Download failed:', result.error)
        alert(`Download failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('An error occurred during download')
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(track.id)
        return newSet
      })
    }
  }

  const openPlaylistModal = (track: YouTubeTrack) => {
    setTrackToAdd(track)
    setShowPlaylistModal(true)
  }

  const handleAddToPlaylist = async (playlistId: string) => {
    if (trackToAdd) {
      const track: YouTubeTrack = {
        ...trackToAdd,
        type: 'youtube-stream'
      }
      await addTrackToPlaylist(playlistId, track)
      setShowPlaylistModal(false)
      setTrackToAdd(null)
    }
  }

  const handlePlayDownloaded = (track: YouTubeTrack) => {
    const downloadedTrack: YouTubeTrack = {
      ...track,
      type: 'youtube-downloaded'
    }
    setPlaylist(downloadedTracks)
    play(downloadedTrack)
  }

  const handleDeleteDownload = async (track: YouTubeTrack) => {
    if (!confirm(`Delete "${track.title}" from downloads?`)) return

    try {
      const result = await window.electronAPI.deleteYouTubeDownload(track.id)

      if (result.success) {
        // Retirer des téléchargements
        const updatedDownloaded = downloadedTracks.filter(t => t.id !== track.id)
        setDownloadedTracks(updatedDownloaded)

        // Sauvegarder
        await window.electronAPI.saveYouTubeTracks(updatedDownloaded)

        // Mettre à jour les résultats si nécessaire
        setSearchResults(prev => prev.map(t =>
          t.id === track.id
            ? { ...t, isDownloaded: false, localPath: undefined }
            : t
        ))

        console.log('Download deleted:', track.title)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete download')
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div>
      {/* Header with search */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ margin: '0 0 24px 0' }}>Search Music</h1>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <MagnifyingGlassIcon
              width={20}
              height={20}
              style={{
                position: 'absolute',
                left: '16px',
                color: '#b3b3b3'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for songs, artists, or albums..."
              style={{
                width: '100%',
                padding: '14px 16px 14px 48px',
                background: '#242424',
                border: '2px solid transparent',
                borderRadius: '24px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#ffffff'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'transparent'}
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            style={{
              padding: '14px 32px',
              background: isSearching || !searchQuery.trim() ? '#404040' : '#1db954',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              cursor: isSearching || !searchQuery.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              minWidth: '120px'
            }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>



      {/* Search results */}
      {searchResults.length > 0 && (
        <div>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
            Results for "{searchQuery}"
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {searchResults.map((track) => {
              const isDownloading = downloadingIds.has(track.id)

              return (
                <div
                  key={track.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    background: '#181818',
                    borderRadius: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#282828'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#181818'}
                >
                  {/* Thumbnail */}
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}
                  />

                  {/* Info */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontWeight: '500',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '4px'
                    }}>
                      {track.title}
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#b3b3b3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {track.channel}
                    </div>
                  </div>

                  {/* Duration */}
                  <div style={{
                    color: '#b3b3b3',
                    fontSize: '14px',
                    minWidth: '50px',
                    textAlign: 'right'
                  }}>
                    {formatDuration(track.duration)}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleStream(track)}
                      style={{
                        padding: '10px 20px',
                        background: 'transparent',
                        color: '#b3b3b3',
                        border: '1px solid #404040',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ffffff'
                        e.currentTarget.style.color = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#404040'
                        e.currentTarget.style.color = '#b3b3b3'
                      }}
                    >
                      <PlayIcon width={16} height={16} /> Stream
                    </button>

                    {/* Add to Playlist Button */}
                    <button
                      onClick={() => openPlaylistModal(track)}
                      style={{
                        padding: '10px',
                        background: 'transparent',
                        color: '#b3b3b3',
                        border: '1px solid #404040',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Add to playlist"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ffffff'
                        e.currentTarget.style.color = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#404040'
                        e.currentTarget.style.color = '#b3b3b3'
                      }}
                    >
                      <PlusIcon width={16} height={16} />
                    </button>

                    {track.isDownloaded ? (
                      <button
                        disabled
                        style={{
                          padding: '10px 20px',
                          background: '#1db954',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'not-allowed',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: 0.7
                        }}
                      >
                        <CheckCircledIcon width={16} height={16} /> Downloaded
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownload(track)}
                        disabled={isDownloading}
                        style={{
                          padding: '10px 20px',
                          background: isDownloading ? '#404040' : '#1db954',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: isDownloading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <DownloadIcon width={16} height={16} />
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {searchResults.length === 0 && !isSearching && searchQuery && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#b3b3b3'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
            No results found for "{searchQuery}"
          </p>
          <p>Try searching with different keywords</p>
        </div>
      )}

      {/* Initial state */}
      {searchResults.length === 0 && !searchQuery && downloadedTracks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#b3b3b3'
        }}>
          <MagnifyingGlassIcon width={48} height={48} style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
            Search for music on YouTube
          </p>
          <p>Stream instantly or download for offline listening</p>
        </div>
      )}

      {/* Playlist Selection Modal */}
      {showPlaylistModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={() => setShowPlaylistModal(false)}>
          <div style={{
            background: '#282828',
            borderRadius: '8px',
            width: '400px',
            maxHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #404040', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Add to Playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
                <Cross2Icon width={20} height={20} />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 0' }}>
              {playlists.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#b3b3b3' }}>
                  No playlists found
                </div>
              ) : (
                playlists.map(playlist => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 20px',
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#3e3e3e'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#181818',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px'
                    }}>
                      {playlist.coverImage ? (
                        <img src={playlist.coverImage} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                      ) : '🎵'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{playlist.name}</div>
                      <div style={{ fontSize: '12px', color: '#b3b3b3' }}>{playlist.tracks.length} songs</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default YouTube