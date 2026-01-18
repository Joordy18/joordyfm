import React from 'react'
import { useAudio } from '../contexts/AudioContext'

const Player: React.FC = () => {
    const {
        currentTrack, 
        isPlaying, 
        currentTime, 
        duration, 
        volume,
        pause, 
        resume, 
        seek, 
        setVolume,
        next,
        previous,
        repeatMode,
        toggleRepeatMode,
    } = useAudio()

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds/60)
        const secs = Math.floor(seconds%60)
        return `${mins}:${String(secs).padStart(2, '0')}`
    }

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        seek(percentage*duration)
    }

    const getRepeatIcon = () => {
        switch (repeatMode) {
            case 'no-repeat':
                return '↻'
            case 'repeat-all':
                return '🔁'
            case 'repeat-one':
                return '🔂'
            default:
                return '↻'
        }
    }

    const getRepeatColor = () => {
        return repeatMode === 'no-repeat' ? '#b3b3b3' : '#1db954'
    }

    if (!currentTrack){
        return null
    }

    return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '90px',
      background: '#181818',
      borderTop: '1px solid #282828',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      zIndex: 1000
    }}>
      {/* Song Info */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        minWidth: '180px',
        width: '30%'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: '#282828',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          🎵
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ 
            fontWeight: '400', 
            fontSize: '14px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentTrack.title}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#b3b3b3',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {currentTrack.artist}
          </div>
        </div>
      </div>

      {/* Central controls */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '722px'
      }}>
        {/* Control buttons */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
            onClick={toggleRepeatMode}
            title={
              repeatMode === 'no-repeat' 
                ? 'No repeat' 
                : repeatMode === 'repeat-all' 
                ? 'Repeat all' 
                : 'Repeat one'
            }
            style={{
              background: 'transparent',
              border: 'none',
              color: getRepeatColor(),
              cursor: 'pointer',
              fontSize: '20px',
              padding: '8px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (repeatMode === 'no-repeat') {
                e.currentTarget.style.color = '#ffffff'
              }
            }}
            onMouseLeave={(e) => e.currentTarget.style.color = getRepeatColor()}
          >
            {getRepeatIcon()}
          </button>
          <button
            onClick={previous}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b3b3b3',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
          >
            ⏮
          </button>

          <button
            onClick={isPlaying ? pause : resume}
            style={{
              background: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button
            onClick={next}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b3b3b3',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
          >
            ⏭
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          width: '100%'
        }}>
          <span style={{ fontSize: '12px', color: '#b3b3b3', minWidth: '40px' }}>
            {formatTime(currentTime)}
          </span>
          
          <div
            onClick={handleProgressClick}
            style={{
              flex: 1,
              height: '4px',
              background: '#4d4d4d',
              borderRadius: '2px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${(currentTime / duration) * 100}%`,
              background: '#1db954',
              borderRadius: '2px',
              transition: 'width 0.1s'
            }} />
          </div>

          <span style={{ fontSize: '12px', color: '#b3b3b3', minWidth: '40px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume Control */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        minWidth: '125px',
        width: '30%',
        justifyContent: 'flex-end'
      }}>
        <span style={{ fontSize: '16px' }}>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          style={{
            width: '100px',
            cursor: 'pointer'
          }}
        />
      </div>
    </div>
  )
}

export default Player