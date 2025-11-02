# Banner Display Logic - Visual Guide

## Before Fix ❌

```
User enters finish results for athletes 1-3
Athletes 4-5 still only have splits

Database State:
┌──────────┬─────────────┬────────────┐
│ Athlete  │ Finish Time │   Splits   │
├──────────┼─────────────┼────────────┤
│    1     │  02:05:30   │     -      │
│    2     │  02:06:15   │     -      │
│    3     │  02:07:00   │     -      │
│    4     │    NULL     │  ✓ Has     │
│    5     │    NULL     │  ✓ Has     │
└──────────┴─────────────┴────────────┘

API Logic:
hasSplitsWithoutFinish = true  (athletes 4 & 5 have splits)
isTemporary = true             (because hasSplitsWithoutFinish)

Frontend Logic:
raceFinishedNotFinalized = !isTemporary && !resultsFinalized
                         = !true && true
                         = false && true
                         = false ❌

Banner does NOT show ❌
```

## After Fix ✅

```
User enters finish results for athletes 1-3
Athletes 4-5 still only have splits

Database State:
┌──────────┬─────────────┬────────────┐
│ Athlete  │ Finish Time │   Splits   │
├──────────┼─────────────┼────────────┤
│    1     │  02:05:30   │     -      │
│    2     │  02:06:15   │     -      │
│    3     │  02:07:00   │     -      │
│    4     │    NULL     │  ✓ Has     │
│    5     │    NULL     │  ✓ Has     │
└──────────┴─────────────┴────────────┘

API Logic:
hasSplitsWithoutFinish = true   (athletes 4 & 5 have splits)
hasAnyFinishTimes = true ✨     (athletes 1, 2, 3 have finish times)
isTemporary = true              (because hasSplitsWithoutFinish)

Frontend Logic:
raceFinishedNotFinalized = hasFinishTimes && !resultsFinalized
                         = true && true
                         = true ✅

Banner SHOWS ✅
┌────────────────────────────────────────────────────┐
│ ⏳ Race Finished - Results Being Manually Reviewed │
│    This could take a while. Check back tomorrow    │
│    for final official results.                     │
└────────────────────────────────────────────────────┘
```

## Decision Tree

```
                     ┌─────────────────────┐
                     │  Are there results? │
                     └──────────┬──────────┘
                                │
                        ┌───────▼────────┐
                        │       NO       │
                        └───────┬────────┘
                                │
                        ┌───────▼────────┐
                        │  NO BANNER     │
                        └────────────────┘

                     ┌─────────────────────┐
                     │  Are there results? │
                     └──────────┬──────────┘
                                │
                        ┌───────▼────────┐
                        │      YES       │
                        └───────┬────────┘
                                │
                   ┌────────────▼────────────┐
                   │ Any finish times exist? │
                   └────────────┬────────────┘
                                │
                        ┌───────▼────────┐
                        │       NO       │
                        │  (only splits) │
                        └───────┬────────┘
                                │
                   ┌────────────▼─────────────┐
                   │  Show Live Projections   │
                   │  Banner (blue, ⚡)       │
                   └──────────────────────────┘

                     ┌─────────────────────┐
                     │  Are there results? │
                     └──────────┬──────────┘
                                │
                        ┌───────▼────────┐
                        │      YES       │
                        └───────┬────────┘
                                │
                   ┌────────────▼────────────┐
                   │ Any finish times exist? │
                   └────────────┬────────────┘
                                │
                        ┌───────▼────────┐
                        │      YES       │
                        └───────┬────────┘
                                │
                   ┌────────────▼─────────────┐
                   │  Results finalized?      │
                   └────────────┬─────────────┘
                                │
                        ┌───────▼────────┐
                        │      YES       │
                        └───────┬────────┘
                                │
                        ┌───────▼────────┐
                        │  NO BANNER     │
                        │ (show results) │
                        └────────────────┘

                     ┌─────────────────────┐
                     │  Are there results? │
                     └──────────┬──────────┘
                                │
                        ┌───────▼────────┐
                        │      YES       │
                        └───────┬────────┘
                                │
                   ┌────────────▼────────────┐
                   │ Any finish times exist? │
                   └────────────┬────────────┘
                                │
                        ┌───────▼────────┐
                        │      YES       │
                        └───────┬────────┘
                                │
                   ┌────────────▼─────────────┐
                   │  Results finalized?      │
                   └────────────┬─────────────┘
                                │
                        ┌───────▼────────┐
                        │       NO       │
                        └───────┬────────┘
                                │
                   ┌────────────▼─────────────┐
                   │  Show Manual Review      │
                   │  Banner (orange, ⏳) ✅  │
                   └──────────────────────────┘
```

## Banner Visual Examples

### Manual Review Banner (Orange/Amber)
```
┌──────────────────────────────────────────────────────┐
│ ⏳                                                    │
│    Race Finished - Results Being Manually Reviewed   │
│    This could take a while. Check back tomorrow      │
│    for final official results.                       │
│                                                       │
│ Background: Orange gradient (#f59e0b → #d97706)      │
└──────────────────────────────────────────────────────┘
```

### Live Projections Banner (Blue)
```
┌──────────────────────────────────────────────────────┐
│ ⚡                                                    │
│    Live Projections                                  │
│    Based on Half Marathon times • Scores will update │
│    as race progresses                                │
│                                                       │
│ Background: Blue gradient (#4a90e2 → #357abd)        │
└──────────────────────────────────────────────────────┘
```
