import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Wheel } from './components/Wheel'
import styles from './App.module.css'
import {
  FALLBACK_ITEMS,
  hasEnoughItems,
  parseItemInput,
  parseWheelCandidates,
  resolveWheelQuery,
  serializeWheelQuery,
  type WheelMode,
} from './lib/query'
import { computeSpinRotation, createSeededRandom, pickWeightedItem, sleep } from './lib/wheel'

const BASE_SPIN_DURATION_MS = 4200
const ROUND_PAUSE_MS = 900
const CELEBRATION_EFFECTS = ['crabs', 'rockets', 'fish', 'sparkles'] as const
const CANDIDATE_EMOJIS = [
  '🦀', '🐙', '🦑', '🐡', '🦐', '🐳', '🛸', '🚀', '⭐', '🎯', '🎲', '🍀', '🦊', '🐼', '🦁', '🐸', '🐻', '🐨',
  '🐯', '🦉', '🦋', '🐝', '🐢', '🐬', '🦄', '🐲', '🌵', '🌴', '🌻', '🌈', '⚡', '🔥', '🌙', '☀️', '☄️', '🍉',
  '🍕', '🍣', '🍩', '🧁', '🎈', '🎧', '🎮', '🎸', '🥁', '🎨', '🧩', '🪄', '💎', '🔮', '🪐', '🧠', '👾', '🤖',
  '👻', '🎃', '🫠', '😎', '🤠', '🥸', '🫡', '🐠', '🐟', '🐚', '🪸', '🦞', '🦖', '🦕', '🦩', '🦚', '🦜', '🐿️',
  '🦔', '🐇', '🦦', '🦥', '🐉', '🌸', '🌼', '🌺', '🍄', '🌽', '🍓', '🥑', '🥨', '🍪', '🍜', '🥟', '🧃', '☕',
  '🫖', '📚', '🖍️', '🛹', '🚲', '🛶', '🎪', '🎭', '🎬', '🕹️',
] as const
const CANDIDATE_COLORS = [
  '#ec4cc2', '#9255ff', '#3447ff', '#a08fff', '#2e2fcf', '#ff70d3', '#ff8a5b', '#ffb347', '#ffd166', '#06d6a0',
  '#1b9aaa', '#118ab2', '#5dd39e', '#7bdff2', '#b388eb', '#f15bb5', '#fee440', '#00bbf9', '#00f5d4', '#9b5de5',
  '#ef476f', '#f78c6b', '#83c5be', '#3a86ff', '#8338ec', '#ff006e', '#fb5607', '#2a9d8f', '#90be6d', '#577590',
  '#f94144', '#f3722c', '#f8961e', '#43aa8b', '#4d908e', '#277da1', '#80ed99', '#72efdd', '#48bfe3', '#64dfdf',
  '#ff99c8', '#a9def9', '#e4c1f9', '#caffbf', '#ffd6a5', '#bde0fe', '#ffc6ff', '#d0f4de', '#f1c0e8', '#cfbaf0',
] as const
const HEADER_MESSAGES = [
  'review assignment jumpscare generator',
  'the PR distribution system is feeling evil today',
  'a machine for turning vibes into responsibilities',
  'Spin the wheel, find the reviewer',
  'One wheel. One reviewer. No escape.',
  'PR roulette for brave engineering teams',
  'One spin away from review duty',
  'Spin the wheel. Someone reviews. Nobody wins.',
  'A perfectly normal way to assign PR suffering',
  'A cursed wheel for blessed review assignments',
  'Someone has to review it. We chose chaos.',
  'Pull request roulette for teams with trust issues',
  'The fastest path from “not me” to “it’s me”',
  'Spin once. Regret instantly. Review thoroughly.',
  'Who reviews this PR? Ask the void.',
  'Where hope goes to become reviewer assignment',
  'Fair, unbiased, and emotionally devastating',
  'review assignment jumpscare generator',
  'this wheel was built from bad ideas and urgency',
  'the PR chooses whom it wants to haunt',
  'randomized reviewer allocation with emotional damage',
  'open source your fate',
] as const
const FRIDAY_HEADER_MESSAGES = [
  'friday roulette for people pretending they are almost done',
  'nothing says friday like surprise reviewer ownership',
  'happy friday! the PR distribution system remains undefeated',
  'friday energy: low. random review duty: high.',
] as const
const MONDAY_HEADER_MESSAGES = [
  'nothing wakes you up like involuntary review duty',
  'monday status: online, caffeinated, assigned a PR',
  'the wheel decided monday needed more character development',
] as const
const CELEBRATION_MESSAGES = [
  'bro got selected for PR review fr fr',
  'side quest acquired: review this PR',
  'nobody volunteered so destiny volunteered you',
  'review request jumpscare: it is yours now',
  'the wheel said open the PR and start typing comments',
  'you can run from meetings, not from review duty',
  'new achievement unlocked: reviewer of the day',
  'this PR has your name all over it unfortunately',
  'you were chosen to bless this PR with comments',
  'main character moment: reviewer edition',
  'the review gods said this one is your problem now',
  'a shiny new PR has appeared in your queue',
  'you are the final boss of this review thread now',
  'LGTM is not unlocked yet. Please inspect the code.',
  'your queue just rolled a natural one',
  'time to scan for edge cases like your life depends on it',
  'this is your villain origin story: becoming the reviewer',
  'you have been selected for premium PR inspection',
  'the code is pushed, the comments are pending, the reviewer is you',
  'you have been perceived by the code review distribution system',
  'your mission: catch the bug before prod catches feelings',
  'reviewing this PR is now part of your character development',
  'AI wrote this code. you were chosen to understand it',
  'the PR is harmless probably. you should still read all N files',
  'this PR wants approval. you want answers. fight',
  'it is time to perform the ancient ritual of scrolling with concern',
  'you are now entering the review dimension...',
  'this review has side quests, lore, and at least one suspicious rename',
  'your reward for being competent is more context to load into your brain',
  'this PR has been gently placed into your lap by chaotic forces',
  'the code pass tests. your job is to determine whether it also makes sense',
] as const
const FRIDAY_CELEBRATION_MESSAGES = [
  'congrats, you found the friday boss fight and it is a pull request',
  'weekend access denied until you at least skim the changed files',
  'the wheel saw your friday plans and attached a review request to them',
  'one last tiny friday review. history suggests it is not tiny',
] as const
const MONDAY_CELEBRATION_MESSAGES = [
  'happy monday. the week opened with a review request and chose violence',
  'this PR is your monday loading screen',
  'fresh week, stale brain, one suspicious pull request',
  'monday doom has taken the shape of a code review',
  'the standup ended and somehow you left with a PR to review',
  'welcome back. please inspect this PR before your coffee gives up',
] as const

type CelebrationEffect = (typeof CELEBRATION_EFFECTS)[number]

function App() {
  const isFriday = new Date().getDay() === 5
  const isMonday = new Date().getDay() === 1
  const headerMessages = isFriday
    ? [...HEADER_MESSAGES, ...FRIDAY_HEADER_MESSAGES]
    : isMonday
      ? [...HEADER_MESSAGES, ...MONDAY_HEADER_MESSAGES]
      : HEADER_MESSAGES
  const celebrationMessages = isFriday
    ? [...CELEBRATION_MESSAGES, ...FRIDAY_CELEBRATION_MESSAGES, ...FRIDAY_CELEBRATION_MESSAGES]
    : isMonday
      ? [...CELEBRATION_MESSAGES, ...MONDAY_CELEBRATION_MESSAGES, ...MONDAY_CELEBRATION_MESSAGES]
      : CELEBRATION_MESSAGES
  const initialQuery = resolveWheelQuery(window.location.search)
  const [listText, setListText] = useState(initialQuery.items.join('\n'))
  const [mode, setMode] = useState<WheelMode>(initialQuery.mode)
  const [autoStart] = useState(initialQuery.autoStart)
  const [randomSeed] = useState(initialQuery.randomSeed)
  const [speed] = useState(initialQuery.speed)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [focusedItem, setFocusedItem] = useState<string | null>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const [eliminatedItems, setEliminatedItems] = useState<string[]>([])
  const [celebrationEffect, setCelebrationEffect] = useState<CelebrationEffect>('crabs')
  const [winnerMessage, setWinnerMessage] = useState<string>(celebrationMessages[0])
  const [headerMessage] = useState(() => headerMessages[Math.floor(Math.random() * headerMessages.length)])
  const [showProbabilities, setShowProbabilities] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const autoStartedRef = useRef(false)
  const runIdRef = useRef(0)
  const rotationRef = useRef(0)

  const parsedItems = parseItemInput(listText)
  const showingFallback = !hasEnoughItems(parsedItems)
  const sourceItems = showingFallback ? FALLBACK_ITEMS : parsedItems
  const candidates = parseWheelCandidates(sourceItems)
  const items = candidates.map((candidate) => candidate.name)
  const normalizedSpeed = Math.max(speed, 0.1)
  const spinDurationMs = Math.round(BASE_SPIN_DURATION_MS / normalizedSpeed)
  const shareQuery = serializeWheelQuery({ mode, items: sourceItems, autoStart, randomSeed, speed })
  const completedRounds = eliminatedItems.length
  const eliminationRounds = Math.max(items.length - 1, 0)
  const remainingItems = items.filter((item) => !eliminatedItems.includes(item))
  const wheelItems = mode === 0 ? items : remainingItems
  const probabilityMap = new Map(candidates.map((candidate) => [candidate.name, candidate.weight]))
  const totalCandidateWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0)
  const candidateEmojiMap = createCandidateEmojiMap(items)
  const candidateColorMap = createCandidateColorMap(items)
  const wheelColors = wheelItems.map((item) => candidateColorMap.get(item) ?? CANDIDATE_COLORS[0])

  useEffect(() => {
    const nextUrl = `${window.location.pathname}?q=${shareQuery}`
    window.history.replaceState(null, '', nextUrl)
  }, [shareQuery])

  const startSpin = useEffectEvent(async () => {
    await handleSpin()
  })

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) {
      return
    }

    autoStartedRef.current = true
    void startSpin()
  }, [autoStart])

  async function handleSpin() {
    if (spinning) {
      return
    }

    const runId = runIdRef.current + 1
    runIdRef.current = runId

    setSpinning(true)
    setWinner(null)
    setFocusedItem(null)
    setEliminatedItems([])
    const nextCelebrationEffect = pickCelebrationEffect()
    setCelebrationEffect(nextCelebrationEffect)
    setWinnerMessage(pickCelebrationMessage())

    const random = randomSeed === null ? Math.random : createSeededRandom(randomSeed)

    if (mode === 0) {
      const selected = pickWeightedItem(candidates, random)
      await animateToItem(selected.name, items, runId, random)

      if (!isCurrentRun(runId)) {
        return
      }

      setWinner(selected.name)
      setFocusedItem(selected.name)
      setSpinning(false)
      return
    }

    let activeCandidates = [...candidates]
    const nextEliminated: string[] = []

    while (activeCandidates.length > 1) {
      const selected = pickWeightedItem(activeCandidates, random)
      await animateToItem(
        selected.name,
        activeCandidates.map((candidate) => candidate.name),
        runId,
        random,
      )

      if (!isCurrentRun(runId)) {
        return
      }

      nextEliminated.push(selected.name)
      activeCandidates = activeCandidates.filter((candidate) => candidate.name !== selected.name)
      setEliminatedItems([...nextEliminated])

      if (activeCandidates.length > 1) {
        await sleep(ROUND_PAUSE_MS)
      }
    }

    if (!isCurrentRun(runId)) {
      return
    }

    const survivor = activeCandidates[0].name
    setFocusedItem(survivor)
    setWinner(survivor)
    setSpinning(false)
  }

  async function animateToItem(targetItem: string, allItems: string[], runId: number, random: () => number) {
    const targetIndex = allItems.indexOf(targetItem)
    const slice = 360 / allItems.length
    const safeOffsetRange = slice * 0.28
    const sliceOffset = (random() * 2 - 1) * safeOffsetRange
    const extraTurns = 5 + Math.floor(random() * 3)
    const nextRotation = computeSpinRotation(rotationRef.current, targetIndex, allItems.length, extraTurns, sliceOffset)

    rotationRef.current = nextRotation
    setRotation(nextRotation)

    await sleep(spinDurationMs)

    if (!isCurrentRun(runId)) {
      setSpinning(false)
      return
    }

    setFocusedItem(targetItem)
  }

  function isCurrentRun(runId: number) {
    return runIdRef.current === runId
  }

  function clearRunState() {
    setFocusedItem(null)
    setWinner(null)
    setEliminatedItems([])
  }

  function pickCelebrationEffect(): CelebrationEffect {
    return CELEBRATION_EFFECTS[Math.floor(Math.random() * CELEBRATION_EFFECTS.length)]
  }

  function pickCelebrationMessage(): string {
    return celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]
  }

  function formatProbability(probability: number) {
    return `${probability.toFixed(probability >= 10 ? 1 : 2)}%`
  }

  function createCandidateEmojiMap(names: string[]) {
    const sortedNames = [...names].sort((left, right) => {
      const hashDiff = getNameHash(left) - getNameHash(right)

      return hashDiff !== 0 ? hashDiff : left.localeCompare(right)
    })

    return new Map(sortedNames.map((name, index) => [name, CANDIDATE_EMOJIS[index]]))
  }

  function createCandidateColorMap(names: string[]) {
    const sortedNames = [...names].sort((left, right) => {
      const hashDiff = getNameHash(left) - getNameHash(right)

      return hashDiff !== 0 ? hashDiff : left.localeCompare(right)
    })

    return new Map(sortedNames.map((name, index) => [name, CANDIDATE_COLORS[index % CANDIDATE_COLORS.length]]))
  }

  function getNameHash(name: string) {
    let hash = 0

    for (const character of name) {
      hash = (hash * 31 + character.charCodeAt(0)) >>> 0
    }

    return hash
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            🐙
          </div>
          <div>
            <h1>Spinviewer</h1>
            <p>{headerMessage}</p>
          </div>
        </div>

        <button
          type="button"
          className={styles.helpButton}
          onClick={() => {
            setShowHelp(true)
          }}
          aria-label="Open query parameter help"
          title="Query parameter help"
        >
          ?
        </button>
      </header>

      <main className={styles.dashboard}>
        <aside className={`${styles.panel} ${styles.sidebarPanel}`}>
          <section className={styles.cardSection}>
            <div className={styles.sectionHeading}>
              <h2>1. Candidates</h2>
              <span className={styles.countBadge}>{items.length}</span>
            </div>

            <label className={styles.fieldLabel} htmlFor="candidate-list">
              One name per line
            </label>
            <textarea
              id="candidate-list"
              className={styles.listInput}
              value={listText}
              onChange={(event) => {
                clearRunState()
                setListText(event.target.value)
              }}
              disabled={spinning}
              spellCheck={false}
            />

            <div className={styles.sectionMeta}>
              <span>{parsedItems.length} unique names</span>
              <span>{Math.min(parsedItems.length, 100)} / 100</span>
            </div>

            {showingFallback ? (
              <p className={styles.warningText}>
                Need at least 2 unique names. Demo wheel is shown until the list is valid.
              </p>
            ) : null}
          </section>

          <section className={styles.cardSection}>
            <h2>2. Mode</h2>

            <div className={styles.modeGrid}>
              <button
                type="button"
                className={`${styles.modeButton} ${mode === 0 ? styles.modeButtonActive : ''}`}
                onClick={() => {
                  clearRunState()
                  setMode(0)
                }}
                disabled={spinning}
              >
                Winner
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${mode === 1 ? styles.modeButtonActive : ''}`}
                onClick={() => {
                  clearRunState()
                  setMode(1)
                }}
                disabled={spinning}
              >
                Elimination
              </button>
            </div>
          </section>

          <div className={styles.actionStack}>
            <button type="button" className={styles.primaryButton} onClick={() => void handleSpin()}>
              {winner ? 'Spin again' : 'Spin'}
            </button>
          </div>
        </aside>

        <section className={styles.centerColumn}>
          <section className={styles.wheelStage}>
            <Wheel
              items={wheelItems}
              itemColors={wheelColors}
              eliminatedItems={eliminatedItems}
              focusedItem={focusedItem}
              rotation={rotation}
              spinning={spinning}
              spinDurationMs={spinDurationMs}
            />
          </section>
        </section>

        <aside className={`${styles.panel} ${styles.statusPanel}`}>
          <section className={styles.cardSection}>
            <div className={styles.sectionHeading}>
              <h2>{mode === 0 ? 'Winner mode' : 'Elimination mode'}</h2>
            </div>

            <div className={styles.statusBlock}>
              <p className={styles.statusTitle}>
                {mode === 0 ? `${items.length} candidates` : `${remainingItems.length} remaining`}
              </p>
              <div className={styles.progressRow} aria-hidden="true">
                {Array.from({ length: Math.max(eliminationRounds, 1) }).map((_, index) => (
                  <span
                    key={index}
                    className={`${styles.progressDot} ${index < completedRounds ? styles.progressDotComplete : ''}`}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className={styles.cardSection}>
            <div className={styles.sectionHeading}>
              <h2>Candidates</h2>
              <button
                type="button"
                className={styles.visibilityToggle}
                onClick={() => {
                  setShowProbabilities((current) => !current)
                }}
                aria-pressed={showProbabilities}
                aria-label={showProbabilities ? 'Hide probabilities' : 'Show probabilities'}
                title={showProbabilities ? 'Hide probabilities' : 'Show probabilities'}
              >
                {showProbabilities ? '👁' : '🙈'}
              </button>
            </div>

            <div className={styles.statusList}>
              {items.map((name) => (
                <div key={name} className={styles.statusListRow}>
                  <span className={styles.roundIndex} style={{ backgroundColor: candidateColorMap.get(name) }}>
                    {eliminatedItems.includes(name) ? '💀' : candidateEmojiMap.get(name)}
                  </span>
                  <span className={eliminatedItems.includes(name) ? styles.eliminatedName : styles.activeName}>{name}</span>
                  {showProbabilities ? (
                    <span className={styles.inlineProbability}>
                      {formatProbability(((probabilityMap.get(name) ?? 0) / totalCandidateWeight) * 100)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>

      {winner ? (
        <div className={styles.winnerOverlay} role="presentation">
          {celebrationEffect === 'crabs' ? (
            <div className={styles.crabLayer} aria-hidden="true">
              <div className={styles.crabSunset} />
              {Array.from({ length: 18 }).map((_, index) => {
                const lane = (index * 37) % 10
                const duration = 5600 + ((index * 211) % 1600)
                const delay = -((index * 487) % duration)

                return (
                  <span
                    key={index}
                    className={styles.crabRunner}
                    style={{
                      top: `${6 + lane * 8.8}%`,
                      animationDelay: `${delay}ms`,
                      animationDuration: `${duration}ms`,
                    }}
                  >
                    <span className={styles.crabEmoji}>🦀</span>
                  </span>
                )
              })}

              {Array.from({ length: 8 }).map((_, index) => (
                <span
                  key={`shell-${index}`}
                  className={styles.shellAccent}
                  style={{
                    left: `${6 + ((index * 13) % 88)}%`,
                    bottom: `${2 + ((index * 7) % 10)}%`,
                  }}
                >
                  {index % 2 === 0 ? '🐚' : '🪸'}
                </span>
              ))}
            </div>
          ) : null}

          {celebrationEffect === 'rockets' ? (
            <div className={styles.rocketLayer} aria-hidden="true">
              <div className={styles.spaceGlow} />
              {Array.from({ length: 18 }).map((_, index) => {
                const starSize = 0.55 + (((index * 19) % 145) / 100)

                return (
                  <span
                    key={`star-${index}`}
                    className={styles.spaceStar}
                    style={{
                      left: `${4 + ((index * 17) % 92)}%`,
                      top: `${6 + ((index * 23) % 84)}%`,
                      fontSize: `${starSize}rem`,
                    }}
                  >
                    {index % 3 === 0 ? '⭐' : index % 3 === 1 ? '🌟' : '✨'}
                  </span>
                )
              })}

              {Array.from({ length: 4 }).map((_, index) => {
                const duration = 5200 + ((index * 271) % 2000)
                const delay = -((index * 433) % duration)
                const fromLeft = index % 2 === 0

                return (
                  <span
                    key={`ufo-${index}`}
                    className={fromLeft ? styles.ufoRunnerRight : styles.ufoRunnerLeft}
                    style={{
                      top: `${12 + ((index * 19) % 56)}%`,
                      animationDelay: `${delay}ms`,
                      animationDuration: `${duration}ms`,
                    }}
                  >
                    <span className={styles.ufoEmoji}>🛸</span>
                  </span>
                )
              })}

              {Array.from({ length: 6 }).map((_, index) => {
                const duration = 3200 + ((index * 271) % 1800)
                const delay = -((index * 433) % duration)

                return (
                  <span
                    key={`rocket-${index}`}
                    className={styles.rocketRunner}
                    style={{
                      left: `${10 + ((index * 13) % 78)}%`,
                      animationDelay: `${delay}ms`,
                      animationDuration: `${duration}ms`,
                    }}
                  >
                    <span className={styles.rocketEmoji}>🚀</span>
                  </span>
                )
              })}
            </div>
          ) : null}

          {celebrationEffect === 'fish' ? (
            <div className={styles.fishLayer} aria-hidden="true">
              <div className={styles.aquariumGlow} />
              {Array.from({ length: 18 }).map((_, index) => {
                const duration = 2600 + ((index * 163) % 1800)
                const delay = -((index * 257) % duration)

                return (
                  <span
                    key={`bubble-${index}`}
                    className={styles.bubbleRunner}
                    style={{
                      left: `${4 + ((index * 11) % 92)}%`,
                      animationDelay: `${delay}ms`,
                      animationDuration: `${duration}ms`,
                    }}
                  >
                    <span className={styles.bubbleEmoji}>{index % 3 === 0 ? '🫧' : 'o'}</span>
                  </span>
                )
              })}

              {Array.from({ length: 10 }).map((_, index) => {
                const duration = 6800 + ((index * 197) % 2800)
                const delay = -((index * 359) % duration)
                const fromLeft = index % 2 === 0
                const fishSize = 0.5 + (((index * 29) % 251) / 100)

                return (
                  <span
                    key={index}
                    className={fromLeft ? styles.fishRunnerRight : styles.fishRunnerLeft}
                    style={{
                      top: `${12 + ((index * 9) % 68)}%`,
                      animationDelay: `${delay}ms`,
                      animationDuration: `${duration}ms`,
                    }}
                  >
                    <span
                      className={fromLeft ? styles.fishEmojiLeft : styles.fishEmojiRight}
                      style={{ fontSize: `${fishSize}rem` }}
                    >
                      {index % 3 === 0 ? '🐟' : index % 3 === 1 ? '🐠' : '🐡'}
                    </span>
                  </span>
                )
              })}
            </div>
          ) : null}

          {celebrationEffect === 'sparkles' ? (
            <div className={styles.sparkleLayer} aria-hidden="true">
              <div className={styles.sparkleGlow} />
              {Array.from({ length: 14 }).map((_, index) => {
                const duration = 2200 + ((index * 149) % 1200)
                const delay = -((index * 283) % duration)

                return (
                  <span
                    key={index}
                    className={styles.sparkleRunner}
                    style={{
                      left: `${5 + ((index * 17) % 90)}%`,
                      top: `${6 + ((index * 23) % 84)}%`,
                      animationDelay: `${delay}ms`,
                      animationDuration: `${duration}ms`,
                    }}
                  >
                    <span className={styles.sparkleEmoji}>{index % 3 === 0 ? '⭐' : index % 3 === 1 ? '🌟' : '💫'}</span>
                  </span>
                )
              })}

              {Array.from({ length: 10 }).map((_, index) => {
                const duration = 2600 + ((index * 131) % 1200)
                const delay = -((index * 181) % duration)

                return (
                  <span
                    key={`bonus-${index}`}
                    className={styles.sparkleRunner}
                    style={{
                      left: `${8 + ((index * 29) % 82)}%`,
                      top: `${10 + ((index * 31) % 72)}%`,
                      animationDelay: `${delay}ms`,
                      animationDuration: `${duration}ms`,
                    }}
                  >
                    <span className={styles.sparkleEmoji}>{index % 3 === 0 ? '💎' : index % 3 === 1 ? '🏆' : '💖'}</span>
                  </span>
                )
              })}
            </div>
          ) : null}

          <section className={`${styles.panel} ${styles.winnerModal}`} role="dialog" aria-modal="true" aria-labelledby="winner-title">
            <div className={styles.winnerBadge} aria-hidden="true">
              🎉
            </div>
            <p className={styles.winnerModeLabel}>{mode === 0 ? 'Winner selected' : 'Last one standing'}</p>
            <h2 id="winner-title" className={styles.winnerName}>
              {winner}
            </h2>
            <p className={styles.winnerMessage}>{winnerMessage}</p>
            <div className={styles.winnerActions}>
              <button type="button" className={styles.secondaryButton} onClick={clearRunState}>
                Close
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => void handleSpin()}>
                Spin again
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {showHelp ? (
        <div className={styles.helpOverlay} role="presentation" onClick={() => setShowHelp(false)}>
          <section
            className={`${styles.panel} ${styles.helpModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="query-help-title"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <div className={styles.helpHeader}>
              <div>
                <p className={styles.helpEyebrow}>Query Help</p>
                <h2 id="query-help-title">URL parameters</h2>
              </div>
              <button
                type="button"
                className={styles.helpCloseButton}
                onClick={() => {
                  setShowHelp(false)
                }}
                aria-label="Close query help"
              >
                ×
              </button>
            </div>

            <div className={styles.helpBody}>
              <p className={styles.helpLead}>
                Use `?q=` followed by semicolon-separated parameters. Example:
                {' '}
                <code>?q=m:1;l:alice*1.2,bob,carol;a:1;r:42;s:1.5</code>
              </p>

              <div className={styles.helpGrid}>
                <div className={styles.helpCard}>
                  <h3>`l:` candidate list</h3>
                  <p>Comma-separated names. Use it to preload the wheel from a link.</p>
                  <code>l:alice,bob,carol</code>
                </div>

                <div className={styles.helpCard}>
                  <h3>`m:` mode</h3>
                  <p>`0` picks one winner. `1` eliminates names until one remains.</p>
                  <code>m:1</code>
                </div>

                <div className={styles.helpCard}>
                  <h3>`a:1` auto-start</h3>
                  <p>Starts the wheel immediately after the page opens.</p>
                  <code>a:1</code>
                </div>

                <div className={styles.helpCard}>
                  <h3>`r:` random seed</h3>
                  <p>Integer-only seed for reproducible results with the same list and mode.</p>
                  <code>r:42</code>
                </div>

                <div className={styles.helpCard}>
                  <h3>`s:` speed</h3>
                  <p>Wheel speed multiplier. Higher is faster, lower is slower.</p>
                  <code>s:1.5</code>
                </div>

                <div className={styles.helpCard}>
                  <h3>`name*rate` weights</h3>
                  <p>Boost or reduce a candidate chance by adding a rate after the name.</p>
                  <code>alice*1.2,bob,carol</code>
                </div>
              </div>

              <p className={styles.helpNote}>Parameters are separated with `;`. Candidate names inside `l:` are separated with `,`.</p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

export default App
