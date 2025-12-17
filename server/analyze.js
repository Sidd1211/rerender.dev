/**
 * Safe built-in initializers for useState that should not be flagged.
 */
const SAFE_USESTATE_INITIALIZERS = new Set([
  'Number',
  'String',
  'Boolean',
  'Object',
  'Array',
  'Date'
]);

/**
 * Metadata for the analysis rules.
 */
const ANALYSIS_RULES = [

  // ========================================================================
  // A. HOOKS RULES (Correctness & Intent)
  // ========================================================================
  {
    id: 'A001',
    type: 'useEffect-missing-deps',
    title: 'Missing dependency array in useEffect',
    why: 'This effect runs after every render, which may cause unnecessary work or unintended behavior.',
    fix: 'Add a dependency array (`[]` or `[deps]`) to control when the effect runs.',
    severity: 'High',
    regex: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)/g,
  },

  {
    id: 'A002',
    type: 'useMemo-useCallback-missing-deps',
    title: 'useMemo / useCallback missing dependency array',
    why: 'Using these hooks without a dependency array provides no memoization benefit.',
    fix: 'Always pass a dependency array. Remove the hook if memoization is unnecessary.',
    severity: 'Medium',
    regex: /(useMemo|useCallback)\s*\(\s*(\([^\)]*\)\s*=>\s*\{[^}]*\})\s*\)(?!\s*,\s*\[)/g,
  },

  {
    id: 'A003',
    type: 'useState-function-reference',
    title: 'useState initialized with function reference',
    why: 'Passing a function reference to useState stores the function itself as state. This is often unintentional.',
    fix: 'If you intend to compute an initial value, wrap the call: useState(() => computeValue()).',
    severity: 'Low',
    regex: /useState\(\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g,
    suppressBuiltIns: true
  },

  // ========================================================================
  // B. PERFORMANCE & RENDER OPTIMIZATION RULES
  // ========================================================================

  // 🔴 STRONG RULE — breaks memoization
  {
    id: 'B001A',
    type: 'inline-function-breaks-memoization',
    title: 'Inline function breaks memoization',
    why: 'This inline function is passed to a memoized component. A new function is created on every render, defeating React.memo.',
    fix: 'Extract the handler and memoize it using useCallback before passing it to the memoized component.',
    severity: 'High',
    requiresMemoContext: true,
    regex: /(on[A-Z][^=]*|onClick|onChange)=\s*\{\s*\([^\)]*\)\s*=>\s*[^}]*\}/g,
  },

  // 🟡 CONTEXT-DEPENDENT RULE
  {
    id: 'B001B',
    type: 'jsx-inline-arrow-function',
    title: 'Inline arrow function in JSX prop (context-dependent)',
    why: 'Inline arrow functions create a new function on every render. This is usually fine, but can cause unnecessary re-renders when passed to memoized or frequently re-rendered components.',
    fix: 'If this prop is passed to a memoized or frequently rendered child, consider extracting or memoizing the handler.',
    severity: 'Info',
    regex: /(on[A-Z][^=]*|onClick|onChange)=\s*\{\s*\([^\)]*\)\s*=>\s*[^}]*\}/g,
  },

  {
    id: 'B002',
    type: 'jsx-inline-object-literal',
    title: 'Inline object or array literal in JSX prop',
    why: 'New object or array references are created on every render, causing unnecessary re-renders.',
    fix: 'Move the object/array outside the component or memoize it with useMemo.',
    severity: 'Medium',
    regex: /(config|options|data|items|settings)=\s*\{\s*(\{[^}]*\}|\[[^\]]*\])\s*\}/g,
  },

  {
    id: 'B003',
    type: 'jsx-array-index-key',
    title: 'Using array index as key',
    why: 'Using index as key can cause incorrect UI updates when list order changes.',
    fix: 'Use a stable, unique identifier from the data instead.',
    severity: 'High',
    regex: /key\s*=\s*\{\s*(index|i)\s*\}/g,
  },

  // ========================================================================
  // C. ACCESSIBILITY RULES
  // ========================================================================
  {
    id: 'C001',
    type: 'a11y-missing-alt',
    title: 'Image missing alt attribute',
    why: 'Missing alt text harms accessibility for screen reader users.',
    fix: 'Add a meaningful alt attribute or use alt="" for decorative images.',
    severity: 'High',
    regex: /<img\s+(?!.*alt=)/gi,
  },

  {
    id: 'C002',
    type: 'a11y-missing-label',
    title: 'Form control missing label',
    why: 'Form elements without labels are inaccessible to assistive technologies.',
    fix: 'Add a <label>, aria-label, or aria-labelledby.',
    severity: 'Medium',
    regex: /<(input|textarea|select)\s+(?!.*(id=|aria-label=|aria-labelledby=))/gi,
  },
];

/**
 * Main analysis function.
 */
function analyze(code) {
  if (!code || typeof code !== 'string') {
    return {
      timestamp: new Date().toISOString(),
      status: 'Error',
      error: 'Invalid or missing code provided.'
    };
  }

  const issues = [];

  // 🔑 Detect memoization context once per file
  const hasMemoizedComponent = /React\.memo\s*\(/.test(code);

  ANALYSIS_RULES.forEach(rule => {
    let match;
    rule.regex.lastIndex = 0;

    // Skip memo-required rules if no memoization exists
    if (rule.requiresMemoContext && !hasMemoizedComponent) {
      return;
    }

    while ((match = rule.regex.exec(code)) !== null) {
      const matchText = match[0].trim();
      const initializerName = match[1];

      // Suppress safe built-in initializers for A003
      if (
        rule.id === 'A003' &&
        rule.suppressBuiltIns &&
        SAFE_USESTATE_INITIALIZERS.has(initializerName)
      ) {
        continue;
      }

      const startIndex = match.index;
      const lineNumber = (code.slice(0, startIndex).match(/\n/g) || []).length + 1;

      issues.push({
        id: rule.id,
        type: rule.type,
        title: rule.title,
        why: rule.why,
        fix: rule.fix,
        severity: rule.severity,
        occurrence: {
          lineNumber,
          snippet: matchText,
          charStart: startIndex,
          charEnd: startIndex + matchText.length
        }
      });
    }
  });

  const severityRank = { High: 3, Medium: 2, Low: 1, Info: 0 };

  return {
    timestamp: new Date().toISOString(),
    status: issues.length ? 'Issues Found' : 'Clean',
    totalIssues: issues.length,
    issues: issues.sort((a, b) =>
      severityRank[b.severity] - severityRank[a.severity] ||
      a.occurrence.lineNumber - b.occurrence.lineNumber
    )
  };
}

module.exports = { analyze };
