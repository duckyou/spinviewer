export type WheelMode = 0 | 1

export type WheelQueryState = {
  mode: WheelMode
  items: string[]
  autoStart: boolean
  randomSeed: number | null
  speed: number
}

export type WheelCandidate = {
  name: string
  weight: number
  raw: string
}

const DEFAULT_MODE: WheelMode = 0
const DEFAULT_SPEED = 1
export const FALLBACK_ITEMS = ['alice', 'bob', 'carol', 'dave']
const MINIMUM_ITEMS = 2

export function parseWheelQuery(search: string): Partial<WheelQueryState> {
  const params = new URLSearchParams(search)
  const rawQuery = params.get('q')?.trim()

  if (!rawQuery) {
    return {}
  }

  const parsed: Partial<WheelQueryState> = {}

  for (const segment of rawQuery.split(';')) {
    const [rawKey, ...rawValueParts] = segment.split(':')
    const key = rawKey?.trim()
    const value = rawValueParts.join(':').trim()

    if (!key || !value) {
      continue
    }

    if (key === 'm') {
      parsed.mode = value === '1' ? 1 : 0
      continue
    }

    if (key === 'l') {
      parsed.items = normalizeWheelItems(value.split(','))
      continue
    }

    if (key === 'a') {
      parsed.autoStart = value === '1'
      continue
    }

    if (key === 'r') {
      if (!/^-?\d+$/.test(value)) {
        continue
      }

      const parsedSeed = Number.parseInt(value, 10)

      if (Number.isSafeInteger(parsedSeed)) {
        parsed.randomSeed = parsedSeed
      }

      continue
    }

    if (key === 's') {
      const parsedSpeed = Number.parseFloat(value)

      if (Number.isFinite(parsedSpeed) && parsedSpeed > 0) {
        parsed.speed = parsedSpeed
      }
    }
  }

  return parsed
}

export function resolveWheelQuery(search: string): WheelQueryState {
  const parsed = parseWheelQuery(search)
  const items = normalizeWheelItems(parsed.items ?? [])

  return {
    mode: parsed.mode ?? DEFAULT_MODE,
    items: items.length >= MINIMUM_ITEMS ? items : FALLBACK_ITEMS,
    autoStart: parsed.autoStart ?? false,
    randomSeed: parsed.randomSeed ?? null,
    speed: parsed.speed ?? DEFAULT_SPEED,
  }
}

export function parseItemInput(input: string): string[] {
  return normalizeWheelItems(input.split(/[\n,]+/))
}

export function parseWheelCandidates(items: string[]): WheelCandidate[] {
  const candidates = new Map<string, WheelCandidate>()

  for (const item of items) {
    const candidate = parseWheelCandidate(item)

    if (!candidate) {
      continue
    }

    candidates.set(candidate.name, candidate)
  }

  return [...candidates.values()]
}

export function serializeWheelQuery(state: WheelQueryState): string {
  const parts = [`l:${state.items.join(',')}`]

  if (state.mode !== DEFAULT_MODE) {
    parts.unshift(`m:${state.mode}`)
  }

  if (state.autoStart) {
    parts.push('a:1')
  }

  if (state.randomSeed !== null) {
    parts.push(`r:${state.randomSeed}`)
  }

  if (state.speed !== DEFAULT_SPEED) {
    parts.push(`s:${state.speed}`)
  }

  return parts.join(';')
}

export function hasEnoughItems(items: string[]): boolean {
  return items.length >= MINIMUM_ITEMS
}

function normalizeWheelItems(items: string[]): string[] {
  const uniqueItems = new Map<string, string>()

  for (const item of items) {
    const candidate = parseWheelCandidate(item)

    if (!candidate) {
      continue
    }

    uniqueItems.set(candidate.name, candidate.raw)
  }

  return [...uniqueItems.values()]
}

function parseWheelCandidate(rawItem: string): WheelCandidate | null {
  const normalizedItem = rawItem.trim()

  if (!normalizedItem) {
    return null
  }

  const match = normalizedItem.match(/^(.*?)(?:\*(\d+(?:\.\d+)?))?$/)
  const rawName = match?.[1]?.trim() ?? normalizedItem

  if (!rawName) {
    return null
  }

  const parsedWeight = match?.[2] ? Number.parseFloat(match[2]) : 1
  const weight = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 1
  const raw = weight === 1 ? rawName : `${rawName}*${weight}`

  return {
    name: rawName,
    weight,
    raw,
  }
}
