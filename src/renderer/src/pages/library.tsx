import { useState, useEffect} from 'react'

import MusicImporter  from "@renderer/components/MusicImporter";
import { MusicTrack } from "@renderer/types/electron";
import { useAudio } from '../contexts/AudioContext'

function Library(): React.JSX.Element {
    const [tracks, setTracks] = useState<MusicTrack[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { play, setPlaylist, currentTrack } = useAudio()

    useEffect(() => {
        loadLibrary()
    }, [])

    useEffect(() => {
      setPlaylist(tracks)
    }, [tracks])

    const loadLibrary = async () => {
        setIsLoading(true)
        try {
            const savedTracks = await window.electronAPI.loadLibrary()
            setTracks(savedTracks)
        } catch (error){
            console.error('Error while loading', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleImport = async (newTracks: MusicTrack[]) => {
        // Filter dupes
        const existingPaths = new Set(tracks.map(t => t.path))
        const uniqueNewTracks = newTracks.filter(t => !existingPaths.has(t.path))

        const updatedTracks = [...tracks, ...uniqueNewTracks]
        setTracks(updatedTracks)
        
        // Automatically save
        const result = await window.electronAPI.saveLibrary(updatedTracks)
        if (result.success){
            console.log(`${uniqueNewTracks.length} songs added and saved`)
        } else {
            console.error('Error while saving', result.error)
        }
    }

    const handleRemove = async (trackPath: string) => {
        const result = await window.electronAPI.removeTrack(trackPath)
        if (result.success && result.tracks) {
            setTracks(result.tracks)
            console.log('Deleted song')
        }else {
            console.error('Error while deleting song', result.error)
        }
    }

    // convert cover buffer into image
    const getCoverImage = (cover?: Buffer) => {
        if (!cover) return null
        
        const base64 = btoa(
            new Uint8Array(cover as any).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
            )
        )
        return `data:image/jpeg;base64,${base64}`
    }

    if (isLoading){
        return ( 
            <div>
                <h1>My Library</h1>
                <p>Loading...</p>
            </div>
        )
    }

    return (
    <div>
      <h1>My Library</h1>
      
      <div style={{ marginTop: '20px', marginBottom: '30px' }}>
        <MusicImporter onImport={handleImport} />
      </div>

      {/* Song List */}
      <div>
        <h2 style={{ marginBottom: '16px', color: '#b3b3b3' }}>
          {tracks.length} song{tracks.length > 1 ? 's' : ''}
        </h2>
        
        {tracks.length === 0 ? (
          <p style={{ color: '#b3b3b3', textAlign: 'center', marginTop: '40px' }}>
            No song yet here
            <br />
            Import music to fill this list!
          </p>
        ) : (
          tracks.map((track, index) => (
            <div
              key={track.path}
              onClick={() => play(track)}
              style={{
                padding: '12px 16px',
                background: '#181818',
                borderRadius: '4px',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'background 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#282828'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#181818'}
            >
              {/* Index */}
              <div style={{ width: '30px', color: '#b3b3b3', fontSize: '14px' }}>
                {currentTrack?.path === track.path && '▶'}
                {currentTrack?.path !== track.path && (index + 1)}
              </div>

              {/* Cover Image */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '4px',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#282828',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getCoverImage(track.cover) ? (
                  <img 
                    src={getCoverImage(track.cover)!} 
                    alt={track.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '24px' }}>🎵</span>
                )}
              </div>

              {/* Song Infos */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '400', marginBottom: '4px' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: '14px', color: '#b3b3b3' }}>
                  {track.artist}
                </div>
              </div>

              {/* Album */}
              <div style={{ flex: 1, fontSize: '14px', color: '#b3b3b3' }}>
                {track.album}
              </div>

              {/* Duration */}
              <div style={{ color: '#b3b3b3', fontSize: '14px', width: '50px', textAlign: 'right' }}>
                {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, '0')}
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(track.path)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#b3b3b3',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px 8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ff4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#b3b3b3'}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Library