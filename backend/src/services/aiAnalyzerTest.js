import { aiAnalyzer } from "./aiAnalyzer.js";

const sampleCode = `
import numpy as np
import pandas as pd

print("hello world")
`;

aiAnalyzer(sampleCode)
  .then(result => {
    console.log("AI Planner Output:");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(err => {
    console.error("Full error:");
    console.error(err.response?.data);
    console.error(err.response?.status);
  });
