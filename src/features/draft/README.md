# Draft Feature Module

Modular, testable salary cap draft functionality extracted from the monolithic `public/salary-cap-draft.js`.

## Overview

This module provides pure, DOM-independent functions for managing the salary cap draft process. It follows best practices for separation of concerns and testability.

## Structure

```
src/features/draft/
├── index.js                 # Main export file
├── validation.js            # Pure validation functions
├── state-machine.js         # State management logic
├── hooks/                   # React hooks (future)
├── components/              # Draft-specific components (future)
└── __tests__/
    └── validation.test.js   # Comprehensive tests
```

## Key Requirements

The draft system enforces these constraints:

- **3 Men + 3 Women**: Roster must have exactly 3 male and 3 female athletes
- **$30,000 Budget**: Total salary cannot exceed the salary cap
- **No Duplicates**: Each athlete can only appear once
- **Gender Matching**: Men's slots (M1, M2, M3) can only contain male athletes; women's slots (W1, W2, W3) can only contain female athletes

## Usage

### Validation

```javascript
import { validateRoster, canAddAthleteToSlot } from '@/src/features/draft';

// Validate complete roster
const roster = {
  M1: { id: 1, name: 'John Doe', gender: 'men', salary: 6000 },
  M2: { id: 2, name: 'Mike Smith', gender: 'men', salary: 5000 },
  M3: { id: 3, name: 'Tom Jones', gender: 'men', salary: 4000 },
  W1: { id: 4, name: 'Jane Doe', gender: 'women', salary: 6000 },
  W2: { id: 5, name: 'Sarah Smith', gender: 'women', salary: 5000 },
  W3: { id: 6, name: 'Emma Jones', gender: 'women', salary: 4000 },
};

const result = validateRoster(roster);
console.log(result.isValid); // true
console.log(result.errors);  // []

// Check if athlete can be added
const newAthlete = { id: 7, name: 'Bob Williams', gender: 'men', salary: 8000 };
const canAdd = canAddAthleteToSlot(roster, 'M1', newAthlete);
console.log(canAdd.canAdd);  // true/false
console.log(canAdd.errors);  // []
```

### State Machine

```javascript
import { 
  createInitialState, 
  addAthleteToSlot, 
  getRosterSummary 
} from '@/src/features/draft';

// Create initial state
let state = createInitialState();

// Add athletes
state = addAthleteToSlot(state, 'M1', {
  id: 1,
  name: 'John Doe',
  gender: 'men',
  salary: 6000
});

// Get summary
const summary = getRosterSummary(state);
console.log(summary);
// {
//   filledSlots: 1,
//   totalSlots: 6,
//   menFilled: 1,
//   menRequired: 3,
//   womenFilled: 0,
//   womenRequired: 3,
//   totalSpent: 6000,
//   remainingBudget: 24000,
//   isValid: false,
//   canSubmit: false,
//   ...
// }
```

## Testing

The module includes comprehensive pure unit tests with no DOM coupling:

```bash
# Run draft validation tests
node src/features/draft/__tests__/validation.test.js

# Expected output:
# ✅ Passed: 30
# ❌ Failed: 0
# 📊 Total: 30
```

### Test Coverage

- ✅ Configuration validation
- ✅ Empty roster validation
- ✅ Partial roster validation
- ✅ 3M requirement validation
- ✅ 3W requirement validation
- ✅ Budget calculation
- ✅ Over budget detection
- ✅ Duplicate athlete detection
- ✅ Gender slot validation
- ✅ Comprehensive roster validation
- ✅ Athlete addition validation
- ✅ Edge cases (default salaries, custom budgets)

All 30 tests pass ✅

## API Reference

### Validation Functions

#### `validateRoster(slots, config?)`
Comprehensive validation of entire roster.

**Returns:**
```javascript
{
  isValid: boolean,
  errors: string[],
  details: {
    allSlotsFilled: { isValid, errors, filledSlots, requiredSlots },
    menSlots: { isValid, errors, filledCount, requiredCount },
    womenSlots: { isValid, errors, filledCount, requiredCount },
    budget: { isValid, errors, spent, remaining, overBudget },
    duplicates: { isValid, errors, duplicates },
    genders: { isValid, errors, violations }
  }
}
```

#### `canAddAthleteToSlot(slots, slotId, athlete, maxBudget?)`
Check if athlete can be added to specific slot.

**Returns:**
```javascript
{
  canAdd: boolean,
  errors: string[],
  budgetImpact: {
    currentTotal: number,
    newTotal: number,
    remaining: number
  }
}
```

### State Machine Functions

#### `createInitialState(config?)`
Create initial draft state.

#### `addAthleteToSlot(state, slotId, athlete)`
Add athlete to roster slot.

#### `removeAthleteFromSlot(state, slotId)`
Remove athlete from roster slot.

#### `getRosterSummary(state)`
Get current roster status summary.

## Migration Notes

This module extracts logic from:
- `public/salary-cap-draft.js` - Legacy monolithic file
- `lib/budget-utils.js` - Budget calculation utilities

### Benefits of Extraction

1. **Testability**: Pure functions with no DOM coupling
2. **Reusability**: Can be used in React components, API routes, or vanilla JS
3. **Maintainability**: Clear separation of concerns
4. **Documentation**: Self-documenting API with comprehensive tests

### Integration Points

The draft feature module integrates with:
- `lib/ui-helpers.tsx` - Shared UI utilities
- `components/RosterSlots.tsx` - Roster display component
- `components/AthleteSelectionModal.tsx` - Athlete selection UI
- `components/BudgetTracker.tsx` - Budget display component

## Future Enhancements

- [ ] React hooks for state management
- [ ] Draft-specific React components
- [ ] Persistence layer integration
- [ ] Undo/redo functionality
- [ ] Draft history tracking

## Related Documentation

- [PROCESS_MONOLITH_AUDIT.md](../../../docs/PROCESS_MONOLITH_AUDIT.md) - Monolith analysis
- [CORE_ARCHITECTURE.md](../../../docs/CORE_ARCHITECTURE.md) - System architecture
- [FEATURE_SALARY_CAP_DRAFT.md](../../../docs/FEATURE_SALARY_CAP_DRAFT.md) - Feature documentation
