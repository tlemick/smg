#!/usr/bin/env tsx
/**
 * Schema Audit Script
 * 
 * Checks for:
 * - Unused fields in schema
 * - Models without documentation
 * - Potential enum candidates
 * - Naming consistency issues
 * - Missing indexes
 * 
 * Run: npm run audit:schema
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SCHEMA_PATH = path.join(__dirname, '../prisma/schema.prisma');
const SRC_PATH = path.join(__dirname, '../src');

interface AuditResult {
  category: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

const results: AuditResult[] = [];

function log(category: string, severity: AuditResult['severity'], message: string, details?: string) {
  results.push({ category, severity, message, details });
}

// Read schema file
const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');

console.log('🔍 Starting Schema Audit...\n');

// ============================================================================
// 1. Documentation Check
// ============================================================================
console.log('1️⃣  Checking model documentation...');

const modelMatches = schemaContent.matchAll(/^model (\w+) \{/gm);
const modelNames = Array.from(modelMatches).map(m => m[1]);

const documentedModelMatches = schemaContent.matchAll(/\/\/\/.*\n^model (\w+) \{/gm);
const documentedModelNames = Array.from(documentedModelMatches).map(m => m[1]);

const undocumentedModels = modelNames.filter(name => !documentedModelNames.includes(name));

if (undocumentedModels.length > 0) {
  log(
    'Documentation',
    'warning',
    `${undocumentedModels.length} models lack documentation comments`,
    `Models: ${undocumentedModels.join(', ')}`
  );
} else {
  log('Documentation', 'info', 'All models are documented ✓');
}

// ============================================================================
// 2. Naming Consistency Check
// ============================================================================
console.log('2️⃣  Checking naming consistency...');

const fieldMatches = schemaContent.matchAll(/^\s+(\w+)\s+(String|Int|Float|Boolean|DateTime|BigInt|Json)/gm);
const allFields = Array.from(fieldMatches).map(m => m[1]);

const snakeCaseFields = allFields.filter(field => field.includes('_'));
const camelCaseFields = allFields.filter(field => /[a-z][A-Z]/.test(field));

if (snakeCaseFields.length > 0 && camelCaseFields.length > 0) {
  log(
    'Naming',
    'warning',
    'Mixed naming conventions detected (snake_case + camelCase)',
    `snake_case: ${snakeCaseFields.length} fields, camelCase: ${camelCaseFields.length} fields`
  );
} else {
  log('Naming', 'info', 'Naming convention is consistent ✓');
}

// ============================================================================
// 3. Potential Enum Check
// ============================================================================
console.log('3️⃣  Checking for potential enum candidates...');

const stringFieldMatches = schemaContent.matchAll(/^\s+(\w+)\s+String.*?\/\/.*?(USER|ADMIN|PENDING|COMPLETED|STOCK|BOND)/gm);
const potentialEnums = Array.from(stringFieldMatches);

if (potentialEnums.length > 0) {
  potentialEnums.forEach(match => {
    log(
      'Enums',
      'info',
      `Field '${match[1]}' might benefit from enum type`,
      `Currently String with values like: ${match[2]}`
    );
  });
}

// Check for status/type/role fields that are String
const statusTypeRoleFields = schemaContent.match(/^\s+(status|type|role)\s+String/gm);
if (statusTypeRoleFields && statusTypeRoleFields.length > 0) {
  log(
    'Enums',
    'warning',
    `${statusTypeRoleFields.length} status/type/role fields use String instead of Enum`,
    `Fields: ${statusTypeRoleFields.map(f => f.trim()).join(', ')}`
  );
}

// ============================================================================
// 4. Float Precision Check (Financial Fields)
// ============================================================================
console.log('4️⃣  Checking for Float usage in financial fields...');

const floatFields = schemaContent.matchAll(/^\s+(\w+)\s+Float/gm);
const floatFieldNames = Array.from(floatFields).map(m => m[1]);

const financialKeywords = ['price', 'cost', 'balance', 'cash', 'total', 'value', 'amount'];
const financialFloatFields = floatFieldNames.filter(field =>
  financialKeywords.some(keyword => field.toLowerCase().includes(keyword))
);

if (financialFloatFields.length > 0) {
  log(
    'Precision',
    'info',
    `${financialFloatFields.length} financial fields use Float (OK if handled with Decimal.js)`,
    `Fields: ${financialFloatFields.join(', ')}`
  );
}

// ============================================================================
// 5. Index Coverage Check
// ============================================================================
console.log('5️⃣  Checking index coverage...');

const foreignKeyMatches = schemaContent.matchAll(/^\s+(\w+)\s+\w+.*@relation.*references/gm);
const foreignKeyFields = Array.from(foreignKeyMatches).map(m => m[1]);

const indexMatches = schemaContent.matchAll(/@@index\(\[(\w+)/g);
const indexedFields = Array.from(indexMatches).map(m => m[1]);

const singleIndexMatches = schemaContent.matchAll(/^\s+(\w+)\s+.*@index/gm);
const singleIndexedFields = Array.from(singleIndexMatches).map(m => m[1]);

const allIndexedFields = [...indexedFields, ...singleIndexedFields];

const missingIndexes = foreignKeyFields.filter(field => !allIndexedFields.includes(field));

if (missingIndexes.length > 0) {
  log(
    'Indexes',
    'warning',
    `${missingIndexes.length} foreign key fields may be missing indexes`,
    `Fields: ${missingIndexes.join(', ')}`
  );
} else {
  log('Indexes', 'info', 'All foreign keys appear to be indexed ✓');
}

// ============================================================================
// 6. Unused Model Check (Simple heuristic)
// ============================================================================
console.log('6️⃣  Checking for potentially unused models...');

function searchInCode(searchTerm: string): number {
  try {
    const result = execSync(
      `grep -r "prisma\\.${searchTerm}" ${SRC_PATH} --include="*.ts" --include="*.tsx" | wc -l`,
      { encoding: 'utf-8' }
    );
    return parseInt(result.trim(), 10);
  } catch (error) {
    return 0;
  }
}

const lowUsageModels: { model: string; usageCount: number }[] = [];

modelNames.forEach(modelName => {
  const camelCaseName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const usageCount = searchInCode(camelCaseName);
  
  if (usageCount === 0) {
    lowUsageModels.push({ model: modelName, usageCount });
  }
});

if (lowUsageModels.length > 0) {
  lowUsageModels.forEach(({ model, usageCount }) => {
    log(
      'Usage',
      'warning',
      `Model '${model}' has ${usageCount} usage(s) in codebase`,
      'May be unused or new. Verify before removing.'
    );
  });
} else {
  log('Usage', 'info', 'All models appear to be used in the codebase ✓');
}

// ============================================================================
// 7. Migration Status Check
// ============================================================================
console.log('7️⃣  Checking migration status...');

try {
  const migrationStatus = execSync('npx prisma migrate status', { encoding: 'utf-8' });
  
  if (migrationStatus.includes('Database schema is up to date')) {
    log('Migrations', 'info', 'Database schema is up to date ✓');
  } else {
    log('Migrations', 'warning', 'Migrations may be pending or out of sync', migrationStatus.trim());
  }
} catch (error: any) {
  log('Migrations', 'error', 'Failed to check migration status', error.message);
}

// ============================================================================
// Print Results
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('📊 SCHEMA AUDIT RESULTS');
console.log('='.repeat(80) + '\n');

const groupedResults = results.reduce((acc, result) => {
  if (!acc[result.category]) {
    acc[result.category] = [];
  }
  acc[result.category].push(result);
  return acc;
}, {} as Record<string, AuditResult[]>);

Object.entries(groupedResults).forEach(([category, categoryResults]) => {
  console.log(`\n📁 ${category}`);
  console.log('-'.repeat(80));
  
  categoryResults.forEach(result => {
    const icon = result.severity === 'error' ? '❌' : result.severity === 'warning' ? '⚠️ ' : '✅';
    console.log(`${icon} ${result.message}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
  });
});

// Summary
const errorCount = results.filter(r => r.severity === 'error').length;
const warningCount = results.filter(r => r.severity === 'warning').length;
const infoCount = results.filter(r => r.severity === 'info').length;

console.log('\n' + '='.repeat(80));
console.log('📈 SUMMARY');
console.log('='.repeat(80));
console.log(`✅ Info:     ${infoCount}`);
console.log(`⚠️  Warnings: ${warningCount}`);
console.log(`❌ Errors:   ${errorCount}`);
console.log('');

if (errorCount > 0) {
  console.log('❌ Schema audit found critical issues. Please address errors before proceeding.');
  process.exit(1);
} else if (warningCount > 0) {
  console.log('⚠️  Schema audit found some warnings. Review and address as needed.');
  process.exit(0);
} else {
  console.log('✅ Schema audit passed! No issues found.');
  process.exit(0);
}
