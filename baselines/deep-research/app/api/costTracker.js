import fs from 'fs'
import path from 'path'

const COST_FILE_PATH = 'output/cost.json'

function getStoredCost() {
  try {
    const raw = fs.readFileSync(COST_FILE_PATH, 'utf-8')
    const data = JSON.parse(raw)
    return data.totalCost ?? 0
  } catch {
    return 0
  }
}

function saveCost(cost) {
  const json = JSON.stringify({ totalCost: cost }, null, 2)
  fs.writeFileSync(COST_FILE_PATH, json, 'utf-8')
}

export function addCost(amount) {
  const current = getStoredCost()
  const updated = current + amount
  saveCost(updated)
}

export function getTotalCost() {
  return getStoredCost()
}

export function resetCost() {
  saveCost(0)
}