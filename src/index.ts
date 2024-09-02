import express, { Application } from "express";
import userRouter from "./routers/userRouter";
import authRouter from "./routers/authRouter";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import "./config/passport";

dotenv.config();

// Create an instance of express
const app: Application = express();
app.use(passport.initialize());

// Middleware to parse JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);
app.use("/", userRouter);

// Define the port
const PORT: number = parseInt(process.env.PORT || "4000", 10);
const mongourl: string = "mongodb://127.0.0.1:27017/zerolab";

// MongoDB connections
mongoose
  .connect(mongourl)
  .then(() => {
    console.log("Connected to MongoDB");

    // Start the server after successful connection
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
