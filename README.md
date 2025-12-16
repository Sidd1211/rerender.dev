# ReRender.dev — React Performance Analyzer

Analyze React components for unnecessary re-renders, bad `useEffect` patterns, and memoization-breaking props.

ReRender.dev is a lightweight **React performance analysis tool** that scans pasted component code and highlights common patterns that silently cause slow renders in production React applications.

👉 Live demo: https://rerender-dev.vercel.app/

---

## 🔍 What problem does this solve?

Many React apps feel slow even when there are no obvious bugs.

Common causes include:
- `useEffect` running on every render
- Inline functions and objects breaking `React.memo`
- Components re-rendering more than necessary

These issues are easy to miss during development and code reviews.

**ReRender.dev helps React developers detect these performance pitfalls quickly and understand why they matter.**

---

## ✨ Features

ReRender.dev currently detects:

- Missing dependency array in `useEffect`
- `useEffect` with empty dependencies but external variable usage
- Inline arrow functions passed as JSX props
- Inline object and array literals passed as JSX props
- Memoization-breaking patterns in common React component structures

Each detected issue includes:
- Severity level
- Line reference
- Explanation of the problem
- Suggested fix

---

## 🚀 How to use

1. Open https://rerender-dev.vercel.app/
2. Paste a React component
3. Click **Find performance issues**
4. Review detected issues and suggestions

No login. No configuration. No project setup.

---

## 🧪 Example test component

Paste this example to see multiple issues flagged:

```jsx
function Demo({ value }) {
  useEffect(() => {
    console.log(value);
  });

  return (
    <Child
      onClick={() => console.log("click")}
      config={{ mode: "dark" }}
    />
  );
}
