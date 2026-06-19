'use client'
import { useState } from 'react'

export default function Home() {
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function generateIssue() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setIssue(data.issue)
      } else {
        setError(data.error)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-light tracking-tight text-stone-800 mb-1">Na(m)ka</h1>
        <p className="text-sm text-stone-400">Your weekly architecture digest</p>
      </div>

      {!issue && (
        <button
          onClick={generateIssue}
          disabled={loading}
          className="bg-stone-800 text-white px-6 py-3 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating your issue...' : 'Generate this week\'s issue'}
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-4">{error}</p>
      )}

      {issue && (
        <div className="space-y-8">
          <div className="border-b border-stone-200 pb-8">
            <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">Current Affairs</h2>
            <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{issue.news_content}</p>
          </div>

          <div className="border-b border-stone-200 pb-8">
            <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">Concept of the Week</h2>
            <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{issue.concept_content}</p>
          </div>

          <div className="pb-8">
            <h2 className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-4">Word of the Day</h2>
            <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{issue.word_content}</p>
          </div>

          <div className="flex gap-4 pt-4 border-t border-stone-200">
            <button
              onClick={() => window.print()}
              className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
            >
              Print / Save as PDF
            </button>
            <button
              onClick={() => setIssue(null)}
              className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
            >
              Generate another
            </button>
          </div>
        </div>
      )}
    </main>
  )
}