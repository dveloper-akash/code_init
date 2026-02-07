import axios from "axios";

export async function submitJob(code) {
  const res = await axios.post(
    "http://localhost:5000/api/job/submit",
    { code }
  );

  return res.data; // { jobId, provider, plan }
}
