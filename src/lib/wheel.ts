type WeightedItem = {
  weight: number
}

export function cryptoRandom(): number {
  const values = new Uint32Array(1)

  crypto.getRandomValues(values)

  return values[0] / 4294967296
}

export function pickRandomItem(items: string[], random = cryptoRandom): string {
  return items[Math.floor(random() * items.length)]
}

export function pickWeightedItem<T extends WeightedItem>(items: T[], random = cryptoRandom): T {
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

export type SpinPhysicsProfile = {
  accelerationMs: number
  cruiseMs: number
  decelerationMs: number
  peakVelocity: number
}

export function createSpinPhysicsProfile(totalDistance: number, durationMs: number, intensity = 1): SpinPhysicsProfile {
  const normalizedIntensity = clamp(intensity, 0.65, 1.45)
  const accelerationRatio = clamp(0.16 + normalizedIntensity * 0.03, 0.16, 0.22)
  const decelerationRatio = clamp(0.46 + normalizedIntensity * 0.05, 0.46, 0.58)
  const accelerationMs = Math.round(durationMs * accelerationRatio)
  const decelerationMs = Math.round(durationMs * decelerationRatio)
  const cruiseMs = Math.max(durationMs - accelerationMs - decelerationMs, 0)
  const weightedDuration = accelerationMs / 2 + cruiseMs + decelerationMs / 2
  const peakVelocity = weightedDuration === 0 ? 0 : totalDistance / weightedDuration

  return {
    accelerationMs,
    cruiseMs,
    decelerationMs,
    peakVelocity,
  }
}

export function computeSpinDistanceAtTime(elapsedMs: number, profile: SpinPhysicsProfile): number {
  const clampedElapsedMs = Math.max(elapsedMs, 0)
  const { accelerationMs, cruiseMs, decelerationMs, peakVelocity } = profile
  const accelerationEndMs = accelerationMs
  const cruiseEndMs = accelerationEndMs + cruiseMs
  const totalDurationMs = cruiseEndMs + decelerationMs

  if (clampedElapsedMs <= accelerationEndMs && accelerationMs > 0) {
    const acceleration = peakVelocity / accelerationMs
    return 0.5 * acceleration * clampedElapsedMs * clampedElapsedMs
  }

  const accelerationDistance = 0.5 * peakVelocity * accelerationMs

  if (clampedElapsedMs <= cruiseEndMs) {
    return accelerationDistance + peakVelocity * (clampedElapsedMs - accelerationEndMs)
  }

  if (clampedElapsedMs <= totalDurationMs && decelerationMs > 0) {
    const decelerationElapsedMs = clampedElapsedMs - cruiseEndMs
    const deceleration = peakVelocity / decelerationMs
    return accelerationDistance + peakVelocity * cruiseMs + peakVelocity * decelerationElapsedMs - 0.5 * deceleration * decelerationElapsedMs * decelerationElapsedMs
  }

  return accelerationDistance + peakVelocity * cruiseMs + 0.5 * peakVelocity * decelerationMs
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
