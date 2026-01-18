import { useState } from 'react'
import Home from './pages/home'
import Library from './pages/library'
import Player from './components/Player'
import { AudioProvider } from './contexts/AudioContext'

type Page = 'home' | 'library'

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  return (
    <AudioProvider>
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
              padding: '10px',
              background: currentPage === 'home' ? '#1db954' : '#282828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer', 
              fontWeight: currentPage === 'home' ? '700' : '400',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentPage('library')}
            style={{
              padding: '10px',
              background: currentPage === 'library' ? '#1db954' : '#282828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer', 
              fontWeight: currentPage === 'library' ? '700' : '400',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}>
            Library
          </button>

            {/* Sub Sections */}
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
          padding: '20px',
          background: '#181818',
          color: 'white',
          overflowY: 'auto'
        }}>
          {currentPage === 'home' && <Home />}
          {currentPage === 'library' && <Library />}
        </main>
      </div>
      <Player />
    </AudioProvider>
  )
}

export default App