#!/usr/bin/env node
/**
 * Test Quality Validator
 * 
 * This script validates that test suites are actually testing real behavior
 * and not just passing on dummy data or trivial conditions.
 * 
 * Usage: node scripts/validate-test-quality.js [test-file]
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Quality checks for test files
 */
const qualityChecks = [
  {
    name: 'Has actual assertions',
    check: (content) => {
      const assertionPatterns = [
        /assert\./,
        /expect\(/,
        /\.toBe\(/,
        /\.toEqual\(/,
      ];
      return assertionPatterns.some(pattern => pattern.test(content));
    },
    severity: 'critical',
    message: 'Test file has no assertions - tests are not validating anything!'
  },
  {
    name: 'Checks response status codes',
    check: (content) => /assert.*status|status.*assert|strictEqual.*status/.test(content),
    severity: 'high',
    message: 'Tests should verify HTTP response status codes'
  },
  {
    name: 'Validates response data structure',
    check: (content) => {
      const patterns = [
        /assert.*\.ok\(/,
        /assert.*data\./,
        /typeof.*===|===.*typeof/,
        /Array\.isArray/,
      ];
      return patterns.some(pattern => pattern.test(content));
    },
    severity: 'high',
    message: 'Tests should validate response data structure'
  },
  {
    name: 'Has negative test cases',
    check: (content) => {
      const negativePatterns = [
        /should.*fail|should.*reject|should.*error/i,
        /should.*return.*40[0-9]|should.*return.*50[0-9]/i,
        /invalid|missing|wrong|incorrect/i,
      ];
      return negativePatterns.some(pattern => pattern.test(content));
    },
    severity: 'medium',
    message: 'Tests should include negative test cases (error handling)'
  },
  {
    name: 'Uses real API endpoints',
    check: (content) => /\/api\/[a-z-]+/.test(content),
    severity: 'critical',
    message: 'Tests should call actual API endpoints, not mocked data'
  },
  {
    name: 'Avoids hardcoded success values',
    check: (content) => {
      // Look for suspicious patterns like always comparing to true
      const suspiciousPatterns = [
        /assert.*===\s*true\s*\)/,
        /assert.*===\s*\d+\s*\)/,
      ];
      const count = content.match(/assert/g)?.length || 0;
      const suspiciousCount = suspiciousPatterns.reduce((sum, pattern) => 
        sum + (content.match(pattern)?.length || 0), 0
      );
      // If more than 50% of assertions are suspicious, flag it
      return suspiciousCount < count * 0.5;
    },
    severity: 'medium',
    message: 'Many assertions compare to hardcoded true/numbers - might not catch real failures'
  },
  {
    name: 'Has multiple test cases',
    check: (content) => {
      const testCount = (content.match(/it\(|test\(/g) || []).length;
      return testCount >= 3;
    },
    severity: 'low',
    message: 'Test file should have multiple test cases for better coverage'
  },
  {
    name: 'Tests edge cases',
    check: (content) => {
      const edgeCasePatterns = [
        /empty|null|undefined|zero|negative/i,
        /edge\s*case|corner\s*case|boundary/i,
        /maximum|minimum|limit/i,
      ];
      return edgeCasePatterns.some(pattern => pattern.test(content));
    },
    severity: 'low',
    message: 'Consider adding tests for edge cases and boundary conditions'
  },
  {
    name: 'Verifies actual data values',
    check: (content) => {
      const patterns = [
        /assert.*\.length\s*>/,
        /assert.*\.length\s*>=\s*\d+/,
        /assert.*\.includes\(/,
        /assert.*\[0\]|assert.*\.first/,
      ];
      return patterns.some(pattern => pattern.test(content));
    },
    severity: 'high',
    message: 'Tests should verify actual data values, not just presence'
  },
];

/**
 * Analyze a test file for quality issues
 */
function analyzeTestFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const results = {
    file: filePath,
    passed: [],
    failed: [],
    warnings: [],
    critical: [],
  };

  for (const check of qualityChecks) {
    const passed = check.check(content);
    
    if (passed) {
      results.passed.push(check.name);
    } else {
      const result = {
        name: check.name,
        message: check.message,
        severity: check.severity,
      };
      
      results.failed.push(result);
      
      if (check.severity === 'critical') {
        results.critical.push(result);
      } else if (check.severity === 'high') {
        results.warnings.push(result);
      }
    }
  }

  return results;
}

/**
 * Calculate test quality score
 */
function calculateScore(results) {
  const weights = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0.5,
  };

  let maxScore = 0;
  let earnedScore = 0;

  for (const check of qualityChecks) {
    const weight = weights[check.severity];
    maxScore += weight;
    
    if (results.passed.includes(check.name)) {
      earnedScore += weight;
    }
  }

  return Math.round((earnedScore / maxScore) * 100);
}

/**
 * Print results
 */
function printResults(results) {
  const score = calculateScore(results);
  const fileName = results.file.split('/').pop();
  
  console.log('\n' + '='.repeat(70));
  console.log(colorize(`📊 Test Quality Analysis: ${fileName}`, 'cyan'));
  console.log('='.repeat(70));
  
  // Score with color
  let scoreColor = 'green';
  if (score < 60) scoreColor = 'red';
  else if (score < 80) scoreColor = 'yellow';
  
  console.log(colorize(`\n🎯 Quality Score: ${score}/100`, scoreColor));
  
  // Critical issues
  if (results.critical.length > 0) {
    console.log(colorize('\n🚨 CRITICAL ISSUES:', 'red'));
    results.critical.forEach(issue => {
      console.log(colorize(`  ❌ ${issue.name}`, 'red'));
      console.log(`     ${issue.message}`);
    });
  }
  
  // Warnings
  if (results.warnings.length > 0) {
    console.log(colorize('\n⚠️  WARNINGS:', 'yellow'));
    results.warnings.forEach(issue => {
      console.log(colorize(`  ⚠️  ${issue.name}`, 'yellow'));
      console.log(`     ${issue.message}`);
    });
  }
  
  // Other failed checks
  const otherFailed = results.failed.filter(
    f => f.severity !== 'critical' && f.severity !== 'high'
  );
  if (otherFailed.length > 0) {
    console.log(colorize('\n💡 SUGGESTIONS:', 'blue'));
    otherFailed.forEach(issue => {
      console.log(colorize(`  • ${issue.name}`, 'blue'));
      console.log(`    ${issue.message}`);
    });
  }
  
  // What's working well
  if (results.passed.length > 0) {
    console.log(colorize('\n✅ PASSING CHECKS:', 'green'));
    results.passed.slice(0, 5).forEach(check => {
      console.log(colorize(`  ✓ ${check}`, 'green'));
    });
    if (results.passed.length > 5) {
      console.log(colorize(`  ... and ${results.passed.length - 5} more`, 'green'));
    }
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  return score;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const testsDir = join(dirname(__dirname), 'tests');
  
  let testFiles;
  
  if (args.length > 0) {
    // Analyze specific file(s)
    testFiles = args.map(arg => {
      if (arg.startsWith('/')) return arg;
      if (arg.includes('/')) return join(dirname(__dirname), arg);
      return join(testsDir, arg);
    });
  } else {
    // Analyze all test files
    const files = readdirSync(testsDir);
    testFiles = files
      .filter(f => f.endsWith('.test.js'))
      .map(f => join(testsDir, f));
  }
  
  console.log(colorize('\n🔍 Test Quality Validator\n', 'cyan'));
  console.log(`Analyzing ${testFiles.length} test file(s)...\n`);
  
  const allResults = [];
  let totalScore = 0;
  
  for (const file of testFiles) {
    try {
      const results = analyzeTestFile(file);
      const score = printResults(results);
      allResults.push({ file, score, results });
      totalScore += score;
    } catch (error) {
      console.error(colorize(`❌ Error analyzing ${file}:`, 'red'), error.message);
    }
  }
  
  // Summary
  if (allResults.length > 1) {
    console.log('\n' + '='.repeat(70));
    console.log(colorize('📈 OVERALL SUMMARY', 'cyan'));
    console.log('='.repeat(70));
    
    const avgScore = Math.round(totalScore / allResults.length);
    let avgColor = 'green';
    if (avgScore < 60) avgColor = 'red';
    else if (avgScore < 80) avgColor = 'yellow';
    
    console.log(colorize(`\nAverage Quality Score: ${avgScore}/100`, avgColor));
    
    // Top performers
    const sorted = allResults.sort((a, b) => b.score - a.score);
    const perfect = sorted.filter(r => r.score === 100);
    const good = sorted.filter(r => r.score >= 80 && r.score < 100);
    const needsWork = sorted.filter(r => r.score < 80);
    
    if (perfect.length > 0) {
      console.log(colorize(`\n✨ Perfect Tests (100/100): ${perfect.length}`, 'green'));
      perfect.forEach(result => {
        const fileName = result.file.split('/').pop();
        console.log(colorize(`   ✓ ${fileName}`, 'green'));
      });
    }
    
    if (good.length > 0) {
      console.log(colorize(`\n✅ Good Tests (80-99/100): ${good.length}`, 'green'));
      good.forEach(result => {
        const fileName = result.file.split('/').pop();
        console.log(`   • ${fileName}: ${result.score}/100`);
      });
    }
    
    if (needsWork.length > 0) {
      console.log(colorize(`\n⚠️  Needs Improvement (<80/100): ${needsWork.length}`, 'yellow'));
      needsWork.forEach(result => {
        const fileName = result.file.split('/').pop();
        console.log(colorize(`   • ${fileName}: ${result.score}/100`, 'yellow'));
      });
    }
    
    // Quick summary
    console.log(colorize('\n📊 Quality Distribution:', 'cyan'));
    console.log(`   Perfect (100):     ${colorize(perfect.length.toString(), 'green')}`);
    console.log(`   Good (80-99):      ${good.length}`);
    console.log(`   Needs Work (<80):  ${needsWork.length > 0 ? colorize(needsWork.length.toString(), 'yellow') : '0'}`);
    
    console.log('\n' + '='.repeat(70) + '\n');
  } else if (allResults.length === 1) {
    // Single file analysis - show quick verdict
    const score = allResults[0].score;
    const fileName = allResults[0].file.split('/').pop();
    
    console.log(colorize('\n✨ Quick Verdict:', 'cyan'));
    if (score === 100) {
      console.log(colorize(`   ${fileName} is EXCELLENT! No improvements needed.`, 'green'));
    } else if (score >= 80) {
      console.log(colorize(`   ${fileName} is GOOD. Minor improvements suggested above.`, 'green'));
    } else if (score >= 60) {
      console.log(colorize(`   ${fileName} is OK. Review warnings above.`, 'yellow'));
    } else {
      console.log(colorize(`   ${fileName} NEEDS WORK. Address critical issues above.`, 'red'));
    }
    console.log();
  }
  
  // Exit code based on critical issues
  const hasCritical = allResults.some(r => r.results.critical.length > 0);
  process.exit(hasCritical ? 1 : 0);
}

main();
