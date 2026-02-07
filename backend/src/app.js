import express from "express";
import routes from "./route.js";

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api", routes);


app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
