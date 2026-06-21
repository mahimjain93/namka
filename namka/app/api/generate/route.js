import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Get persona
    const { data: persona, error: personaError } = await supabase
      .from('persona')
      .select('*')
      .single()

    if (personaError || !persona) {
      console.error('Persona fetch error:', personaError)
      return Response.json({ success: false, error: 'Could not load persona from Supabase' }, { status: 500 })
    }

    // Get active sources
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)

    if (sourcesError || !sources) {
      console.error('Sources fetch error:', sourcesError)
      return Response.json({ success: false, error: 'Could not load sources from Supabase' }, { status: 500 })
    }

    // Get past issues to avoid repetition
    const { data: pastIssues, error: pastIssuesError } = await supabase
      .from('issues')
      .select('news_content, concept_content, tech_content, word_content')
      .order('created_at', { ascending: false })
      .limit(8)

    if (pastIssuesError) {
      console.error('Past issues fetch error:', pastIssuesError)
    }

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
Write a 1-2 line greeting to open this week's issue for Namrata. Sound like a thoughtful friend who keeps up with architecture and is excited to share something interesting — not romantic, not overly familiar, no pet names like "dear" or "babu". Keep it warm but grounded, like a text from a friend, not a love letter. Reference something timely (the week, the season, or what's coming up in the issue) to make it feel fresh.

[SECTION:NEWS]
Write a short headline (under 10 words, written like a real news headline) on its own line.
Then cover one genuinely current architecture or urban design story as a bulleted list. Each bullet starts on its own line with a hyphen and a short bold-style label followed by its content (150-200 words total, keep it precise):

- What's happening: name the real project, organization, or people involved
- The case for it: the stated benefits or positive arguments, with specifics
- The criticism: genuine debate, limitations, or concerns — do not skip this even if the story seems positive
- The numbers: concrete data — costs, scale, dates, percentages, whatever is available
- In India: how this connects to or is adopted in India, with named examples — if there is genuinely no India angle, say so briefly rather than forcing one

Write like a knowledgeable colleague briefing her on what is actually happening, not a feel-good narrative. Do not end with an inspirational or sentimental closing line.

[SECTION:CONCEPT]
Pick one architectural concept, movement, or theory connected to current developments in the field. Write its name on its own line as a short title. Then explain it as a bulleted list, each bullet on its own line starting with a hyphen and a short label (100 words max):

- What it is: a clear, grounded explanation
- Where it came from: origin, history, who developed or popularized it
- Why it matters now: connection to current trends with specifics — names, examples, data; include any genuine debate or critique here

Do not end with an inspirational or sentimental closing line.

[SECTION:TECH]
Write about one current development at the intersection of technology and architecture. Default to AI in architecture and design — new tools, real workflows, studies, or how firms are actually using it — since that is the main interest here. Periodically (not every issue) you may instead cover a notable current development in BIM, Rhino, or parametric/computational design tools.
Write a short title for the development on its own line. Then explain it as a bulleted list, each bullet on its own line starting with a hyphen and a short label (150 words max):

- What it is: the real tool or development, named specifically
- What it changes: how it affects the way architects actually work, with concrete details — who is using it, adoption data, real examples
- Worth knowing: any genuine limitation, risk, or debate if relevant — otherwise, why it is on her radar

Do not end with an inspirational or sentimental closing line.

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
- Use bullet points (hyphens) only for the labeled divisions described above; no other bullet points or markdown
- Keep total under 700 words`

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
	const conceptContent = stripMarkdown(generated.split('[SECTION:CONCEPT]')[1]?.split('[SECTION:TECH]')[0] || '')
	const techContent = stripMarkdown(generated.split('[SECTION:TECH]')[1]?.split('[SECTION:WORD]')[0] || '')
	const wordContent = stripMarkdown(generated.split('[SECTION:WORD]')[1] || '')
	const greetingContent = stripMarkdown(generated.split('[SECTION:GREETING]')[1]?.split('[SECTION:NEWS]')[0] || '')

    // Save to Supabase
    const { data: issue, error } = await supabase
      .from('issues')
      .insert({
	greeting_content: greetingContent,
        news_content: newsContent,
        concept_content: conceptContent,
        tech_content: techContent,
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