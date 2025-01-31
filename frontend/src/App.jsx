import { useState, useEffect } from 'react'
import { Upload, ImageIcon, Trash2 } from 'lucide-react'
import { Button } from './components/Button'

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [convertedUrl, setConvertedUrl] = useState(null)
  const [targetFormat, setTargetFormat] = useState('jpeg')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/history')
      const data = await response.json()
      setHistory(data)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setConvertedUrl(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleConvert = async () => {
    if (!selectedFile) return

    setLoading(true)
    const formData = new FormData()
    formData.append('image', selectedFile)
    formData.append('targetFormat', targetFormat)

    try {
      const response = await fetch('http://localhost:5000/api/convert', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()

      if (result.success && result.convertedImage) {
        setConvertedUrl(`http://localhost:5000${result.convertedImage}`)
        fetchHistory()
      } else {
        throw new Error(result.error || 'Conversion failed')
      }
    } catch (error) {
      console.error('Failed to convert image:', error)
      alert('Failed to convert image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/images/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        fetchHistory()
      } else {
        throw new Error(result.error || 'Deletion failed')
      }
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('Failed to delete image')
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Image Converter</h1>
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600">
                Drag and drop your image here or click to select
              </p>
            </label>
          </div>

          {previewUrl && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Original Image:</h3>
              <div className="relative h-48 w-full">
                <img
                  src={previewUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="w-40 rounded-md border border-gray-300 p-2"
            >
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>

            <Button
              onClick={handleConvert}
              disabled={!selectedFile || loading}
              className="flex-1"
            >
              {loading ? 'Converting...' : 'Convert'}
            </Button>
          </div>

          {convertedUrl && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Converted Image:</h3>
              <div className="relative h-48 w-full mb-4">
                <img
                  src={convertedUrl || "/placeholder.svg"}
                  alt="Converted"
                  className="h-full w-full object-contain rounded-lg"
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(convertedUrl)}
              >
                Download Converted Image
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Conversion History</h2>
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                  <div>
                    <p className="font-medium">{item.originalName}</p>
                    <p className="text-sm text-gray-500">
                      Converted to {item.format.toUpperCase()} • {formatSize(item.size)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item._id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-center text-gray-500">
                No conversion history yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App