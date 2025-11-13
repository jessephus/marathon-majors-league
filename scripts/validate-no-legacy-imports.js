#!/usr/bin/env node
/**
 * CI Guard: Validate No Legacy Imports
 * 
 * This script ensures that no code references the removed legacy monolith files:
 * - public/app.js (removed)
 * - public/salary-cap-draft.js (removed)
 * 
 * Usage: node scripts/validate-no-legacy-imports.js
 * Exit codes:
 *   0 - Success (no legacy imports found)
 *   1 - Failure (legacy imports found or script error)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Files and directories to skip
const SKIP_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.vercel',
  'scripts/validate-no-legacy-imports.js', // Skip this file itself
];

// Patterns to search for (case-insensitive)
const LEGACY_PATTERNS = [
  /src=["']\/salary-cap-draft\.js["']/gi,
  /import.*from.*["']\/public\/app\.js["']/gi,
  /import.*from.*["']\/public\/salary-cap-draft\.js["']/gi,
  /require\(["']\.\.?\/public\/app\.js["']\)/gi,
  /require\(["']\.\.?\/public\/salary-cap-draft\.js["']\)/gi,
];

// Allowed exceptions (historical comments, documentation)
const ALLOWED_EXCEPTIONS = [
  // Historical comments in utilities
  /Originally extracted from public\/app\.js \(now removed\)/i,
  /public\/app\.js \(now removed\)/i,
  /public\/app\.js, now removed\)/i,
  /public\/salary-cap-draft\.js, now removed\)/i,
  
  // Documentation files can reference history
  /\.md:.*public\/app\.js/i,
  /\.md:.*public\/salary-cap-draft\.js/i,
  
  // Example migration files
  /examples\/.*\.tsx?:.*public\/app\.js \(legacy monolith, now removed\)/i,
];

/**
 * Check if a file path should be skipped
 */
function shouldSkip(filePath) {
  const relativePath = relative(rootDir, filePath);
  return SKIP_PATTERNS.some(pattern => relativePath.includes(pattern));
}

/**
 * Check if a match is allowed (exception)
 */
function isAllowedException(match) {
  return ALLOWED_EXCEPTIONS.some(pattern => pattern.test(match));
}

/**
 * Recursively search directory for legacy imports
 */
function searchDirectory(dir, violations = []) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    
    if (shouldSkip(fullPath)) {
      continue;
    }
    
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      searchDirectory(fullPath, violations);
    } else if (stat.isFile()) {
      // Check relevant file extensions
      if (/\.(js|jsx|ts|tsx|html)$/i.test(item)) {
        searchFile(fullPath, violations);
      }
    }
  }
  
  return violations;
}

/**
 * Search a single file for legacy patterns
 */
function searchFile(filePath, violations) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const relativePath = relative(rootDir, filePath);
    
    for (const pattern of LEGACY_PATTERNS) {
      const matches = content.match(pattern);
      
      if (matches) {
        for (const match of matches) {
          const contextMatch = `${relativePath}: ${match}`;
          
          if (!isAllowedException(contextMatch)) {
            violations.push({
              file: relativePath,
              match: match.trim(),
              pattern: pattern.source,
            });
          }
        }
      }
    }
  } catch (error) {
    // Silently skip files that can't be read (binary files, etc.)
    if (error.code !== 'EISDIR') {
      console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    }
  }
  
  return violations;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Validating no legacy imports...\n');
  
  const violations = searchDirectory(rootDir);
  
  if (violations.length === 0) {
    console.log('✅ Success! No legacy imports found.\n');
    console.log('The following legacy files have been successfully removed:');
    console.log('  - public/app.js');
    console.log('  - public/salary-cap-draft.js\n');
    return 0;
  }
  
  console.error('❌ Failure! Found legacy imports:\n');
  
  for (const violation of violations) {
    console.error(`File: ${violation.file}`);
    console.error(`Match: ${violation.match}`);
    console.error(`Pattern: ${violation.pattern}`);
    console.error('');
  }
  
  console.error(`Total violations: ${violations.length}\n`);
  console.error('Please remove all references to the deleted legacy files:');
  console.error('  - public/app.js (removed)');
  console.error('  - public/salary-cap-draft.js (removed)\n');
  
  return 1;
}

// Run the script
const exitCode = main();
process.exit(exitCode);
