export default function CodeEditor({ code, setCode }) {
  return (
    <textarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      className="w-1/2 p-4 font-mono border"
    />
  );
}
