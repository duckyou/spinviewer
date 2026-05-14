import styles from './Wheel.module.css'

type WheelProps = {
  items: string[]
  itemColors: string[]
  eliminatedItems: string[]
  focusedItem: string | null
  rotation: number
  pointerAngle: number
  pointerSliding: boolean
}

export function Wheel({ items, itemColors, eliminatedItems, focusedItem, rotation, pointerAngle, pointerSliding }: WheelProps) {
  const slice = 360 / items.length
  const maxLength = items.reduce((currentMax, item) => Math.max(currentMax, item.length), 0)
  const compactLabels = items.length >= 8 || maxLength >= 10
  const tinyLabels = items.length >= 10 || maxLength >= 14
  const labelRadius = tinyLabels ? 0.74 : compactLabels ? 0.7 : 0.64
  const conicStops = items
    .map((_, index) => {
      const start = index * slice
      const end = start + slice
      return `${itemColors[index] ?? itemColors[index % itemColors.length]} ${start}deg ${end}deg`
    })
    .join(', ')
  const eliminatedSet = new Set(eliminatedItems)

  return (
    <div className={styles.stage}>
      <div
        className={`${styles.pointerOrbit} ${pointerSliding ? styles.pointerOrbitSliding : ''}`}
        style={{ transform: `rotate(${pointerAngle}deg)` }}
        aria-hidden="true"
      >
        <div className={styles.pointer}>
          <span className={styles.pointerFacet} />
        </div>
      </div>
      <div className={styles.wheelFrame}>
        <div
          className={styles.wheel}
          style={{
            backgroundImage: `conic-gradient(from 0deg, ${conicStops})`,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <div className={styles.rim} aria-hidden="true" />
          {items.map((item, index) => {
            const isEliminated = eliminatedSet.has(item)
            const isFocused = focusedItem === item
            const angle = index * slice + slice / 2 - 90
            const angleInRadians = (angle * Math.PI) / 180
            const x = 50 + Math.cos(angleInRadians) * labelRadius * 50
            const y = 50 + Math.sin(angleInRadians) * labelRadius * 50

            return (
              <div
                key={item}
                className={styles.labelSlot}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span
                  className={[
                    styles.label,
                    compactLabels ? styles.labelCompact : '',
                    tinyLabels ? styles.labelTiny : '',
                    isEliminated ? styles.labelEliminated : '',
                    isFocused ? styles.labelFocused : '',
                  ].join(' ')}
                  style={{ transform: `translate(-50%, -50%) rotate(${angle + 90}deg)` }}
                  title={item}
                >
                  {item}
                </span>
              </div>
            )
          })}
          <div className={styles.core}>⚡</div>
        </div>
      </div>
    </div>
  )
}
