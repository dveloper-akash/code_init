import { useState } from "react";
import CodeEditor from "../components/consumer/CodeEditor";
import OutputPanel from "../components/consumer/OutputPanel";
import { useJobRunner } from "../hooks/useJobRunner";
import TopBar from "../components/consumer/TopBar";


export default function App() {
  const [code, setCode] = useState("print('Hello GridX')");
  const { runJob, status, output, error } = useJobRunner();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <TopBar />

      <main className="flex flex-1">
        <CodeEditor code={code} setCode={setCode} />
        <OutputPanel status={status} output={output} error={error} />
      </main>

      <footer className="p-4 bg-white border-t">
        <button
          onClick={() => runJob(code)}
          disabled={status === "running"}
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          ▶ Run
        </button>
      </footer>
    </div>
  );
}
