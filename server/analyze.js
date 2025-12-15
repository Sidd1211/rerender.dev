/**
 * Metadata for the analysis rules, matching the standardized JSON format.
 */
const ANALYSIS_RULES = [

    // ========================================================================
    // A. HOOKS RULES (Correctness & Stale Closures)
    // ========================================================================
    {
      id: 'A001',
      type: 'useEffect-missing-deps',
      title: 'Missing dependency array in useEffect',
      why: 'This effect runs after every render, potentially causing infinite loops or performance degradation by re-running unnecessary cleanup and setup on every state change.',
      fix: 'Add an empty dependency array (`[]`) if the effect should only run once, or include all external variables and functions referenced inside the effect.',
      severity: 'High',
      // Detects: useEffect(() => {...} ) followed immediately by closing parenthesis, assuming no dependencies.
      regex: /useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\}\s*\)/g,
    },
    {
      id: 'A002',
      type: 'useMemo-missing-deps',
      title: 'useMemo/useCallback missing dependency array',
      why: 'If `useMemo` or `useCallback` is used without a dependency array, it provides no memoization benefit and may even hurt performance slightly due to the overhead of the hook call.',
      fix: 'Always provide a dependency array (`[]` or `[deps]`). If you do not need memoization, remove the hook.',
      severity: 'Medium',
      // Detects: useMemo(...) or useCallback(...) without the final array argument
      regex: /(useMemo|useCallback)\s*\(\s*(\([^\)]*\)\s*=>\s*\{[^}]*\}|[^,]*)\s*\)/g,
    },
    {
      id: 'A003',
      type: 'useState-incorrect-initializer',
      title: 'useState slow initializer function',
      why: 'If `useState` is initialized with a function instead of a simple value, that function is executed on *every* render, wasting CPU cycles. Initializer functions should only be used for expensive computations.',
      fix: 'If the initializer is expensive, wrap it in an arrow function (`useState(() => expensiveFunc())`). If it is not expensive, use the value directly (`useState(simpleValue)`).',
      severity: 'Low',
      // Heuristic: Detects useState(someFunction) where 'someFunction' is a pre-defined function reference (usually simple reference)
      regex: /useState\(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\)/g,
    },

    // ========================================================================
    // B. PERFORMANCE & RENDER OPTIMIZATION RULES (Props Instability)
    // ========================================================================
    {
      id: 'B001',
      type: 'jsx-inline-arrow-function',
      title: 'Inline arrow function in JSX prop (Anonymous functions)',
      why: 'A new function instance is created on every render, which prevents memoized child components (like `React.memo`) from optimizing rendering, leading to unnecessary re-renders.',
      fix: 'Define the function outside the component or use the `useCallback` hook to memoize the function reference.',
      severity: 'Medium',
      // Detects: onClick={() => ... } or similar inline prop functions
      regex: /(on[A-Z][^=]*|value|onChange|onClick)=\s*\{\s*\([^\)]*\)\s*=>\s*[^}]*\}/g,
    },
    {
      id: 'B002',
      type: 'jsx-inline-object-literal',
      title: 'Inline object/array literal in JSX prop',
      why: 'A new object or array instance is created on every render. Even if the content is the same, the reference changes, forcing unnecessary re-renders in memoized child components.',
      fix: 'Define the object/array outside the component or use the `useMemo` hook to memoize the reference.',
      severity: 'Medium',
      // Detects: prop={ {key: value} } or prop={[1, 2, 3]}
      regex: /(data|style|options|items|config|user|settings)=\s*\{\s*(\{[^}]*\}|\[[^\]]*\])\s*\}/g,
    },
    {
      id: 'B003',
      type: 'jsx-array-index-key',
      title: 'Using array index as key in list rendering',
      why: 'Using the array index as the `key` prop can cause incorrect behavior and performance issues when the list items are reordered, filtered, or added/removed. React cannot efficiently track the element identities.',
      fix: 'Use a unique, stable ID from the data itself (e.g., `item.id`). If no stable ID exists, you may need to generate one.',
      severity: 'High',
      // Detects: key={index} or key={i} inside a map function call (heuristic)
      regex: /key\s*=\s*\{\s*(index|i)\s*\}/g,
    },

    // ========================================================================
    // C. JSX AND ACCESSIBILITY (A11y) RULES
    // ========================================================================
    {
      id: 'C001',
      type: 'a11y-missing-alt',
      title: 'Image element missing `alt` prop',
      why: 'The `alt` prop is essential for screen readers to describe the image content to visually impaired users. Missing it severely impacts accessibility.',
      fix: 'Add the `alt` prop with a meaningful description of the image content. Use `alt=""` for purely decorative images.',
      severity: 'High',
      // Detects: <img ... > where alt is not present
      regex: /<img\s+(?!.*alt=)/gi,
    },
    {
      id: 'C002',
      type: 'a11y-missing-label',
      title: 'Form control missing label',
      why: 'Form elements like `<input>`, `<textarea>`, and `<select>` must be associated with a label for accessibility. Users relying on assistive technology may not be able to interact with the control.',
      fix: 'Use the standard `<label htmlFor="...">` element or use the `aria-label` attribute.',
      severity: 'Medium',
      // Heuristic: Detects <input ... > where neither id nor aria-label/labelledby are present
      regex: /<(input|textarea|select)\s+(?!.*(id=|aria-label=|aria-labelledby=))/gi,
    },
    
    // ========================================================================
    // D. HIGH-LEVEL OPTIMIZATION RULES
    // ========================================================================
    {
      id: 'D001',
      type: 'memo-missing-large-component',
      title: 'Missing React.memo on potentially large component',
      why: 'Components that render complex DOM structures, large lists, or frequently receive unstable props (like inline functions/objects) should be wrapped in `React.memo` to skip unnecessary re-renders when their props have not changed.',
      fix: 'Wrap the component definition in `React.memo(...)` or consider using `useMemo` if the component uses hooks internally.',
      severity: 'Medium',
      // Heuristic: Detects a named function component that is NOT wrapped in React.memo (assuming the component is "large" based on common usage patterns like using `useState` or `useEffect`).
      regex: /function\s+([A-Z][a-zA-Z0-9]*)\s*\([^)]*\)\s*\{[^}]*?(useState|useEffect)[^}]*?\}\s*export\s+default\s+\1\s*;/gs,
    },
];

/**
 * Main analysis function (uses the rules above).
 * @param {string} code - The code string to analyze.
 * @returns {object} The analysis result JSON.
 */
function analyze(code) {
  if (!code || typeof code !== 'string') {
    return { 
        timestamp: new Date().toISOString(),
        status: 'Error',
        error: 'Invalid or missing code provided.' 
    };
  }

  const analysisResults = [];
  let issueCount = 0;

  ANALYSIS_RULES.forEach(rule => {
    let match;
    rule.regex.lastIndex = 0;

    while ((match = rule.regex.exec(code)) !== null) {
      if (match.index === rule.regex.lastIndex) {
        rule.regex.lastIndex++;
      }

      const matchText = match[0].trim();
      const startIndex = match.index;
      const lineNumber = (code.substring(0, startIndex).match(/\n/g) || []).length + 1;

      const issue = {
        type: rule.type,
        title: rule.title,
        why: rule.why,
        fix: rule.fix,
        severity: rule.severity,
        occurrence: {
            lineNumber: lineNumber,
            snippet: matchText,
            charStart: startIndex,
            charEnd: startIndex + matchText.length
        }
      };
      
      analysisResults.push(issue);
      issueCount++;
    }
  });

  return {
    timestamp: new Date().toISOString(),
    status: issueCount > 0 ? 'Issues Found' : 'Clean',
    totalIssues: issueCount,
    issues: analysisResults.sort((a, b) => {
        // Sort by severity (High > Medium > Low) then by line number
        const severityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const severityA = severityOrder[a.severity] || 0;
        const severityB = severityOrder[b.severity] || 0;
        
        if (severityB !== severityA) {
            return severityB - severityA;
        }
        return a.occurrence.lineNumber - b.occurrence.lineNumber;
    })
  };
}

module.exports = { analyze };