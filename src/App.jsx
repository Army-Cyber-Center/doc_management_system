import React, { useState } from 'react'
import Header from './components/Header'
import StatsCards from './components/StatsCard'
import DocumentList from './components/DocumentList'
import NewDocumentForm from './components/DocumentForm'
import CameraModal from './components/CameraModal'
import FileExplorer from './components/FileExplorer'
import DocumentDetail from './components/DocumentDetail'

export default function App() {
  const [activeTab, setActiveTab] = useState('incoming')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showNewDocForm, setShowNewDocForm] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [showFileExplorer, setShowFileExplorer] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header 
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <StatsCards />
        
        <DocumentList 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setShowNewDocForm={setShowNewDocForm}
          setSelectedDoc={setSelectedDoc}
        />

        {showNewDocForm && (
          <NewDocumentForm 
            setShowNewDocForm={setShowNewDocForm}
            setShowCamera={setShowCamera}
            setShowFileExplorer={setShowFileExplorer}
          />
        )}

        {showCamera && (
          <CameraModal 
            setShowCamera={setShowCamera}
            setShowNewDocForm={setShowNewDocForm}
          />
        )}

        {showFileExplorer && (
          <FileExplorer 
            setShowFileExplorer={setShowFileExplorer}
            setShowNewDocForm={setShowNewDocForm}
          />
        )}

        {selectedDoc && (
          <DocumentDetail 
            doc={selectedDoc}
            setSelectedDoc={setSelectedDoc}
          />
        )}
      </main>
    </div>
  )
}