import React, { useState } from 'react'
import { usePlaylists } from '../contexts/PlaylistContext'
import { useAudio } from '../contexts/AudioContext'
import { MusicTrack } from '../types/electron'
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

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({playlistId, onBack}) => {
    const { getPlaylist, removeTrackFromPlaylist } = usePlaylists()
    const { play, setPlaylist: setAudioPlaylist } = useAudio()
    const playlist = getPlaylist(playlistId)

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)

    if (!playlist){
        return (
            <div>
                <h1>Playlist not found</h1>
                <button onClick={onBack}>Go back</button>
            </div>
        )
    }

    const handlePlayAll = () => {
        if (playlist.tracks.length > 0){
            setAudioPlaylist(playlist.tracks)
            play(playlist.tracks[0])
        }
    }

    const handlePlayTrack = (track: MusicTrack) => {
        setAudioPlaylist(playlist.tracks)
        play(track)
    }

    const handleRemoveTrack = async (trackPath: string) => {
        await removeTrackFromPlaylist(playlistId, trackPath)
    }

    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        setDropTargetIndex(index)
    }

    const handleDragEnd = () => {
        if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex){
            // TODO: Implémenter la réorganisation (prochaine étape)
            console.log(`Move track from ${draggedIndex} to ${dropTargetIndex}`)
        }
        setDraggedIndex(null)
        setDropTargetIndex(null)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds/60)
        const secs = Math.floor(seconds%60)
        return `${mins}${String(secs).padStart(2, '0')}`
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
          {playlist.tracks.map((track, index) => (
            <div
              key={track.path}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handlePlayTrack(track)}
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 40px 1fr 1fr 100px 50px',
                gap: '16px',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background 0.2s',
                background: draggedIndex === index 
                  ? '#282828' 
                  : dropTargetIndex === index 
                  ? '#1a1a1a' 
                  : 'transparent',
                opacity: draggedIndex === index ? 0.5 : 1
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#282828'}
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
                onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
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
              <div style={{ 
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
                <div style={{ 
                  fontSize: '14px', 
                  color: '#b3b3b3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {track.artist}
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
                {track.album}
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
                    handleRemoveTrack(track.path)
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
          ))}
        </div>
      )}
    </div>
  )
}

export default PlaylistDetail