import { useState } from 'react'
import axios from 'axios'

export default function App() {
  const [page, setPage] = useState('pptToNotes')
  const [file, setFile] = useState(null)
  const [notes, setNotes] = useState('')
  const [text, setText] = useState('')
  const [quizInputType, setQuizInputType] = useState('ppt')
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resetState = () => {
    setError('')
    setNotes('')
    setText('')
    setQuiz(null)
    setFile(null)
  }

  async function handlePptToNotes() {
    if (!file) return setError('Please upload a .pptx file')
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post('/api/ppt-to-notes', formData)
      setNotes(res.data.notes)
    } catch (e) {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  async function handleNotesToPpt() {
    if (!text.trim()) return setError('Please enter some notes')
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('/api/notes-to-ppt', { text }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'slidenotes.pptx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (e) {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  async function handleCreateQuiz() {
    if (quizInputType === 'ppt' && !file) return setError('Please upload a .pptx file')
    if (quizInputType === 'notes' && !text.trim()) return setError('Please enter some notes')

    setError('')
    setLoading(true)
    setQuiz(null)

    try {
      let res
      if (quizInputType === 'ppt') {
        const formData = new FormData()
        formData.append('file', file)
        res = await axios.post('/api/create-quiz', formData)
      } else {
        res = await axios.post('/api/create-quiz', { text })
      }
      setQuiz(res.data.quiz)
    } catch (e) {
      setError('Something went wrong. Try again.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white p-6 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">SlideNotes <span className="text-teal-400">AI</span></h1>
        <p className="text-gray-400">Turn PowerPoints into notes. Turn notes into PowerPoints. Generate quizzes from slides or notes.</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-[#1c1e26] rounded-full p-1 flex gap-1 flex-wrap">
          <button
            onClick={() => { setPage('pptToNotes'); resetState() }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${page === 'pptToNotes' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            PPT → Notes
          </button>
          <button
            onClick={() => { setPage('notesToPpt'); resetState() }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${page === 'notesToPpt' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Notes → PPT
          </button>
          <button
            onClick={() => { setPage('quiz'); resetState() }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${page === 'quiz' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Create Quiz
          </button>
        </div>
      </div>

      {page === 'pptToNotes' ? (
        <div className="bg-[#1c1e26] rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-4">Upload a .pptx file and get structured study notes instantly.</p>
          <div
            className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-teal-500 transition-all"
            onClick={() => document.getElementById('fileInput').click()}
          >
            <p className="text-gray-400">{file ? file.name : 'Click to upload your .pptx file'}</p>
            <input
              id="fileInput"
              type="file"
              accept=".pptx"
              className="hidden"
              onChange={e => setFile(e.target.files[0])}
            />
          </div>
          <button
            onClick={handlePptToNotes}
            disabled={loading}
            className="mt-4 w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Reading slides...' : 'Generate Notes'}
          </button>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          {notes && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-400">Your notes</p>
                <button
                  onClick={() => navigator.clipboard.writeText(notes)}
                  className="text-xs text-teal-400 hover:text-teal-300"
                >Copy</button>
              </div>
              <div className="bg-[#0f1117] rounded-xl p-4 text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                {notes}
              </div>
            </div>
          )}
        </div>
      ) : page === 'notesToPpt' ? (
        <div className="bg-[#1c1e26] rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-4">Paste your notes and get a ready-to-use PowerPoint.</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your notes here..."
            className="w-full bg-[#0f1117] border border-gray-700 rounded-xl p-4 text-sm text-gray-200 h-48 resize-none outline-none focus:border-teal-500 transition-all"
          />
          <button
            onClick={handleNotesToPpt}
            disabled={loading}
            className="mt-4 w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Generating PowerPoint...' : 'Download PowerPoint'}
          </button>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      ) : (
        <div className="bg-[#1c1e26] rounded-2xl p-6">
          <p className="text-gray-400 text-sm mb-4">Generate a quiz from your PowerPoint or study notes.</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => { setQuizInputType('ppt'); setError(''); setQuiz(null) }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${quizInputType === 'ppt' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              From PPT
            </button>
            <button
              onClick={() => { setQuizInputType('notes'); setError(''); setQuiz(null) }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${quizInputType === 'notes' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              From Notes
            </button>
          </div>

          {quizInputType === 'ppt' ? (
            <div
              className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-teal-500 transition-all"
              onClick={() => document.getElementById('quizFileInput').click()}
            >
              <p className="text-gray-400">{file ? file.name : 'Click to upload your .pptx file'}</p>
              <input
                id="quizFileInput"
                type="file"
                accept=".pptx"
                className="hidden"
                onChange={e => setFile(e.target.files[0])}
              />
            </div>
          ) : (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your notes here..."
              className="w-full bg-[#0f1117] border border-gray-700 rounded-xl p-4 text-sm text-gray-200 h-48 resize-none outline-none focus:border-teal-500 transition-all"
            />
          )}

          <button
            onClick={handleCreateQuiz}
            disabled={loading}
            className="mt-4 w-full bg-teal-500 hover:bg-teal-400 text-black font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Creating quiz...' : 'Generate Quiz'}
          </button>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

          {quiz && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-400">Generated quiz</p>
                <button
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(quiz, null, 2))}
                  className="text-xs text-teal-400 hover:text-teal-300"
                >Copy JSON</button>
              </div>
              <div className="bg-[#0f1117] rounded-xl p-4 text-sm text-gray-200 leading-relaxed">
                {quiz.map((item, index) => (
                  <div key={index} className="mb-5">
                    <p className="font-semibold text-white">{index + 1}. {item.question}</p>
                    <ul className="list-disc ml-5 mt-2 space-y-1 text-gray-200">
                      {item.options.map((option, idx) => (
                        <li key={idx}>{option}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-teal-300">Answer: {item.answer}</p>
                    {item.explanation && <p className="text-gray-400">{item.explanation}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}