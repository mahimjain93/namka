'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Archive() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchIssues() {
      const { data, error } = await supabase
        .from('issues')
        .select('id, created_at, news_content')
        .order('created_at', { ascending: false })

      if (error) {
        setError('Could not load archive.')
      } else {
        setIssues(data || [])
      }
      setLoading(false)
    }
    fetchIssues()
  }, [])

  return (
    <div className="px-5 py-8 lg:px-16 lg:py-16 max-w-2xl mx-auto">
      <div className="mb-10 pb-6 border-b border-stone-200">
        <h1 className="text-3xl font-light tracking-tight text-stone-800 mb-1">Archive</h1>
        <p className="text-sm text-stone-400">Past issues of Na(m)ka</p>
      </div>

      {loading && (
        <div className="text-stone-400 text-sm animate-pulse">Loading archive...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && issues.length === 0 && (
        <p className="text-stone-400 text-sm">No issues yet.</p>
      )}

      {!loading && !error && issues.length > 0 && (
        <ul className="space-y-3">
          {issues.map((issue) => {
            const date = new Date(issue.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric'
            })
            const headline = issue.news_content?.split('\n').find(l => l.trim().length > 0) || 'Issue'

            return (
              <li key={issue.id}>
                <Link
                  href={`/archive/${issue.id}`}
                  className="flex items-baseline justify-between gap-4 px-4 py-3 rounded-lg hover:bg-stone-100 transition-colors group"
                >
                  <span className="text-stone-700 text-sm leading-snug group-hover:text-stone-900">
                    {headline}
                  </span>
                  <span className="text-xs text-stone-400 whitespace-nowrap">{date}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}