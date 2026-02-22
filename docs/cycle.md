# Cycle feature documentation

## Routes
- `"/cycle"`: list of all 16 planned weeks.
- `"/cycle/week/:week"`: day-level launcher for a selected week.
- `"/cycle/week/:week/day/:day"`: detailed workout for a specific day.

## Route behavior
- Week rows with available plan data are interactive and open to week detail screens.
- Week 1–5 are currently seeded with full day details.
- Weeks 6–16 currently show a non-blocking “coming soon” state.
- Week detail screens include compact `Prev week`, `Next week`, and `All weeks` actions.

### Labeling
- Day row previews use descriptive tags based on workout focus (for example, `Jump day`, `Lift day`, `Plyometrics`) so they avoid generic copy.
- The compact weekday rail in day view uses short labels (`sun`, `mon`, `tue`, etc.) with dates.

## Day details
- Day screens include:
  - Session summary list
  - Previous/next day actions
  - Inline copy link action for sharing this exact page
  - Reference routine details where available
- Invalid week/day URLs render a compact fallback card with navigation back to the cycle page.

## Metadata
- `use-page-meta.ts` drives title and description per page for cleaner browser tabs and link previews.

## Data ownership
- Add/adjust cycle content in `client/src/lib/cycle.ts`.
- Keep route paths unchanged to preserve deep-link/back behavior.
