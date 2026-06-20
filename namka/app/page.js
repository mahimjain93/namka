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

  const issueDate = issue ? new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.2fr_1fr] gap-0 max-w-6xl mx-auto">

        {/* Left sidebar - empty for now, future: archive nav */}
        <aside className="hidden lg:block"></aside>

        {/* Center column - the digest */}
        <main className="px-6 py-12 lg:py-16">
          <div className="mb-10 pb-6 border-b border-stone-200">
            <h1 className="text-3xl font-light tracking-tight text-stone-800 mb-1">Na(m)ka</h1>
            <p className="text-sm text-stone-400">Your weekly architecture digest</p>
          </div>

          {!issue && !loading && (
            <button
              onClick={generateIssue}
              className="bg-stone-800 text-white px-6 py-3 rounded-lg text-sm hover:bg-stone-700 transition-colors"
            >
              Generate this week's issue
            </button>
          )}

          {loading && (
            <div className="text-stone-400 text-sm animate-pulse">Curating this week's issue...</div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {issue && (
            <div>
              {issueDate && (
                <p className="text-xs text-stone-400 mb-6 uppercase tracking-widest">{issueDate}</p>
              )}

              {issue.greeting_content && (
                <div className="relative bg-white rounded-2xl rounded-tl-none px-5 py-4 mb-10 text-stone-600 text-[15px] leading-relaxed italic border border-stone-200 shadow-sm">
                  {issue.greeting_content}
                  <div className="absolute -top-2 left-0 w-3 h-3 bg-white border-l border-t border-stone-200 rotate-45"></div>
                </div>
              )}

              <section className="mb-10 pb-10 border-b border-stone-200">
                <h2 className="text-xs font-medium uppercase tracking-widest text-amber-700 mb-4">Current Affairs</h2>
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap text-[15px]">{issue.news_content}</p>
              </section>

              <section className="mb-10 pb-10 border-b border-stone-200">
                <h2 className="text-xs font-medium uppercase tracking-widest text-emerald-700 mb-4">Concept of the Week</h2>
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap text-[15px]">{issue.concept_content}</p>
              </section>

              <section className="mb-10">
                <h2 className="text-xs font-medium uppercase tracking-widest text-indigo-700 mb-4">Word of the Day</h2>
                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap text-[15px]">{issue.word_content}</p>
              </section>

              <div className="flex gap-5 pt-6 border-t border-stone-200">
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

        {/* Right sidebar - empty for now, future: related links, flashcards */}
        <aside className="hidden lg:block"></aside>

      </div>
    </div>
  )
}