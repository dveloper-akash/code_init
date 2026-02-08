import dotenv from "dotenv";
dotenv.config()
import express from "express";
import routes from "./route.js";
import cors from "cors";
import "./config/redis.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.get("/",(req,res)=>{
  res.send("GridX backend is running!!!")
})

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Grid-X backend running on http://localhost:${PORT}`);
});

export default app;
