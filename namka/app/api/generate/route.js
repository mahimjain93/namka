import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Get persona
    const { data: persona } = await supabase
      .from('persona')
      .select('*')
      .single()

    // Get active sources
    const { data: sources } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)

    // Get past issues to avoid repetition
    const { data: pastIssues } = await supabase
      .from('issues')
      .select('news_content, concept_content, word_content')
      .order('created_at', { ascending: false })
      .limit(8)

    const sourcesList = sources.map(s => `${s.name} (${s.url})`).join('\n')
    const pastTopics = pastIssues?.map(i => `${i.news_content?.slice(0, 100)}`).join('\n') || 'none yet'

    const prompt = `You are the writer of Na(m)ka — a weekly architecture digest written personally for ${persona.name}, an architect based in ${persona.location}.

Her interests: ${persona.interests}
Tools she knows: ${persona.known_tools}
Tone: ${persona.tone_notes}

Sources to draw from (search these for current news):
${sourcesList}

Topics covered in past issues (DO NOT repeat these):
${pastTopics}

Write this week's issue with exactly 3 sections:

---
CURRENT AFFAIRS
Write 150-200 words about one genuinely current architecture/urban design story relevant to her interests. Reference a real recent project or development. Explain it like you're catching up a smart friend who's been busy. Use the tone specified above.

---
CONCEPT OF THE WEEK
Pick one architectural concept, movement, or theory that connects to what's happening in the field right now. Briefly explain what it is, where it came from, and why it matters today. 150 words max.

---
WORD OF THE DAY
One architectural term she should know or be reintroduced to. Format exactly like this:
Term: [word]
What it means: [one conversational sentence]
Used in a sentence: [example showing it in real context]
Why it matters now: [one sentence connecting to current trends]
---

Keep the total under 500 words. No bullet points. Write in flowing prose except for Word of the Day.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    )

    const data = await response.json()
    const generated = data.candidates[0].content.parts[0].text

    // Parse sections
    const sections = generated.split('---').filter(s => s.trim())
    const newsContent = sections[0]?.trim() || ''
    const conceptContent = sections[1]?.trim() || ''
    const wordContent = sections[2]?.trim() || ''

    // Save to Supabase
    const { data: issue, error } = await supabase
      .from('issues')
      .insert({
        news_content: newsContent,
        concept_content: conceptContent,
        word_content: wordContent,
        sources_used: sourcesList
      })
      .select()
      .single()

    if (error) throw error

    // Save flashcard
    const wordLines = wordContent.split('\n')
    const term = wordLines.find(l => l.startsWith('Term:'))?.replace('Term:', '').trim()
    const definition = wordLines.find(l => l.startsWith('What it means:'))?.replace('What it means:', '').trim()
    const example = wordLines.find(l => l.startsWith('Used in a sentence:'))?.replace('Used in a sentence:', '').trim()

    if (term && definition) {
      await supabase.from('flashcards').insert({
        term,
        definition,
        example_sentence: example,
        type: 'word',
        status: 'learning'
      })
    }

    return Response.json({ success: true, issue })

  } catch (error) {
    console.error(error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}