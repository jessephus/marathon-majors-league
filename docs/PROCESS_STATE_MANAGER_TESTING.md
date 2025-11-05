# State Manager Tests in CI/CD

## Decision: Include in PR Test Suite ✅

The state manager unit and integration tests have been added to the CI/CD pipeline (`.github/workflows/test.yml`) to run on all pull requests.

## Rationale

### 1. Core Infrastructure, Not Implementation-Only

The `GameStateManager` is **foundational infrastructure** that replaces the legacy global state architecture (126+ mutation points per `PROCESS_MONOLITH_AUDIT.md`). As components migrate from `app.js` to React (Issues #90-94), this state manager becomes the backbone of the application.

**This is not a temporary scaffold** - it's the permanent replacement for:
- Global `gameState` object
- Global `anonymousSession` object  
- Global `commissionerSession` object
- Direct `localStorage` access
- Manual cache management

### 2. Prevent Regression During Migration

During the componentization process (Phases 4-5 per audit), these tests will catch:

| Change Type | What Tests Catch |
|------------|------------------|
| **API changes** | Breaking changes to `updateGameState()`, `loadGameState()`, etc. |
| **Cache logic** | TTL modifications that break expected 30s/60s behavior |
| **Event system** | Breaking changes to pub/sub events used by components |
| **Storage adapter** | Changes that break session persistence |
| **State versioning** | Migration logic failures |

### 3. Fast Execution (No Server Required)

Unlike other test suites, state manager tests:

```
State Manager Unit Tests:       ~1-2 seconds  ✅
State Manager Integration Tests: ~2-3 seconds  ✅
Total:                           ~3-5 seconds
```

**Advantages:**
- No server startup delay (saves ~30-60 seconds)
- No database connection required
- No API dependencies
- Run before server-dependent tests for faster failure feedback

**Cost:** Minimal - adds ~5 seconds to CI/CD pipeline

### 4. Living Documentation

The **65 test cases** (34 unit + 31 integration) serve as executable documentation:

```javascript
// Developers can reference tests to learn:
test('Cache TTL - Game State')  // How caching works
test('Event-Driven Updates')    // What events are available
test('Session Persistence')     // How storage works
test('State Versioning')        // Migration patterns
```

This is especially valuable during the migration when multiple developers will need to integrate with the state manager.

### 5. Future-Proof

As new features are added:
- New state properties? Tests ensure existing logic still works
- New cache strategies? Tests validate TTL behavior
- New storage backends? Tests verify adapter interface compliance
- New event types? Tests catch event system regressions

## Test Placement in CI/CD Pipeline

**Order in workflow:**
1. ✅ Checkout code
2. ✅ Install dependencies
3. ✅ **Compile state manager** (TypeScript → JS)
4. ✅ **Run state manager unit tests** ← **Fast failure point**
5. ✅ **Run state manager integration tests** ← **Fast failure point**
6. ⏰ Build application (slow)
7. ⏰ Start server (slow)
8. ⏰ Run server-dependent tests

**Benefits of early placement:**
- Fail fast if core state logic is broken
- Save CI minutes by detecting issues before server startup
- Provide quick feedback to developers

## Test Coverage

### Unit Tests (34 tests)
- ✅ State initialization
- ✅ Partial state updates
- ✅ Session management (create, update, clear)
- ✅ Commissioner session (login, logout, expiry)
- ✅ Pub/sub event system (subscribe, unsubscribe, multiple listeners)
- ✅ Cache TTL (30s results, 60s game state)
- ✅ Cache invalidation (manual and automatic)
- ✅ Results updates with cache invalidation
- ✅ Roster lock management
- ✅ State versioning and migration
- ✅ Force refresh bypassing cache

### Integration Tests (31 tests)
- ✅ Event-driven state updates with multiple subscribers
- ✅ TTL expiration behavior (results and game state)
- ✅ State consistency across multiple updates
- ✅ Session persistence across "page reloads"
- ✅ Commissioner session expiry detection
- ✅ Cache invalidation on state updates
- ✅ Event ordering guarantees
- ✅ Multiple game ID handling
- ✅ Concurrent event listener execution

## Maintenance

### When to Update Tests

1. **Adding new state properties** → Add test coverage
2. **Changing TTL values** → Update expected timings
3. **Adding new events** → Test event emission
4. **Modifying storage adapter** → Verify persistence
5. **Breaking API changes** → Update tests AND components

### Test Stability

- ✅ No flaky network requests (all mocked)
- ✅ No race conditions (controlled timing)
- ✅ No external dependencies
- ✅ Isolated from server state
- ✅ Fast execution (< 5 seconds)

## Alternative Considered: Skip CI/CD

**Why we didn't choose this:**

❌ **"Only needed for implementation"** - False. State manager is permanent infrastructure.  
❌ **"Adds too much time"** - False. Only ~5 seconds added.  
❌ **"Can test manually"** - Risky. 65 test cases won't be run consistently.  
❌ **"Other tests cover it"** - False. No other tests validate state manager internals.

## Conclusion

**State manager tests are added to CI/CD because they:**
1. Protect core infrastructure (not implementation detail)
2. Prevent regressions during componentization
3. Run fast with zero infrastructure overhead
4. Document expected behavior for developers
5. Scale with future development

**Expected outcome:** Zero regressions in state management as the codebase evolves through Phases 4-5 of componentization.
