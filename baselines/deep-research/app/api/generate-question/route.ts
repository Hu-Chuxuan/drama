import { NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { generateWithModel } from '@/lib/models'
import { reportContentRatelimit } from '@/lib/redis'
//for cost estimation
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";
import { addCost, getTotalCost } from '@/app/api/costTracker';
import { add } from 'date-fns';


export async function POST(request: Request) {
  try {
    const { report, platformModel } = await request.json()
    const platform = platformModel.split('__')[0]

    if (CONFIG.rateLimits.enabled && platform !== 'ollama') {
      const { success } = await reportContentRatelimit.limit(
        'agentOptimizations'
      )
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )
      }
    }

    if (!report) {
      return NextResponse.json({ error: 'Report is required' }, { status: 400 })
    }

    const prompt = `Based on the following research report, generate 3 focused search terms or phrases for further research. These should be concise keywords or phrases that would help explore important aspects not fully covered in the current report.

Report Title: ${report.title}
Summary: ${report.summary}

Key Sections:
${report.sections
  ?.map(
    (section: { title: string; content: string }) =>
      `${section.title}: ${section.content}`
  )
  .join('\n')}

Generate exactly 3 search terms and return them in the following JSON format:
{
  "searchTerms": [
    "first search term",
    "second search term",
    "third search term"
  ]
}

The search terms should be specific and focused on unexplored aspects of the topic.`

    try {
      const response = await generateWithModel(prompt, platformModel)

      //Cost calculation
      const encoding = new Tiktoken(o200k_base);
      const tokens = encoding.encode(prompt).length;
      const cost = 0.0000025 * tokens;
      console.log("Encoded token length:", tokens);
      console.log("Generate question cost: ", 0.0000025 * tokens);
      addCost(cost);


      if (!response) {
        throw new Error('No response from model')
      }

      try {
        // Parse the JSON response
        const jsonResponse = JSON.parse(response)
        if (
          !Array.isArray(jsonResponse.searchTerms) ||
          jsonResponse.searchTerms.length !== 3
        ) {
          throw new Error('Invalid search terms format')
        }

        return NextResponse.json({ searchTerms: jsonResponse.searchTerms })
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError)
        // Fallback to line-based parsing if JSON parsing fails
        const searchTerms = response
          .split('\n')
          .map((term) => term.trim())
          .filter(
            (term) =>
              term.length > 0 && !term.includes('{') && !term.includes('}')
          )
          .slice(0, 3)

        return NextResponse.json({ searchTerms })
      }
    } catch (error) {
      console.error('Model generation error:', error)
      return NextResponse.json(
        { error: 'Failed to generate search terms' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Search terms generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate search terms' },
      { status: 500 }
    )
  }
}
