import { useState, useRef } from "react";
import { submitJob } from "../api/jobApi";
import { connectToProvider } from "../sockets/providerSocket";

const CONNECTION_TIMEOUT = 4000; // ms
const EXECUTION_TIMEOUT = 8000;  // ms

export function useJobRunner() {
  const [status, setStatus] = useState("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const cancelledRef = useRef(false);

  const cleanupSocket = () => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const runJob = async (code) => {
    cancelledRef.current = false;
    setStatus("planning");
    setOutput("");
    setError("");

    let jobId, providers, plan;

    try {
      const res = await submitJob(code);
      jobId = res.jobId;
      providers = res.providers; // 👈 ARRAY
      plan = res.plan;
    } catch {
      setError("Failed to plan job");
      setStatus("error");
      return;
    }

    for (let i = 0; i < providers.length; i++) {
      if (cancelledRef.current) return;

      const provider = providers[i];
      setStatus(`connecting (${i + 1}/${providers.length})`);

      try {
        const result = await tryProvider({
          provider,
          jobId,
          code,
          plan,
        });

        // ✅ success
        setOutput(result.stdout || "");
        setError(result.stderr || "");
        setStatus("done");
        return;

      } catch (err) {
        console.warn(
          `Provider ${provider.providerId} failed:`,
          err.message
        );
        cleanupSocket();
      }
    }

    // ❌ all providers failed
    setError("All providers failed to execute the job");
    setStatus("error");
  };

  const tryProvider = ({ provider, jobId, code, plan }) => {
    return new Promise((resolve, reject) => {
      const socket = connectToProvider(provider.ip);
      socketRef.current = socket;

      let connectionTimer;
      let executionTimer;

      const fail = (reason) => {
        clearTimeout(connectionTimer);
        clearTimeout(executionTimer);
        socket.disconnect();
        reject(new Error(reason));
      };

      // ⏱ connection timeout
      connectionTimer = setTimeout(() => {
        fail("Connection timeout");
      }, CONNECTION_TIMEOUT);

      socket.on("connect", () => {
        clearTimeout(connectionTimer);
        setStatus("running");

        socket.emit("job:execute", {
          jobId,
          code,
          plan,
        });

        // ⏱ execution timeout
        executionTimer = setTimeout(() => {
          fail("Execution timeout");
        }, EXECUTION_TIMEOUT);
      });

      socket.on("job:result", (data) => {
        clearTimeout(executionTimer);
        socket.disconnect();
        resolve(data);
      });

      socket.on("connect_error", () => {
        fail("Connection failed");
      });
    });
  };

  const cancelJob = () => {
    cancelledRef.current = true;
    cleanupSocket();
    setStatus("idle");
  };

  return {
    runJob,
    cancelJob,
    status,
    output,
    error,
  };
}
