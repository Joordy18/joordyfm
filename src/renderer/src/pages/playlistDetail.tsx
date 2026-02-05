import React, { useState } from 'react'
import { usePlaylists } from '../contexts/PlaylistContext'
import { useAudio } from '../contexts/AudioContext'
import { MusicTrack, YouTubeTrack, Track } from '../types/electron'
import {
  ArrowLeftIcon,
  PlayIcon,
  TrashIcon,
  DragHandleDots2Icon,
  PlusIcon
} from '@radix-ui/react-icons'

interface PlaylistDetailProps {
  playlistId: string
  onBack: () => void
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({ playlistId, onBack }) => {
  const { getPlaylist, removeTrackFromPlaylist, reorderTracks } = usePlaylists()
  const { play, setPlaylist: setAudioPlaylist } = useAudio()
  const playlist = getPlaylist(playlistId)

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  if (!playlist) {
    return (
      <div>
        <h1>Playlist not found</h1>
        <button onClick={onBack}>Go back</button>
      </div>
    )
  }

  const getTrackId = (track: Track) => {
    const type = track.type || 'local'
    return type === 'local' ? (track as MusicTrack).path : (track as YouTubeTrack).id
  }

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      setAudioPlaylist(playlist.tracks)
      play(playlist.tracks[0])
    }
  }

  const handlePlayTrack = (track: Track) => {
    setAudioPlaylist(playlist.tracks)
    play(track)
  }

  const handleRemoveTrack = async (trackId: string) => {
    await removeTrackFromPlaylist(playlistId, trackId)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.effectAllowed = 'move'

    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index)
    }
  }

  const handleDrop = async (e: React.DragEvent, index: number) => {
    e.preventDefault()

    if (draggedIndex !== null && draggedIndex !== index) {
      await reorderTracks(playlistId, draggedIndex, index)
    }

    setDraggedIndex(null)
    setDropTargetIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDropTargetIndex(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            color: '#b3b3b3',
            border: '1px solid #404040',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#404040'}
        >
          <ArrowLeftIcon width={16} height={16} /> Back
        </button>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
          {/* Cover */}
          <div style={{
            width: '232px',
            height: '232px',
            background: '#282828',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '80px',
            flexShrink: 0,
            boxShadow: '0 4px 60px rgba(0,0,0,0.5)'
          }}>
            {playlist.coverImage ? (
              <img
                src={playlist.coverImage}
                alt={playlist.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px'
                }}
              />
            ) : (
              '🎵'
            )}
          </div>

          {/* Info */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              Playlist
            </div>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '900',
              margin: '0 0 24px 0',
              lineHeight: '1'
            }}>
              {playlist.name}
            </h1>
            <div style={{ color: '#b3b3b3', fontSize: '14px' }}>
              {playlist.tracks.length} song{playlist.tracks.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        <button
          onClick={handlePlayAll}
          disabled={playlist.tracks.length === 0}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: playlist.tracks.length === 0 ? '#404040' : '#1db954',
            border: 'none',
            cursor: playlist.tracks.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.1s'
          }}
          onMouseEnter={(e) => {
            if (playlist.tracks.length > 0) {
              e.currentTarget.style.transform = 'scale(1.06)'
            }
          }}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <PlayIcon width={24} height={24} color="#000000" />
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            color: '#b3b3b3',
            border: '1px solid #404040',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
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
          <PlusIcon width={16} height={16} /> Add songs
        </button>
      </div>

      {/* Modal for draggin songs */}
      {showAddModal && (
        <AddSongsModal
          playlistId={playlistId}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Tracks list */}
      {playlist.tracks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#b3b3b3'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            This playlist is empty
          </p>
          <p>Add some songs to get started!</p>
        </div>
      ) : (
        <div>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '50px 40px 1fr 1fr 100px 50px',
            gap: '16px',
            padding: '8px 16px',
            borderBottom: '1px solid #282828',
            color: '#b3b3b3',
            fontSize: '12px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            <div></div>
            <div>#</div>
            <div>TITLE</div>
            <div>ALBUM</div>
            <div style={{ textAlign: 'right' }}>DURATION</div>
            <div></div>
          </div>

          {/* Tracks */}
          {playlist.tracks.map((track, index) => {
            const trackId = getTrackId(track)

            return (
              <div
                key={trackId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => handlePlayTrack(track)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '50px 40px 1fr 1fr 100px 50px',
                  gap: '16px',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: draggedIndex === index ? 'grabbing' : 'pointer',
                  transition: 'background 0.2s',
                  background: draggedIndex === index
                    ? '#404040'
                    : dropTargetIndex === index
                      ? '#1a1a1a'
                      : 'transparent',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  borderTop: dropTargetIndex === index && draggedIndex !== null && draggedIndex < index
                    ? '2px solid #1db954'
                    : 'none',
                  borderBottom: dropTargetIndex === index && draggedIndex !== null && draggedIndex > index
                    ? '2px solid #1db954'
                    : 'none'
                }}
                onMouseEnter={(e) => {
                  if (draggedIndex === null) {
                    e.currentTarget.style.background = '#282828'
                  }
                }}
                onMouseLeave={(e) => {
                  if (draggedIndex !== index && dropTargetIndex !== index) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {/* Drag handle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: '#b3b3b3',
                    cursor: 'grab'
                  }}
                >
                  <DragHandleDots2Icon width={20} height={20} />
                </div>

                {/* Index */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#b3b3b3',
                  fontSize: '14px'
                }}>
                  {index + 1}
                </div>

                {/* Title & Artist */}
                <div
                  onClick={() => handlePlayTrack(track)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                  <div style={{
                    fontWeight: '400',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {track.title}
                  </div>
                  {/* Artist/Channel */}
                  <div style={{
                    fontSize: '14px',
                    color: '#b3b3b3',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {(track.type || 'local') === 'local' ? (track as MusicTrack).artist : (track as YouTubeTrack).channel}
                    {(track.type && track.type !== 'local') && (
                      <span style={{ color: '#1db954', marginLeft: '4px', fontSize: '10px', border: '1px solid #1db954', padding: '0 4px', borderRadius: '4px' }}>
                        {track.type === 'youtube-stream' ? 'STREAM' : 'DL'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Album */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#b3b3b3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {(track.type || 'local') === 'local' ? (track as MusicTrack).album : (track as YouTubeTrack).channel}
                </div>

                {/* Duration */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  color: '#b3b3b3',
                  fontSize: '14px'
                }}>
                  {formatTime(track.duration)}
                </div>

                {/* Delete button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveTrack(trackId)
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#b3b3b3',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ff4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const AddSongsModal: React.FC<{ playlistId: string; onClose: () => void }> = ({
  playlistId,
  onClose
}) => {
  const [libraryTracks, setLibraryTracks] = useState<MusicTrack[]>([])
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set())
  const { addTracksToPlaylist, getPlaylist } = usePlaylists()
  const playlist = getPlaylist(playlistId)

  React.useEffect(() => {
    loadLibrary()
  }, [])

  const loadLibrary = async () => {
    try {
      const tracks = await window.electronAPI.loadLibrary()

      const playlistTrackPaths = new Set(
        playlist?.tracks
          .filter(t => t.type === 'local')
          .map(t => (t as MusicTrack).path) || []
      )
      const availableTracks = tracks.filter(t => !playlistTrackPaths.has(t.path))
      setLibraryTracks(availableTracks)
    } catch (error) {
      console.error('Error loading library', error)
    }
  }

  const toggleTrack = (trackPath: string) => {
    const newSelected = new Set(selectedTracks)
    if (newSelected.has(trackPath)) {
      newSelected.delete(trackPath)
    } else {
      newSelected.add(trackPath)
    }
    setSelectedTracks(newSelected)
  }

  const handleAddTracks = async () => {
    const tracksToAdd: MusicTrack[] = []

    for (const trackPath of selectedTracks) {
      const track = libraryTracks.find(t => t.path === trackPath)
      if (track) {
        tracksToAdd.push(track)
      }
    }

    if (tracksToAdd.length > 0) {
      await addTracksToPlaylist(playlistId, tracksToAdd)
    }

    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#282828',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #404040'
        }}>
          <h2 style={{ margin: '0 0 8px 0' }}>Add songs to playlist</h2>
          <p style={{ margin: 0, color: '#b3b3b3', fontSize: '14px' }}>
            {selectedTracks.size} song{selectedTracks.size !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px'
        }}>
          {libraryTracks.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#b3b3b3'
            }}>
              No songs available to add
            </div>
          ) : (
            libraryTracks.map((track) => (
              <div
                key={track.path}
                onClick={() => toggleTrack(track.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: selectedTracks.has(track.path) ? '#1a1a1a' : 'transparent',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!selectedTracks.has(track.path)) {
                    e.currentTarget.style.background = '#1a1a1a'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedTracks.has(track.path)) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${selectedTracks.has(track.path) ? '#1db954' : '#b3b3b3'}`,
                  borderRadius: '4px',
                  background: selectedTracks.has(track.path) ? '#1db954' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {selectedTracks.has(track.path) && (
                    <span style={{ color: 'black', fontWeight: 'bold', fontSize: '14px' }}>✓</span>
                  )}
                </div>

                {/* Track info */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontWeight: '400',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
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
                    {track.artist} • {track.album}
                  </div>
                </div>

                {/* Duration */}
                <div style={{
                  color: '#b3b3b3',
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  {formatTime(track.duration)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #404040',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: 'transparent',
              color: '#b3b3b3',
              border: '1px solid #404040',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAddTracks}
            disabled={selectedTracks.size === 0}
            style={{
              padding: '10px 24px',
              background: selectedTracks.size === 0 ? '#404040' : '#1db954',
              color: selectedTracks.size === 0 ? '#6a6a6a' : 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: selectedTracks.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Add {selectedTracks.size > 0 && `(${selectedTracks.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}


export default PlaylistDetail