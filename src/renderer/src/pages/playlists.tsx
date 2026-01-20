import React, { useState } from 'react'
import { usePlaylists } from '../contexts/PlaylistContext'
import { PlusIcon, TrashIcon, Pencil1Icon, ImageIcon } from '@radix-ui/react-icons'

interface PlaylistsProps {
  onPlaylistClick: (playlistId: string) => void
}

const Playlists: React.FC<PlaylistsProps> = ({onPlaylistClick}) => {
    const { playlists, createPlaylist, deletePlaylist, renamePlaylist, setPlaylistCover } = usePlaylists()
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [playlistToDelete, setPlaylistToDelete] = useState<{id: string, name: string} | null>(null)
    const [newPlaylistName, setNewPlaylistName] = useState('')
    const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [hoveredPlaylistId, setHoveredPlaylistId] = useState<string | null>(null)

    const handleCreatePlaylist = async () => {
        if (newPlaylistName.trim()){
            await createPlaylist(newPlaylistName.trim())
            setNewPlaylistName('')
            setShowCreateModal(false)
        }
    }

    const handleRenamePlaylist = async (id:string) => {
        if (editingName.trim()){
            await renamePlaylist(id, editingName.trim())
            setEditingPlaylistId(null)
            setEditingName('')
        }
    }

    const startEditing = (id:string, currentName: string) => {
        setEditingPlaylistId(id)
        setEditingName(currentName)
    }

    const confirmDelete = (id: string, name: string) => {
      setPlaylistToDelete({id,name})
      setShowDeleteModal(true)
    }

    const handleDeletePlaylist = async () => {
      if (playlistToDelete){
        await deletePlaylist(playlistToDelete.id)
        setShowDeleteModal(false)
        setPlaylistToDelete(null)
      }
    }

    const handleImageUpload = async (playlistId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file){
        const reader = new FileReader()
        reader.onload = async (event) => {
          const base64 = event.target?.result as string
          await setPlaylistCover(playlistId, base64)
        }
        reader.readAsDataURL(file)
      }
    }

    return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: 0 }}>Your Playlists</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            background: '#1db954',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#1ed760'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1db954'}
        >
          <PlusIcon width={16} height={16} /> Create Playlist
        </button>
      </div>

      {/* New playlist modal */}
      {showCreateModal && (
        <div style={{
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
        onClick={() => setShowCreateModal(false)}
        >
          <div 
            style={{
              background: '#282828',
              padding: '30px',
              borderRadius: '8px',
              minWidth: '400px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>Create new playlist</h2>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreatePlaylist()
                }
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#121212',
                border: '1px solid #404040',
                borderRadius: '4px',
                color: 'white',
                fontSize: '14px',
                marginBottom: '20px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
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
                onClick={handleCreatePlaylist}
                style={{
                  padding: '10px 24px',
                  background: '#1db954',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Playlist Modal */}
      {showDeleteModal && playlistToDelete && (
        <div style={{
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
        onClick={() => setShowDeleteModal(false)}
        >
          <div 
            style={{
              background: '#282828',
              padding: '30px',
              borderRadius: '8px',
              minWidth: '400px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>Delete playlist</h2>
            <p style={{ color: '#b3b3b3', marginBottom: '24px' }}>
              Are you sure you want to delete "<strong>{playlistToDelete.name}</strong>"? 
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
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
                onClick={handleDeletePlaylist}
                style={{
                  padding: '10px 24px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlists list */}
      {playlists.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#b3b3b3'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            You don't have any playlists yet
          </p>
          <p>Create your first playlist to organize your music!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => onPlaylistClick(playlist.id)}
              style={{
                background: '#181818',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#282828'
                setHoveredPlaylistId(playlist.id)
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#181818'
                setHoveredPlaylistId(null)
              }}
            >
              {/* Cover with image upload button */}
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: '#282828',
                borderRadius: '8px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {playlist.coverImage ? (
                  <img 
                    src={playlist.coverImage} 
                    alt={playlist.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  '🎵'
                )}

                {/* Button for changing image - shows on hover */}
                <label 
                  htmlFor={`cover-${playlist.id}`}
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    padding: '8px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: hoveredPlaylistId === playlist.id ? 1 : 0,
                    transition: 'opacity 0.2s'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ImageIcon width={16} height={16} color="white" />
                </label>
                <input
                  id={`cover-${playlist.id}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(playlist.id, e)}
                  style={{ display: 'none' }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Playlist name */}
              {editingPlaylistId === playlist.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRenamePlaylist(playlist.id)
                    }
                  }}
                  onBlur={() => handleRenamePlaylist(playlist.id)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '4px',
                    background: '#121212',
                    border: '1px solid #1db954',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}
                />
              ) : (
                <div style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  marginBottom: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {playlist.name}
                </div>
              )}

              <div style={{
                color: '#b3b3b3',
                fontSize: '14px',
                marginBottom: '12px'
              }}>
                {playlist.tracks.length} song{playlist.tracks.length !== 1 ? 's' : ''}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    startEditing(playlist.id, playlist.name)
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid #404040',
                    borderRadius: '16px',
                    color: '#b3b3b3',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ffffff'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#404040'}
                >
                  <Pencil1Icon width={12} height={12} /> Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    confirmDelete(playlist.id, playlist.name)
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    border: '1px solid #404040',
                    borderRadius: '16px',
                    color: '#b3b3b3',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ff4444'
                    e.currentTarget.style.color = '#ff4444'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#404040'
                    e.currentTarget.style.color = '#b3b3b3'
                  }}
                >
                  <TrashIcon width={12} height={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Playlists