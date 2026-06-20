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

Write this week's issue. You MUST structure your response using these exact markers, each on its own line, with nothing else on that line:

[SECTION:GREETING]
[SECTION:GREETING]
Write a 2-3 line greeting to open this week's issue for Namrata. Sound like a thoughtful friend who keeps up with architecture and is excited to share something interesting — not romantic, not overly familiar, no pet names like "dear" or "babu". Keep it warm but grounded, like a text from a friend, not a love letter. Reference something timely (the week, the season, or what's coming up in the issue) to make it feel fresh.

[SECTION:NEWS]
Write 150-200 words about one genuinely current architecture/urban design story relevant to her interests. Reference a real recent project or development. Explain it like you're catching up a smart friend who's been busy. Use the tone specified above.

[SECTION:CONCEPT]
Pick one architectural concept, movement, or theory that connects to what's happening in the field right now. Briefly explain what it is, where it came from, and why it matters today. 150 words max.

[SECTION:WORD]
One architectural term she should know or be reintroduced to. Format exactly like this:
Term: [word]
What it means: [one conversational sentence]
Used in a sentence: [example showing it in real context]
Why it matters now: [one sentence connecting to current trends]

[END]

CRITICAL RULES:
- Do not write any text before [SECTION:GREETING]
- Do not write any text after [END]
- Do not use any markdown formatting whatsoever. No hashtags, no asterisks, no bold, no headers. Plain text only.
- No bullet points except in Word of the Day section
- Keep total under 500 words`

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
    console.log('FULL RESPONSE:', JSON.stringify(data))
    if (!data.candidates || !data.candidates[0]) {
       console.error('Gemini error:', data)
       return Response.json({ success: false, error: 'Gemini is busy right now, try again in a minute' }, { status: 503 })
}
    const generated = data.candidates[0].content.parts[0].text
    console.log('GEMINI OUTPUT:', generated)

    // Parse sections here
    // Strip any markdown that sneaks through here
	const stripMarkdown = (text) => text
 	 .replace(/#{1,6}\s/g, '')
  	.replace(/\*\*(.*?)\*\*/g, '$1')
  	.replace(/\*(.*?)\*/g, '$1')
  	.replace(/__(.*?)__/g, '$1')
  	.replace(/^---+$/gm, '')
  	.replace(/^\[SECTION:[A-Z]+\]/gm, '')
  	.trim()


	const newsContent = stripMarkdown(generated.split('[SECTION:NEWS]')[1]?.split('[SECTION:CONCEPT]')[0] || '')
	const conceptContent = stripMarkdown(generated.split('[SECTION:CONCEPT]')[1]?.split('[SECTION:WORD]')[0] || '')
	const wordContent = stripMarkdown(generated.split('[SECTION:WORD]')[1] || '')
	const greetingContent = stripMarkdown(generated.split('[SECTION:GREETING]')[1]?.split('[SECTION:NEWS]')[0] || '')

    // Save to Supabase
    const { data: issue, error } = await supabase
      .from('issues')
      .insert({
	greeting_content: greetingContent,
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