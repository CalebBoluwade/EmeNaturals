import express from "express";
import cors from "cors";
import userRouter from "./routes/user.route";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/v1/users", userRouter);

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));