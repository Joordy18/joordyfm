import { useState } from 'react'
import Home from './pages/home'
import Library from './pages/library'
import Playlists from './pages/playlists'
import Player from './components/Player'
import { AudioProvider } from './contexts/AudioContext'
import { PlaylistProvider } from './contexts/PlaylistContext'
import { HomeIcon, MixerHorizontalIcon, ListBulletIcon } from '@radix-ui/react-icons'

type Page = 'home' | 'library' | 'playlists'

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  return (
    <AudioProvider>
      <PlaylistProvider>
        <div style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden' 
        }}>
          {/* Navigation Sidebar */}
          <nav style={{
            width: '200px',
            background: '#1a1a1a',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px', 
            boxSizing: 'border-box',
            overflowY: 'auto'
          }}>
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
              <HomeIcon width={20} height={20} /> Home
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
              <MixerHorizontalIcon width={20} height={20} /> Library
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
              <ListBulletIcon width={20} height={20} /> Playlists
            </button>

              {/* Separation */}
              <div style={{
              height: '1px',
              background: '#282828',
              margin: '16px 0'
            }} />

            <div style={{
              color: '#b3b3b3',
              fontSize: '12px',
              fontWeight: '700',
              padding: '8px 16px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Your Playlists
            </div>
          </nav>

          {/* Main Content */}
          <main style={{
            flex: 1,
            padding: '24px',
            paddingBottom: '114px',
            background: '#121212',
            color: 'white',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {currentPage === 'home' && <Home />}
            {currentPage === 'library' && <Library />}
            {currentPage === 'playlists' && <Playlists />}
          </main>
        </div>
        <Player />
      </PlaylistProvider>
    </AudioProvider>
  )
}

export default App