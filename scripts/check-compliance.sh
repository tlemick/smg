#!/bin/bash

# Financial Architecture Compliance Checker
# Checks for violations of financial math standards

echo "🔍 Checking Financial Architecture Compliance..."
echo ""

VIOLATIONS=0

# Check 1: toFixed() in components
echo "📊 Checking for toFixed() usage in components..."
TOFIXED_COUNT=$(grep -r "toFixed(" src/components/ --include="*.tsx" | wc -l | tr -d ' ')
if [ "$TOFIXED_COUNT" -gt 0 ]; then
  echo "  ❌ Found $TOFIXED_COUNT toFixed() violations"
  echo "     Files:"
  grep -r "toFixed(" src/components/ --include="*.tsx" -l | sed 's/^/     - /'
  VIOLATIONS=$((VIOLATIONS + TOFIXED_COUNT))
else
  echo "  ✅ No toFixed() violations"
fi
echo ""

# Check 2: toLocaleString() in components (with arguments)
echo "📊 Checking for toLocaleString() usage in components..."
TOLOCALE_COUNT=$(grep -r "toLocaleString(" src/components/ --include="*.tsx" | wc -l | tr -d ' ')
if [ "$TOLOCALE_COUNT" -gt 0 ]; then
  echo "  ⚠️  Found $TOLOCALE_COUNT toLocaleString() usages"
  echo "     Files:"
  grep -r "toLocaleString(" src/components/ --include="*.tsx" -l | sed 's/^/     - /'
  VIOLATIONS=$((VIOLATIONS + TOLOCALE_COUNT))
else
  echo "  ✅ No toLocaleString() violations"
fi
echo ""

# Check 3: new Intl.NumberFormat in components
echo "📊 Checking for Intl.NumberFormat usage in components..."
INTL_COUNT=$(grep -r "new Intl.NumberFormat" src/components/ --include="*.tsx" | wc -l | tr -d ' ')
if [ "$INTL_COUNT" -gt 0 ]; then
  echo "  ❌ Found $INTL_COUNT Intl.NumberFormat violations"
  echo "     Files:"
  grep -r "new Intl.NumberFormat" src/components/ --include="*.tsx" -l | sed 's/^/     - /'
  VIOLATIONS=$((VIOLATIONS + INTL_COUNT))
else
  echo "  ✅ No Intl.NumberFormat violations"
fi
echo ""

# Check 4: Inline formatter functions
echo "📊 Checking for inline formatter functions..."
INLINE_FORMAT_COUNT=$(grep -r "const format[A-Z].*=" src/components/ --include="*.tsx" | wc -l | tr -d ' ')
if [ "$INLINE_FORMAT_COUNT" -gt 0 ]; then
  echo "  ⚠️  Found $INLINE_FORMAT_COUNT inline formatter functions"
  echo "     Files:"
  grep -r "const format[A-Z].*=" src/components/ --include="*.tsx" -l | sed 's/^/     - /'
  VIOLATIONS=$((VIOLATIONS + INLINE_FORMAT_COUNT))
else
  echo "  ✅ No inline formatter violations"
fi
echo ""

# Check 5: Function formatters
echo "📊 Checking for function formatter definitions..."
FUNC_FORMAT_COUNT=$(grep -r "function format[A-Z]" src/components/ --include="*.tsx" | wc -l | tr -d ' ')
if [ "$FUNC_FORMAT_COUNT" -gt 0 ]; then
  echo "  ⚠️  Found $FUNC_FORMAT_COUNT function formatter definitions"
  echo "     Note: Some wrapper functions are OK for backward compatibility"
  echo "     Files:"
  grep -r "function format[A-Z]" src/components/ --include="*.tsx" -l | sed 's/^/     - /'
fi
echo ""

# Check 6: Verify Formatters imports in files that need them
echo "📊 Checking files that import from @/lib/financial..."
FORMATTERS_IMPORTS=$(grep -r "from '@/lib/financial'" src/components/ --include="*.tsx" | wc -l | tr -d ' ')
echo "  ✅ $FORMATTERS_IMPORTS files import from @/lib/financial"
echo ""

# Summary
echo "================================================"
echo "📋 COMPLIANCE SUMMARY"
echo "================================================"
echo ""
echo "Total Violations: $VIOLATIONS"
echo ""

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "🎉 All checks passed! Codebase is compliant."
  echo ""
  exit 0
else
  echo "⚠️  Violations found. See COMPLIANCE_AUDIT.md for refactoring plan."
  echo ""
  echo "Quick Stats:"
  echo "  - toFixed(): $TOFIXED_COUNT"
  echo "  - toLocaleString(): $TOLOCALE_COUNT"  
  echo "  - Intl.NumberFormat: $INTL_COUNT"
  echo "  - Inline formatters: $INLINE_FORMAT_COUNT"
  echo ""
  echo "Run this script after each file refactor to track progress."
  echo ""
  exit 1
fi
