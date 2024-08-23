import express, { Application } from "express";
import userRouter from "./routers/userRouter";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();


// Create an instance of express
const app: Application = express();

// Middleware to parse JSON
console.log("first")

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
