'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Flashcards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('learning')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    async function fetchCards() {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError('Could not load flashcards.')
      } else {
        setCards(data || [])
      }
      setLoading(false)
    }
    fetchCards()
  }, [])

  const learningCards = cards.filter(c => c.status !== 'known')
  const knownCards = cards.filter(c => c.status === 'known')
  const deck = activeTab === 'learning' ? learningCards : knownCards
  const currentCard = deck[currentIndex]

  function switchTab(tab) {
    setActiveTab(tab)
    setCurrentIndex(0)
    setRevealed(false)
  }

  function goPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setRevealed(false)
    }
  }

  function goNext() {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setRevealed(false)
    }
  }

  async function toggleStatus(newStatus) {
    if (!currentCard) return
    const cardId = currentCard.id

    setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: newStatus } : c))

    const { error } = await supabase
      .from('flashcards')
      .update({ status: newStatus })
      .eq('id', cardId)

    if (error) {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: newStatus === 'known' ? 'learning' : 'known' } : c))
      setError('Could not update status. Please try again.')
      return
    }

    setRevealed(false)
    if (currentIndex >= deck.length - 1) {
      setCurrentIndex(Math.max(0, deck.length - 2))
    }
  }

  return (
    <div className="px-4 py-6 sm:px-5 sm:py-8 lg:px-16 lg:py-16 max-w-2xl mx-auto">
      <div className="mb-6 pb-6 border-b border-stone-200">
        <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-stone-800 mb-1">Flashcards</h1>
        <p className="text-sm text-stone-400">Terms from past issues</p>
      </div>

      <div className="flex gap-2 mb-6 sm:mb-8">
        <button
          onClick={() => switchTab('learning')}
          className={`text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full transition-colors ${
            activeTab === 'learning'
              ? 'bg-stone-800 text-white'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          Learning ({learningCards.length})
        </button>
        <button
          onClick={() => switchTab('known')}
          className={`text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full transition-colors ${
            activeTab === 'known'
              ? 'bg-stone-800 text-white'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          Known ({knownCards.length})
        </button>
      </div>

      {loading && (
        <div className="text-stone-400 text-sm animate-pulse">Loading flashcards...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm mb-6">
          {error}
        </div>
      )}

      {!loading && cards.length === 0 && !error && (
        <p className="text-stone-400 text-sm">No flashcards yet.</p>
      )}

      {!loading && cards.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="bg-stone-100 rounded-xl px-2 py-3 sm:px-4 sm:py-4 text-center">
              <div className="text-lg sm:text-2xl font-semibold text-stone-800">{cards.length}</div>
              <div className="text-[10px] sm:text-xs text-stone-500 mt-1">Total cards</div>
            </div>
            <div className="bg-stone-100 rounded-xl px-2 py-3 sm:px-4 sm:py-4 text-center">
              <div className="text-lg sm:text-2xl font-semibold text-emerald-700">{knownCards.length}</div>
              <div className="text-[10px] sm:text-xs text-stone-500 mt-1">Known</div>
            </div>
            <div className="bg-stone-100 rounded-xl px-2 py-3 sm:px-4 sm:py-4 text-center">
              <div className="text-lg sm:text-2xl font-semibold text-amber-700">{learningCards.length}</div>
              <div className="text-[10px] sm:text-xs text-stone-500 mt-1">Learning</div>
            </div>
          </div>

          {deck.length === 0 ? (
            <p className="text-stone-400 text-sm">No cards in this section.</p>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-stone-200 px-4 py-6 sm:px-6 sm:py-8 mb-5 sm:mb-6 min-h-[260px] sm:min-h-[280px] flex flex-col">
                <span className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-3 sm:mb-4">
                  {currentCard.type || 'Word'}
                </span>

                <h2 className="text-lg sm:text-xl font-medium text-stone-800 mb-5 sm:mb-6 break-words">
                  {currentCard.term}
                </h2>

                {!revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    className="self-start text-sm px-4 py-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                  >
                    Tap to reveal answer
                  </button>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <span className="text-xs font-medium uppercase tracking-widest text-stone-400 block mb-2">
                        Definition
                      </span>
                      <p className="text-stone-700 text-sm leading-relaxed">
                        {currentCard.definition}
                      </p>
                    </div>

                    {currentCard.example_sentence && (
                      <div className="mb-6">
                        <span className="text-xs font-medium uppercase tracking-widest text-stone-400 block mb-2">
                          Example
                        </span>
                        <p className="text-stone-500 text-sm leading-relaxed italic">
                          {currentCard.example_sentence}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-auto pt-2">
                      {currentCard.status === 'known' ? (
                        <button
                          onClick={() => toggleStatus('learning')}
                          className="text-sm px-4 py-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                        >
                          Revisit Later
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleStatus('known')}
                          className="text-sm px-4 py-2 rounded-full bg-stone-800 text-white hover:bg-stone-700 transition-colors"
                        >
                          Got it
                        </button>
                      )}

                      {currentCard.issue_id && (
                        <Link
                          href={`/archive/${currentCard.issue_id}`}
                          className="text-sm px-4 py-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
                        >
                          View issue
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={goPrevious}
                  disabled={currentIndex === 0}
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  ← Previous
                </button>
                <span className="text-xs text-stone-400 whitespace-nowrap">
                  {currentIndex + 1} / {deck.length}
                </span>
                <button
                  onClick={goNext}
                  disabled={currentIndex >= deck.length - 1}
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}