# Enforcement Strategy: Ensuring Code Compliance

## Current Status (December 30, 2024)

**Compliance Check Results:**
- ✅ **Core infrastructure complete** (services, rules, docs, tests)
- ⚠️ **118 violations remaining** in 29 component files
- 📊 **Current compliance: ~40%** (19/48 files compliant)

### Violation Breakdown
- `toFixed()`: 51 violations in 25 files
- `toLocaleString()`: 14 violations in 10 files
- `Intl.NumberFormat`: 15 violations in 15 files
- Inline formatters: 38 violations in 20 files

---

## Three-Pronged Enforcement Strategy

### 1. 🛡️ **Prevention** (Stop New Violations)

#### A. ESLint Rules
Created `.eslintrc-financial.json` with rules to warn on:
- `toFixed()` usage
- `toLocaleString()` with arguments
- `new Intl.NumberFormat`

**Integration:**
```bash
# Add to package.json scripts
"lint:financial": "eslint --config .eslintrc-financial.json src/components/**/*.tsx"
```

Run before commits:
```bash
npm run lint:financial
```

#### B. Git Pre-commit Hook
Create `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Checking financial compliance..."
./scripts/check-compliance.sh --strict
```

#### C. PR Template Checklist
Add to `.github/pull_request_template.md`:
```markdown
## Financial Code Standards

- [ ] No `toFixed()`, `toLocaleString()`, or `Intl.NumberFormat` in components
- [ ] Uses `Formatters` service for all display formatting
- [ ] Uses `FinancialMath` for all money calculations
- [ ] Imports from `@/lib/financial`
- [ ] Ran `./scripts/check-compliance.sh` (no violations)
```

#### D. CI/CD Integration
Add to GitHub Actions workflow:
```yaml
- name: Check Financial Compliance
  run: |
    chmod +x ./scripts/check-compliance.sh
    ./scripts/check-compliance.sh
```

---

### 2. 🔧 **Detection** (Find Existing Violations)

#### A. Automated Compliance Checker
**Script:** `./scripts/check-compliance.sh`

**Usage:**
```bash
# Check entire codebase
./scripts/check-compliance.sh

# Get detailed output
./scripts/check-compliance.sh --verbose

# Check specific directory
grep -r "toFixed(" src/components/trading/ --include="*.tsx"
```

**Integration with Development:**
```bash
# Add to package.json
"scripts": {
  "check:compliance": "./scripts/check-compliance.sh",
  "check:compliance:verbose": "./scripts/check-compliance.sh --verbose"
}
```

#### B. Regular Audits
**Weekly:** Run compliance checker and update `COMPLIANCE_AUDIT.md`
```bash
npm run check:compliance > compliance-report-$(date +%Y%m%d).txt
```

**Monthly:** Review progress and adjust priorities

#### C. Tracking Dashboard
Maintain `COMPLIANCE_AUDIT.md` with:
- Files remaining
- Progress percentage
- Week-over-week improvement
- Target completion date

---

### 3. 🚀 **Remediation** (Fix Violations)

#### A. Phased Rollout (5-6 Weeks)

**Week 1: Critical Trading Components (Priority 1)**
- [ ] BuyOrderForm.tsx
- [ ] SellOrderForm.tsx  
- [ ] BuyOrderModal.tsx
- [ ] SellOrderModal.tsx
- [ ] OrderManagement.tsx

**Impact:** Ensures financial precision where it matters most

**Week 2: Dashboard Components (Priority 2)**
- [ ] PortfolioCard.tsx
- [ ] Watchlists.tsx
- [ ] TransactionItem.tsx
- [ ] Leaderboard.tsx
- [ ] LeaderboardCard.tsx
- [ ] PortfolioPerformanceChart.tsx
- [ ] PortfolioCategoryChart.tsx
- [ ] ActivityItem.tsx

**Impact:** High visibility, user-facing improvements

**Week 3: Asset Detail Components (Priority 3)**
- [ ] AssetHeader.tsx
- [ ] AssetChart.tsx
- [ ] UserHoldings.tsx
- [ ] AssetNewsPanel.tsx

**Impact:** Complex refactors, improves asset pages

**Week 4: Portfolio & Analytics (Priority 4)**
- [ ] PortfolioTreemap.tsx
- [ ] InvestmentProjectionsCalculator.tsx

**Impact:** Analytics precision

**Week 5: Onboarding & Admin (Priority 5)**
- [ ] TrendingAssetsList.tsx
- [ ] SimplifiedBuyForm.tsx
- [ ] AssetSuggestionCard.tsx
- [ ] OnboardingSidebarContent.tsx
- [ ] GameSessionManagement.tsx
- [ ] AdminDashboard.tsx
- [ ] UserList.tsx
- [ ] UserCard.tsx
- [ ] TradePage.tsx

**Impact:** Lower priority, internal-facing

**Week 6: Test Components & Polish**
- [ ] TradingSystemTest.tsx
- [ ] Fix any remaining edge cases
- [ ] Update documentation

#### B. Refactoring Process

For each file:

1. **Before starting:**
   ```bash
   # Check current violations
   grep -n "toFixed\|toLocaleString\|Intl.NumberFormat" src/components/path/to/file.tsx
   ```

2. **Refactor:**
   - Add import: `import { FinancialMath, Formatters } from '@/lib/financial'`
   - Replace formatters with service calls
   - Replace calculations with FinancialMath
   - Remove inline formatter functions
   - Test visually

3. **Verify:**
   ```bash
   # Check no violations remain
   ./scripts/check-compliance.sh
   
   # Run type checker
   npm run type-check
   
   # Run linter
   npm run lint
   ```

4. **Document:**
   - Update `COMPLIANCE_AUDIT.md`
   - Mark file as ✅ complete
   - Update progress percentage

#### C. Quick Reference During Refactoring

Keep `QUICK_START_COMPLIANCE.md` open for:
- Common patterns
- Before/after examples
- Service method reference
- Troubleshooting tips

---

## Success Metrics

### Short-term (2 weeks)
- ✅ All trading components compliant (0 violations in trading/)
- ✅ CI/CD enforcement enabled
- ✅ Pre-commit hooks working

### Medium-term (1 month)
- ✅ 80%+ compliance (38/48 files)
- ✅ All dashboard components compliant
- ✅ ESLint rules enforced in CI

### Long-term (2 months)
- ✅ 100% compliance (0 violations)
- ✅ New violations blocked by CI
- ✅ Team trained on patterns
- ✅ Documentation complete

---

## Team Enablement

### Onboarding New Developers

**Step 1:** Read Documentation
- `.cursor/rules/financial-math.mdc` - The standards
- `QUICK_START_COMPLIANCE.md` - How to comply
- `src/lib/README.md` - Service documentation

**Step 2:** See Examples
- Look at compliant files:
  - `StockMetrics.tsx`
  - `FundMetrics.tsx`
  - `PerformanceHighlights.tsx`

**Step 3:** Practice
- Refactor one non-critical file
- Get code review
- Learn from feedback

**Step 4:** Apply
- Follow patterns on all new code
- Use compliance checker before submitting PRs

### Code Review Checklist

Reviewers should verify:
- [ ] Component imports `Formatters` or `FinancialMath` if displaying/calculating money
- [ ] No `toFixed()`, `toLocaleString()`, `Intl.NumberFormat` in components
- [ ] No inline formatter functions
- [ ] Calculations use services, not native operators
- [ ] Ran `./scripts/check-compliance.sh` (shows 0 new violations)
- [ ] Tests pass
- [ ] Visual review confirms formatting is correct

---

## Handling Edge Cases

### Case 1: Non-Financial toFixed()
```typescript
// If genuinely not money-related (rare):
const percentage = Math.PI.toFixed(2); // OK - mathematical constant

// But prefer:
const percentage = Formatters.number(Math.PI, { decimals: 2 });
```

### Case 2: Third-Party Libraries
```typescript
// If a library requires native numbers:
const decimal = FinancialMath.multiply(shares, price);
const numberForLibrary = decimal.toNumber(); // OK - library requirement
```

### Case 3: Test Files
Test files should still follow patterns for consistency, but are lower priority.

### Case 4: Backward Compatibility
```typescript
// Wrapper functions are OK temporarily:
function formatCurrency(val: number) {
  return Formatters.currency(val); // Wrapper is fine
}

// But prefer direct usage:
Formatters.currency(val)
```

---

## Maintenance

### Weekly Tasks
- [ ] Run `./scripts/check-compliance.sh`
- [ ] Update `COMPLIANCE_AUDIT.md` with progress
- [ ] Review any new violations
- [ ] Refactor 5-6 files per week

### Monthly Tasks
- [ ] Review progress vs. timeline
- [ ] Update documentation if patterns evolve
- [ ] Check for new edge cases
- [ ] Team retrospective on compliance process

### Quarterly Tasks
- [ ] Full codebase audit
- [ ] Update ESLint rules if needed
- [ ] Review and update tooling
- [ ] Celebrate hitting milestones! 🎉

---

## Rollback Plan

If issues arise:

1. **Isolated Problem:**
   - Revert specific file
   - Document issue
   - Fix and re-apply

2. **Widespread Issues:**
   - Services are backward compatible
   - Old patterns still work
   - Gradual rollout allows testing

3. **Critical Bug:**
   - Hotfix using current patterns
   - Add to technical debt log
   - Refactor during next sprint

---

## Communication Plan

### Announcement
1. Share `QUICK_START_COMPLIANCE.md` with team
2. Demo the compliance checker
3. Show before/after examples
4. Answer questions

### Ongoing
1. Slack bot posts compliance score weekly
2. Celebrate milestones (50%, 75%, 100%)
3. Share wins ("Trading components now 100% compliant! ✅")

### Documentation
1. Add to engineering onboarding
2. Reference in coding standards
3. Include in PR templates
4. Link in README

---

## Timeline & Milestones

```
Week 1:  ████████░░░░░░░░░░░░ 40% → 50%  (Trading components)
Week 2:  ████████████░░░░░░░░ 50% → 65%  (Dashboard)
Week 3:  ██████████████░░░░░░ 65% → 75%  (Assets)
Week 4:  ████████████████░░░░ 75% → 85%  (Portfolio)
Week 5:  ██████████████████░░ 85% → 95%  (Admin/Onboarding)
Week 6:  ████████████████████ 95% → 100% (Polish & complete)
```

**Target:** 100% compliance by February 10, 2025

---

## Tools Summary

| Tool | Purpose | Command |
|------|---------|---------|
| `check-compliance.sh` | Find violations | `./scripts/check-compliance.sh` |
| `.eslintrc-financial.json` | Lint rules | `eslint --config .eslintrc-financial.json` |
| `COMPLIANCE_AUDIT.md` | Tracking | Manual updates |
| `QUICK_START_COMPLIANCE.md` | Reference guide | Read during refactoring |
| Test suite | Verify services | `npm test tests/financial-math.test.ts` |

---

## Success Indicators

You'll know compliance is working when:

✅ New PRs automatically comply with standards  
✅ Compliance checker shows 0 violations  
✅ No precision errors in displays (no 0.30000000000000004)  
✅ Formatting is consistent across entire app  
✅ Team understands and follows patterns  
✅ Code reviews go faster (patterns are clear)  
✅ Fewer bugs related to financial calculations  
✅ Easier to maintain and modify financial logic  

---

## Final Notes

- **Be pragmatic:** Perfect is the enemy of good. Fix critical areas first.
- **Be consistent:** Once you start a pattern, stick with it.
- **Be patient:** 6 weeks to refactor 29 files is reasonable.
- **Be thorough:** Each file refactored makes the next one easier.
- **Be proud:** Production-grade financial precision is worth the effort! 🎉
