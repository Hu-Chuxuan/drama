import { NextResponse } from 'next/server'
import { reportContentRatelimit } from '@/lib/redis'
import { type Article, type ModelVariant } from '@/types'
import { CONFIG } from '@/lib/config'
import { extractAndParseJSON } from '@/lib/utils'
import { generateWithModel } from '@/lib/models'
//for cost estimation
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";
import { addCost, getTotalCost, resetCost } from '@/app/api/costTracker';
import fs from 'fs';
import { get } from 'http'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      selectedResults,
      sources,
      prompt,
      platformModel = 'google-gemini-flash',
    } = body as {
      selectedResults: Article[]
      sources: any[]
      prompt: string
      platformModel: ModelVariant
    }

    // Only check rate limit if enabled and not using Ollama (local model)
    const platform = platformModel.split('__')[0]
    const model = platformModel.split('__')[1]
    if (CONFIG.rateLimits.enabled && platform !== 'ollama') {
      const { success } = await reportContentRatelimit.limit('report')
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )
      }
    }

    // Check if selected platform is enabled
    const platformConfig =
      CONFIG.platforms[platform as keyof typeof CONFIG.platforms]
    if (!platformConfig?.enabled) {
      return NextResponse.json(
        { error: `${platform} platform is not enabled` },
        { status: 400 }
      )
    }

    // Check if selected model exists and is enabled
    const modelConfig = (platformConfig as any).models[model]
    if (!modelConfig) {
      return NextResponse.json(
        { error: `${model} model does not exist` },
        { status: 400 }
      )
    }
    if (!modelConfig.enabled) {
      return NextResponse.json(
        { error: `${model} model is disabled` },
        { status: 400 }
      )
    }

    const generateSystemPrompt = (articles: Article[], userPrompt: string, userQuery: string) => {
      console.log("here is the query" + userQuery);
      return `You are a research assistant tasked with creating a comprehensive report based on multiple sources. 
The report should specifically address this request: "${userPrompt}"

Your report should:
1. Have a clear title that reflects the specific analysis requested
2. Begin with a concise executive summary
3. Be organized into relevant sections based on the analysis requested
4. Use markdown formatting for emphasis, lists, and structure
5. Use citations ONLY when necessary for specific claims, statistics, direct quotes, or important facts
6. Maintain objectivity while addressing the specific aspects requested in the prompt
7. Compare and contrast the information from sources, noting areas of consensus or points of contention
8. Showcase key insights, important data, or innovative ideas

Here are the source articles to analyze (numbered for citation purposes):

${articles
  .map(
    (article, index) => `
[${index + 1}] Title: ${article.title}
URL: ${article.url}
Content: ${article.content}

Here is the query the user entered: ${userQuery}
---
`
  )
  .join('\n')}

Format the report as a JSON object with the following structure:
{
  "title": "Report title",
  "result" : "The result of the executed python snippet generated. Ensure if the user query is a statement, the output is TRUE or FALSE. Otherwise, the output should be the answer to the user query if it is a question, shortened to a few words",
  "summary": "Executive summary (can include markdown)",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content with markdown formatting and selective citations"
    }
  ],
  "data" : "Data table in csv format with all data relevant to the analysis (ensure no spaces between commas)",
  "code" : "Python code snippet that follows the rules below",
  "usedSources": [1, 2] // Array of source numbers that were actually cited in the report
}

CODE REQUIREMENTS:
- You must use pandas to load the created data file (assume its called data.csv)
- Once the df is loaded, write subsequent code to answer the user query directly
  - If the user query is a question, wrap the code around a function answer_question(df) and validate_statement(df) otherwise
- Do not include any comments in generated code

Use markdown formatting in the content to improve readability:
- Use **bold** for emphasis
- Use bullet points and numbered lists where appropriate
- Use headings and subheadings with # syntax
- Include code blocks if relevant
- Use > for quotations
- Use --- for horizontal rules where appropriate

CITATION GUIDELINES:
1. Only use citations when truly necessary - specifically for:
   - Direct quotes from sources
   - Specific statistics, figures, or data points
   - Non-obvious facts or claims that need verification
   - Controversial statements
   
2. DO NOT use citations for:
   - General knowledge
   - Your own analysis or synthesis of information
   - Widely accepted facts
   - Every sentence or paragraph

3. When needed, use superscript citation numbers in square brackets [¹], [²], etc. at the end of the relevant sentence
   
4. The citation numbers correspond directly to the source numbers provided in the list
   
5. Be judicious and selective with citations - a well-written report should flow naturally with citations only where they truly add credibility

6. You DO NOT need to cite every source provided. Only cite the sources that contain information directly relevant to the report. Track which sources you actually cite and include their numbers in the "usedSources" array in the output JSON.

7. It's completely fine if some sources aren't cited at all - this means they weren't needed for the specific analysis requested.`
    }
    const query = await fs.promises.readFile('../../prompts.log', 'utf8')
    const systemPrompt = generateSystemPrompt(selectedResults, prompt, query)

    // console.log('Sending prompt to model:', systemPrompt)
    console.log('Model:', model)

    try {
      const response = await generateWithModel(systemPrompt, platformModel)
      //Cost calculation
      const encoding = new Tiktoken(o200k_base);
      const tokens = encoding.encode(systemPrompt).length;
      const cost = 0.0000025 * tokens;
      addCost(cost);
      console.log("Encoded token length:", tokens);
      console.log("Generate report cost: ", cost);

      if (!response) {
        throw new Error('No response from model')
      }

      try {
        const reportData = extractAndParseJSON(response)
        // Add sources to the report data
        reportData.sources = sources
        reportData.cost = getTotalCost()
        console.log('Parsed report data:', reportData)
        const timestamp = Date.now()
        fs.writeFileSync(`output/report-${timestamp}.json`, JSON.stringify(reportData, null, 2))
        resetCost()
        return NextResponse.json(reportData)
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        return NextResponse.json(
          { error: 'Failed to parse report format' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Model generation error:', error)
      return NextResponse.json(
        { error: 'Failed to generate report content' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
