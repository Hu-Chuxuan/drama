import { NextResponse } from 'next/server'
import { reportContentRatelimit } from '@/lib/redis'
import { CONFIG } from '@/lib/config'
import { extractAndParseJSON } from '@/lib/utils'
import { generateWithModel } from '@/lib/models'
import { type ModelVariant } from '@/types'
//for cost estimation
import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";
import { addCost, getTotalCost } from '@/app/api/costTracker';
import { promises as fs } from 'fs'

export async function POST(request: Request) {
  try {
    const { prompt, platformModel = 'google__gemini-flash' } =
      (await request.json()) as {
        prompt: string
        platformModel: ModelVariant
      }
    await fs.writeFile('../../prompts.log', `${prompt}\n`)
    if (!prompt) {
      console.log("reached1")
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Return test results for test queries
    if (prompt.toLowerCase() === 'test') {
      return NextResponse.json({
        query: 'test',
        optimizedPrompt:
          'Analyze and compare different research methodologies, focusing on scientific rigor, peer review processes, and validation techniques',
        explanation: 'Test optimization strategy',
        suggestedStructure: [
          'Test Structure 1',
          'Test Structure 2',
          'Test Structure 3',
        ],
      })
    }

    // Only check rate limit if enabled and not using Ollama (local model)
    const platform = platformModel.split('__')[0]
    const model = platformModel.split('__')[1]
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

    // Check if selected platform is enabled
    const platformConfig =
      CONFIG.platforms[platform as keyof typeof CONFIG.platforms]
    if (!platformConfig?.enabled) {
      console.log("reached2")
      console.log(platform)
      return NextResponse.json(
        { error: `${platform} platform is not enabled` },
        { status: 400 }
      )
    }

    // Check if selected model exists and is enabled
    const modelConfig = (platformConfig as any).models[model]
    console.log(model)
    if (!modelConfig) {
      console.log("reached3")
      return NextResponse.json(
        { error: `${model} model does not exist` },
        { status: 400 }
      )
    }
    if (!modelConfig.enabled) {
      console.log("reached4")
      return NextResponse.json(
        { error: `${model} model is disabled` },
        { status: 400 }
      )
    }

    const systemPrompt = `You are a research assistant tasked with optimizing a research topic into an effective search query.

Given this research topic: "${prompt}"

Your task is to:
1. Generate ONE optimized search query that will help gather comprehensive information
2. Create an optimized research prompt that will guide the final report generation
3. Suggest a logical structure for organizing the research

The query should:
- Cover the core aspects of the topic
- Use relevant technical terms and synonyms
- Be specific enough to return high-quality results
- Be comprehensive yet concise

Format your response as a JSON object with this structure:
{
  "query": "the optimized search query",
  "optimizedPrompt": "The refined research prompt that will guide report generation",
  "explanation": "Brief explanation of the optimization strategy",
  "suggestedStructure": [
    "Key aspect 1 to cover",
    "Key aspect 2 to cover",
    "Key aspect 3 to cover"
  ]
}

Make the query clear and focused, avoiding overly complex or lengthy constructions.`

    try {
      const response = await generateWithModel(systemPrompt, platformModel)
      //Cost calculation
      const encoding = new Tiktoken(o200k_base);
      const tokens = encoding.encode(systemPrompt).length;
      const cost = 0.0000025 * tokens;
      addCost(cost);
      console.log("Encoded token length:", tokens);
      console.log("Optimize research cost: ", 0.0000025 * tokens);

      if (!response) {
        throw new Error('No response from model')
      }

      try {
        const parsedResponse = extractAndParseJSON(response)
        return NextResponse.json(parsedResponse)
      } catch (parseError) {
        console.error('Failed to parse optimization:', parseError)
        return NextResponse.json(
          { error: 'Failed to optimize research' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('Model generation error:', error)
      return NextResponse.json(
        { error: 'Failed to generate optimization' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Research optimization failed:', error)
    return NextResponse.json(
      { error: 'Failed to optimize research' },
      { status: 500 }
    )
  }
}
