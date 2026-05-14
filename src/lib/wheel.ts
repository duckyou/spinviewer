type WeightedItem = {
  weight: number
}

export function pickRandomItem(items: string[], random = Math.random): string {
  return items[Math.floor(random() * items.length)]
}

export function pickWeightedItem<T extends WeightedItem>(items: T[], random = Math.random): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let threshold = random() * totalWeight

  for (const item of items) {
    threshold -= item.weight

    if (threshold <= 0) {
      return item
    }
  }

  return items[items.length - 1]
}

export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state += 0x6d2b79f5

    let next = Math.imul(state ^ (state >>> 15), state | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

export function computeSpinRotation(
  currentRotation: number,
  targetIndex: number,
  itemCount: number,
  extraTurns = 5,
  sliceOffset = 0,
): number {
  const slice = 360 / itemCount
  const targetAngle = targetIndex * slice + slice / 2 + sliceOffset
  const currentMod = normalizeDegrees(currentRotation)
  const targetMod = normalizeDegrees(360 - targetAngle)
  const delta = normalizeDegrees(targetMod - currentMod)

  return currentRotation + extraTurns * 360 + delta
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360
}
