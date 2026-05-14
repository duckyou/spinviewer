# Spinviewer

Spinviewer is a playful wheel app for picking reviewers, losers, survivors, and bracket champions.

## Features

- Winner mode: pick one winner from the full list.
- Elimination mode: remove names one by one until one remains.
- Tournament mode: split candidates into pairs, spin each matchup, and advance winners through the bracket.
- Weighted entries with `name*weight` syntax.
- Shareable state through URL query params.
- Optional seeded randomness for reproducible results.
- Auto-start support.
- Secret 1-in-10 pointer fakeout that can swap to the opposite candidate.

## Candidate Input

Enter one candidate per line.

Examples:

```text
alex
sam
jamie*1.5
taylor
```

Rules:

- Duplicate names are collapsed.
- `name*weight` increases or decreases pick chance.
- At least 2 unique names are required.

## Modes

- `👑` Winner: one final winner.
- `🔫` Elimination: selected candidate is eliminated each round.
- `🏆` Tournament: seeded head-to-head bracket with byes when needed.

## Query Params

The app stores state in `?q=` using semicolon-separated segments.

Example:

```text
?q=m:2;l:alex,sam,jamie*1.5,taylor;a:1;r:42;s:1.5
```

Supported params:

- `l:` candidate list, comma-separated
- `m:` mode
  - `0` winner
  - `1` elimination
  - `2` tournament
- `a:1` auto-start on load
- `r:` integer random seed
- `s:` speed multiplier

## Development

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Stack

- React
- TypeScript
- Vite

## Deploy

The app is configured for static deployment from the `dist/` folder.
