'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PlatformModel } from '@/types'
import { CONFIG } from '@/lib/config'

const DEFAULT_MODEL = 'openai__gpt-4o'

export const platformModels = Object.entries(CONFIG.platforms)
  .flatMap(([platform, config]) => {
    if (!config.enabled) return []

    return Object.entries(config.models).map(([modelId, modelConfig]) => {
      return {
        value: `${platform}__${modelId}`,
        label: `${platform.charAt(0).toUpperCase() + platform.slice(1)} - ${
          modelConfig.label
        }`,
        platform,
        disabled: !modelConfig.enabled,
      }
    })
  })
  .filter(Boolean) as (PlatformModel & { disabled: boolean })[]

interface ModelSelectProps {
  value: string
  onValueChange: (value: string) => void
  triggerClassName?: string
}

export function ModelSelect({
  value = DEFAULT_MODEL,
  onValueChange,
  triggerClassName,
}: ModelSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={platformModels.length === 0}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue
          placeholder={
            platformModels.length === 0 ? 'No models available' : 'Select model'
          }
        />
      </SelectTrigger>
      <SelectContent>
        {platformModels.map((model) => (
          <SelectItem
            key={model.value}
            value={model.value}
            disabled={model.disabled}
            className={model.disabled ? 'text-gray-400 cursor-not-allowed' : ''}
          >
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { DEFAULT_MODEL }
