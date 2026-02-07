export default function OutputPanel({ status, output, error }) {
  return (
    <div className="w-1/2 p-4 bg-white border-l font-mono">
      {status === "running" && <p>Running…</p>}
      {output && <pre>{output}</pre>}
      {error && <pre className="text-red-600">{error}</pre>}
    </div>
  );
}
