import { Schema, model, Document, Types } from "mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "superadmin" | "user";
  designation?: string;
  permissions: string[]; // Array of permission names
  manager?: Types.ObjectId; // Reference to another user (for hierarchy)
  subordinates: Types.ObjectId[]; // List of users under this user
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "user"], required: true },
  designation: { type: String },
  permissions: { type: [String], default: [] }, // Array to store permissions
  manager: { type: Schema.Types.ObjectId, ref: "User" },
  subordinates: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

const User = model<IUser>("User", userSchema);

export default User;
