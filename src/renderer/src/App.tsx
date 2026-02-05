import { useState } from 'react'
import Home from './pages/home'
import Library from './pages/library'
import Playlists from './pages/playlists'
import PlaylistDetail from './pages/playlistDetail'
import YouTube from './pages/youtube' // NOUVEAU
import Player from './components/Player'
import { AudioProvider } from './contexts/AudioContext'
import { PlaylistProvider, usePlaylists } from './contexts/PlaylistContext'
import {
  HomeIcon,
  MixerHorizontalIcon,
  ListBulletIcon,
  MagnifyingGlassIcon // NOUVEAU
} from '@radix-ui/react-icons'

type Page = 'home' | 'library' | 'playlists' | 'playlist-detail' | 'youtube' // Ajouté youtube

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const { playlists } = usePlaylists()

  const recentPlaylists = [...playlists]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5)

  const navigateToPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId)
    setCurrentPage('playlist-detail')
  }

  return (
    <div className="app-container">
      <nav className="app-sidebar">
        <button
          onClick={() => setCurrentPage('home')}
          style={{
            padding: '12px 16px',
            background: currentPage === 'home' ? '#282828' : 'transparent',
            color: currentPage === 'home' ? '#ffffff' : '#b3b3b3',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: currentPage === 'home' ? '700' : '400',
            textAlign: 'left',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <HomeIcon width={20} height={20} /> <span className="sidebar-text">Home</span>
        </button>

        {/* NOUVEAU : Bouton Search */}
        <button
          onClick={() => setCurrentPage('youtube')}
          style={{
            padding: '12px 16px',
            background: currentPage === 'youtube' ? '#282828' : 'transparent',
            color: currentPage === 'youtube' ? '#ffffff' : '#b3b3b3',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: currentPage === 'youtube' ? '700' : '400',
            textAlign: 'left',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <MagnifyingGlassIcon width={20} height={20} /> <span className="sidebar-text">Search</span>
        </button>

        <button
          onClick={() => setCurrentPage('library')}
          style={{
            padding: '12px 16px',
            background: currentPage === 'library' ? '#282828' : 'transparent',
            color: currentPage === 'library' ? '#ffffff' : '#b3b3b3',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: currentPage === 'library' ? '700' : '400',
            textAlign: 'left',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <MixerHorizontalIcon width={20} height={20} /> <span className="sidebar-text">Library</span>
        </button>

        <button
          onClick={() => setCurrentPage('playlists')}
          style={{
            padding: '12px 16px',
            background: currentPage === 'playlists' ? '#282828' : 'transparent',
            color: currentPage === 'playlists' ? '#ffffff' : '#b3b3b3',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: currentPage === 'playlists' ? '700' : '400',
            textAlign: 'left',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <ListBulletIcon width={20} height={20} /> <span className="sidebar-text">Playlists</span>
        </button>

        <div style={{
          height: '1px',
          background: '#282828',
          margin: '16px 0'
        }} />

        <div style={{
          color: '#b3b3b3',
          fontSize: '11px',
          fontWeight: '700',
          padding: '8px 16px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }} className="sidebar-text">
          Your Playlists
        </div>

        {recentPlaylists.length === 0 ? (
          <div style={{
            padding: '8px 16px',
            color: '#6a6a6a',
            fontSize: '13px'
          }}>
            <span className="sidebar-text">No playlists yet</span>
          </div>
        ) : (
          recentPlaylists.map((playlist) => (
            <button
              key={playlist.id}
              onClick={() => navigateToPlaylist(playlist.id)}
              style={{
                padding: '8px 16px',
                background: currentPage === 'playlist-detail' && selectedPlaylistId === playlist.id
                  ? '#282828'
                  : 'transparent',
                color: currentPage === 'playlist-detail' && selectedPlaylistId === playlist.id
                  ? '#ffffff'
                  : '#b3b3b3',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'left',
                transition: 'all 0.2s',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 'playlist-detail' || selectedPlaylistId !== playlist.id) {
                  e.currentTarget.style.background = '#1a1a1a'
                  e.currentTarget.style.color = '#ffffff'
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'playlist-detail' || selectedPlaylistId !== playlist.id) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#b3b3b3'
                }
              }}
            >
              <span className="sidebar-text">{playlist.name}</span>
            </button>
          ))
        )}
      </nav>

      <main className="app-main">
        {currentPage === 'home' && <Home />}
        {currentPage === 'youtube' && <YouTube />} {/* NOUVEAU */}
        {currentPage === 'library' && <Library />}
        {currentPage === 'playlists' && <Playlists onPlaylistClick={navigateToPlaylist} />}
        {currentPage === 'playlist-detail' && selectedPlaylistId && (
          <PlaylistDetail
            playlistId={selectedPlaylistId}
            onBack={() => setCurrentPage('playlists')}
          />
        )}
      </main>
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <AudioProvider>
      <PlaylistProvider>
        <AppContent />
        <Player />
      </PlaylistProvider>
    </AudioProvider>
  )
}

export default App