'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function splitTitleAndBody(text) {
  const lines = text?.split('\n').filter(Boolean) || []
  return { title: lines[0] || '', body: lines.slice(1).join('\n') }
}

function BulletedContent({ text }) {
  if (!text) return null
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const isBullet = line.startsWith('-')
        const content = isBullet ? line.replace(/^-\s*/, '') : line
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

export default function IssueDetail() {
  const { id } = useParams()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchIssue() {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setError('Could not load this issue.')
      } else {
        setIssue(data)
      }
      setLoading(false)
    }
    fetchIssue()
  }, [id])

  if (loading) return (
    <div className="px-5 py-8 lg:px-16 lg:py-16 max-w-2xl mx-auto">
      <div className="text-stone-400 text-sm animate-pulse">Loading issue...</div>
    </div>
  )

  if (error) return (
    <div className="px-5 py-8 lg:px-20 lg:py-16 max-w-2xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{error}</div>
    </div>
  )

  const issueDate = new Date(issue.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  
  function handlePrint() {
    const originalTitle = document.title
    document.title = `Namka - ${issueDate}`
    const restoreTitle = () => {
    document.title = originalTitle
    window.removeEventListener('afterprint', restoreTitle)
  }
    window.addEventListener('afterprint', restoreTitle)
    window.print()
  }

  const news = splitTitleAndBody(issue.news_content)
  const concept = splitTitleAndBody(issue.concept_content)
  const tech = splitTitleAndBody(issue.tech_content)

  return (
    <div className="px-5 py-8 lg:px-20 lg:py-16 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/archive" className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
          ← Back to archive
        </Link>
      </div>

      <div className="mb-10 pb-6 border-b border-stone-200">
        <h1 className="text-3xl font-light tracking-tight text-stone-800 mb-1">Na(m)ka</h1>
        <p className="text-xs text-stone-400 uppercase tracking-widest mt-2">{issueDate}</p>
      </div>

      {issue.greeting_content && (
        <div className="relative bg-white rounded-2xl rounded-tl-none px-5 py-4 mb-10 text-stone-600 text-[15px] leading-relaxed italic border border-stone-200 shadow-sm">
          {issue.greeting_content}
          <div className="absolute -top-2 left-0 w-3 h-3 bg-white border-l border-t border-stone-200 rotate-45"></div>
        </div>
      )}

      <section className="mb-10 pb-10 border-b border-stone-200">
        <h2 className="text-xs font-medium uppercase tracking-widest text-amber-700 mb-4">Current Affairs</h2>
        {news.title && <h3 className="text-stone-800 font-medium text-lg mb-3 leading-snug">{news.title}</h3>}
        <BulletedContent text={news.body} />
      </section>

      <section className="mb-10 pb-10 border-b border-stone-200">
        <h2 className="text-xs font-medium uppercase tracking-widest text-emerald-700 mb-4">Concept of the Day</h2>
        {concept.title && <h3 className="text-stone-800 font-medium text-lg mb-3 leading-snug">{concept.title}</h3>}
        <BulletedContent text={concept.body} />
      </section>

      <section className="mb-10 pb-10 border-b border-stone-200">
        <h2 className="text-xs font-medium uppercase tracking-widest text-sky-700 mb-4">Tech &amp; Architecture</h2>
        {tech.title && <h3 className="text-stone-800 font-medium text-lg mb-3 leading-snug">{tech.title}</h3>}
        <BulletedContent text={tech.body} />
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-medium uppercase tracking-widest text-indigo-700 mb-4">Word of the Day</h2>
        <BulletedContent text={issue.word_content} />
      </section>
      <div className="flex gap-5 pt-6 border-t border-stone-200">
        <button
          onClick={handlePrint}
          className="text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>
    </div>
  )
}