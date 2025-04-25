import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractAndParseJSON(response: string) {
  function cleanJson(jsonStr: string): string {
    return (
      jsonStr
        // Remove YAML pipe characters
        .replace(/\|\n/g, '\n')
        // Remove YAML block scalar indicators (> and |) after colons
        .replace(/:\s*[>|](\s*\n|\s*$)/g, ': ')
        // Clean up any remaining YAML/Markdown artifacts
        .replace(/^\s*>/gm, '')
        // Remove trailing commas before closing braces/brackets
        .replace(/,(\s*[}\]])/g, '$1')
        // Normalize multiple newlines to single newlines
        .replace(/\n\s*\n/g, '\n')
        // Remove leading/trailing whitespace in multiline strings
        .replace(/:\s*"[\s\n]+/g, ': "')
        .replace(/[\s\n]+"/g, '"')
    )
  }

  // First attempt: Try to parse the entire response as JSON
  try {
    console.log(
      'Attempt 1 - Full parse, input:',
      response.slice(0, 100) + '...'
    )
    const result = JSON.parse(response)
    console.log('Attempt 1 succeeded')
    return result
  } catch (e) {
    console.log('Attempt 1 failed:', e)
  }

  // Second attempt: Look for JSON within code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/
  const codeBlockMatch = response.match(codeBlockRegex)

  if (codeBlockMatch) {
    try {
      console.log(
        'Attempt 2 - Code block found, content:',
        codeBlockMatch[1].slice(0, 100) + '...'
      )
      const cleanedJson = cleanJson(codeBlockMatch[1])
      console.log(
        'Attempt 2 - Cleaned JSON:',
        cleanedJson.slice(0, 100) + '...'
      )
      const result = JSON.parse(cleanedJson)
      console.log('Attempt 2 succeeded')
      return result
    } catch (e) {
      console.log('Attempt 2 failed:', e)
    }
  } else {
    console.log('Attempt 2 - No code block found')
  }

  // Third attempt: Find the outermost matching braces
  console.log('Attempt 3 - Starting bracket matching')
  let bracketCount = 0
  let startIndex = -1
  let endIndex = -1
  let inString = false
  let escapeNext = false
  let foundStart = false

  for (let i = 0; i < response.length; i++) {
    // Handle string boundaries and escaped characters
    if (response[i] === '"' && !escapeNext) {
      inString = !inString
    } else if (response[i] === '\\' && !escapeNext) {
      escapeNext = true
      continue
    }

    escapeNext = false

    // Only count braces when not in a string
    if (!inString) {
      if (response[i] === '{') {
        if (bracketCount === 0) {
          startIndex = i
          foundStart = true
          console.log('Attempt 3 - Found opening brace at index:', i)
        }
        bracketCount++
      } else if (response[i] === '}') {
        bracketCount--
        if (bracketCount === 0 && foundStart) {
          endIndex = i + 1
          console.log('Attempt 3 - Found matching closing brace at index:', i)
          // Try parsing this JSON substring with cleanup
          try {
            const jsonCandidate = cleanJson(
              response.substring(startIndex, endIndex)
            )
            console.log(
              'Attempt 3 - Trying to parse substring:',
              jsonCandidate.slice(0, 100) + '...'
            )
            const result = JSON.parse(jsonCandidate)
            console.log('Attempt 3 succeeded')
            return result
          } catch (e) {
            console.log('Attempt 3 - Parse failed for this substring:', e)
            foundStart = false // Reset to keep looking
            continue
          }
        }
      }
    }
  }

  console.log('All attempts failed - Final bracket count:', bracketCount)
  throw new Error('No valid JSON found in response')
}
