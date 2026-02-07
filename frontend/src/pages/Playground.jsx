// GridX Consumer – Full React + Tailwind + Axios App.jsx
// White theme with blue accents
// Assumes Tailwind CSS is already configured

import { useState } from "react";
import axios from "axios";

export default function App() {
  const [code, setCode] = useState("print('Hello GridX')");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");


  const runCode = async () => {
    setStatus("running");
    setOutput("");
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/job/sumbit", {
        jobId: `job_${Date.now()}`,
        code,
        
      });

      setOutput(res.data.stdout || "");
      setError(res.data.stderr || "");
      setStatus("done");
    } catch (err) {
      setError(err.response?.data?.error || "Execution failed");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 px-6 flex items-center justify-between border-b bg-white">
        <h1 className="font-semibold text-lg text-blue-600">GridX </h1>
        <span className="text-sm text-green-600">● System Online</span>
      </header>

      {/* Main Section */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-1/2 p-6 flex flex-col gap-4">
          

          {/* Code Editor */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-white border rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Right Panel */}
        <div className="w-1/2 p-6 flex flex-col border-l bg-white">
          <div className="flex-1 border rounded-lg p-4 font-mono text-sm overflow-auto bg-gray-50">
            {status === "running" && <p className="text-blue-600">Running…</p>}
            {output && <pre className="text-gray-800">{output}</pre>}
            {error && <pre className="text-red-600">{error}</pre>}
          </div>
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="p-4 border-t bg-white flex items-center gap-4">
        {/* Runtime Selector */}
        

        {/* Run Button */}
        <button
          onClick={runCode}
          disabled={status === "running"}
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm disabled:opacity-50"
        >
          ▶ Run
        </button>
      </footer>
    </div>
  );
}
