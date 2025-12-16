import { useState } from "react";
// Import the new CSS file
import './App.css'; // Make sure this path is correct for your project structure

const API_URL = "https://rerender-dev.onrender.com/analyze";

function App() {
  const [code, setCode] = useState("");
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError("Paste some React code first.");
      return;
    }

    setLoading(true);
    setError("");
    setIssues([]);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      
      if (!res.ok || data.status === 'Error') {
          setError(data.error || "Analysis failed due to a server error.");
          return;
      }
      
      setIssues(data.issues || []);
    } catch (err) {
      setError("Failed to connect to the analysis server. Is the backend running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Use className instead of style attribute
    <div className="analyzer-container">
      <div className="header-section">
        <h1>{"{ Rerender.dev }"}</h1>
        <p>Find unnecessary re-renders, stale closures, and other React performance leaks using static code analysis.</p>
      </div>

      <textarea
        rows={14}
        className="code-textarea"
        placeholder="Paste your React component here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button
        onClick={analyzeCode}
        // Use a standard class and conditional class for loading
        className={`analyze-button ${loading ? 'analyze-button-loading' : ''}`}
        disabled={loading}
      >
        {loading ? "Finding... performance issues" : "Find Performance Issues"}
      </button>

      {error && <p className="error-message">{error}</p>}
      
      {/* --- Results Section --- */}
      {issues.length > 0 && (
        <div className="results-container">
          <h3>Analysis Report ({issues.length} Issues Found)</h3>
          
          <ul className="issue-list">
            {issues.map((issue, id) => (
              // Use data-severity attribute to conditionally style via CSS
              <li key={id} className="issue-item" data-severity={issue.severity}>
                
                {/* Title and Severity */}
                <div className="issue-title">
                  {issue.severity} — {issue.title}
                </div>
                
                {/* Code Snippet */}
                {issue.occurrence?.snippet && (
                    <div className="snippet-container">
                        <pre className="code-snippet">
                          <span className="snippet-line-number">Line {issue.occurrence.lineNumber}:</span>
                          <br />
                          {issue.occurrence.snippet}
                        </pre>
                    </div>
                )}
                
                {/* Details */}
                <div>
                    <p style={{ marginTop: '10px', marginBottom: '5px' }}>
                        <span className="detail-label">Type:</span>
                        <span className="detail-span">{issue.type}</span>
                    </p>
                    <p style={{ marginBottom: '5px' }}>
                        <span className="detail-label">Reason:</span>
                        <span className="detail-span">{issue.why}</span>
                    </p>
                    <p className="fix-suggestion">
                        <span className="detail-label">Suggested Fix:</span>
                        <span className="detail-span">{issue.fix}</span>
                    </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Render Clean Message */}
      {!loading && !error && code.trim() && issues.length === 0 && (
        <p className="clean-message">
            ✅ Code is clean! No common performance issues detected.
        </p>
      )}
    </div>
  );
}

export default App;
