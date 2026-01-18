import React, { useState } from 'react'
import { MusicTrack } from '@renderer/types/electron'

const MusicImporter: React.FC<{ onImport: (tracks: MusicTrack[]) => void }> = ({ onImport }) => {
    const [isImporting, setIsImporting] = useState(false)

    const handleImport = async () => {
        setIsImporting(true)

        try {
            const filePaths = await window.electronAPI.selectMusicFiles()

            if (filePaths.length == 0){
                setIsImporting(false)
                return
            }

            const tracks: MusicTrack[] = []
            for (const filePath of filePaths){
                const metadata = await window.electronAPI.getMusicMetadata(filePath)
                if (metadata){
                    tracks.push(metadata)
                }
            }

            onImport(tracks)
        } catch (error){
            console.error('Error while importing', error)
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <button
            onClick={handleImport}
            disabled={isImporting}
            style={{
                padding: '12px 24px',
                background: '#1db954',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor: isImporting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                opacity: isImporting ? 0.6 : 1
            }}
        >
            {isImporting ? 'Importation ongoing...' : 'Manually import music'}
        </button>
    )
}

export default MusicImporter