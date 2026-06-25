'use client'
import { useState } from 'react'

const NEWS_LABELS = ["What's happening:", "The case for it:", "The criticism:", "The numbers:", "In India:"]
const CONCEPT_LABELS = ["What it is:", "Where it came from:", "Why it matters now:"]
const TECH_LABELS = ["What it is:", "What it changes:", "Worth knowing:"]
const WORD_LABELS = ["Term:", "What it means:", "Used in a sentence:", "Why it matters now:"]

function splitTitleAndBody(text) {
  const lines = text?.split('\n').filter(Boolean) || []
  return { title: lines[0] || '', body: lines.slice(1).join('\n') }
}

function parseLabeledDivisions(text, labels) {
  if (!text) return []
  const escaped = labels.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g')
  const parts = text.split(pattern).map(p => p.trim()).filter(Boolean)
  const segments = []
  for (let i = 0; i < parts.length; i++) {
    if (labels.includes(parts[i])) {
      segments.push({ label: parts[i], content: parts[i + 1] || '' })
      i++
    }
  }
  return segments.length > 0 ? segments : [{ label: '', content: text }]
}

function BulletedContent({ text }) {
  if (!text) return null
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const isBullet = line.startsWith('-')
        const content = isBullet ? line.replace(/^-\s*/, '') : line

        // Split into label (up to and including first colon) and the rest
        const colonIndex = content.indexOf(':')
        const label = colonIndex !== -1 ? content.slice(0, colonIndex + 1) : ''
        const rest = colonIndex !== -1 ? content.slice(colonIndex + 1) : content

        return (
          <li
            key={i}
            className={`text-stone-700 leading-relaxed text-[14px] ${isBullet ? 'pl-4 relative before:content-["•"] before:absolute before:left-0 before:text-stone-400' : 'list-none'}`}
          >
            {label && <span className="font-semibold text-stone-800">{label}</span>}
            {rest}
          </li>
        )
      })}
    </ul>
  )
}

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

  const news = splitTitleAndBody(issue?.news_content)
  const concept = splitTitleAndBody(issue?.concept_content)
  const tech = splitTitleAndBody(issue?.tech_content)

return (
    <div className="px-5 py-8 lg:px-20 lg:py-16 max-w-2xl mx-auto">
          <div className="mb-10 pb-6 border-b border-stone-200">
            <h1 className="text-3xl font-light tracking-tight text-stone-800 mb-1">Na(m)ka</h1>
            <p className="text-sm text-stone-400">Your daily architecture digest</p>
          </div>

          {!issue && !loading && (
            <button
              onClick={generateIssue}
              className="bg-stone-800 text-white px-6 py-3 rounded-lg text-sm hover:bg-stone-700 transition-colors"
            >
              Generate today's issue
            </button>
          )}

          {loading && (
            <div className="text-stone-400 text-sm animate-pulse">Curating today's issue...</div>
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
                {news.title && (
                  <h3 className="text-stone-800 font-medium text-lg mb-3 leading-snug">{news.title}</h3>
                )}
               <BulletedContent text={news.body} />
              </section>

              <section className="mb-10 pb-10 border-b border-stone-200">
                <h2 className="text-xs font-medium uppercase tracking-widest text-emerald-700 mb-4">Concept of the Day</h2>
                {concept.title && (
                  <h3 className="text-stone-800 font-medium text-lg mb-3 leading-snug">{concept.title}</h3>
                )}
                <BulletedContent text={concept.body} />
              </section>

              <section className="mb-10 pb-10 border-b border-stone-200">
                <h2 className="text-xs font-medium uppercase tracking-widest text-sky-700 mb-4">Tech &amp; Architecture</h2>
                {tech.title && (
                  <h3 className="text-stone-800 font-medium text-lg mb-3 leading-snug">{tech.title}</h3>
                )}
                <BulletedContent text={tech.body} />
              </section>

              <section className="mb-10">
                <h2 className="text-xs font-medium uppercase tracking-widest text-indigo-700 mb-4">Word of the Day</h2>
                <BulletedContent text={issue.word_content} />
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
        </div>
  )
}