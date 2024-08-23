import { Request, Response } from "express";
import bcrypt from "bcrypt";
import userSchema from "../models/userSchema";
import productSchema from "../models/productSchema";
const SibApiV3Sdk = require("sib-api-v3-sdk");
import dotenv from "dotenv";
import * as crypto from "crypto";
import jwt from "jsonwebtoken";
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

const algorithm = "aes-256-cbc";
const secretKey =
  process.env.SECRET_KEY || crypto.randomBytes(32).toString("hex"); // Generate a 256-bit key if not provided
const iv = crypto.randomBytes(16);

const encrypt = (text: string) => {
  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(secretKey, "hex"),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decrypt = (text: string): string => {
  const [ivPart, encryptedText] = text.split(":");
  const iv = Buffer.from(ivPart, "hex");
  const encryptedBuffer = Buffer.from(encryptedText, "hex");

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey, "hex"),
    iv
  );
  let decrypted = decipher.update(encryptedBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

export const postInvitation = async (req: Request, res: Response) => {
  const { emails, id } = req.body;

  console.log(emails);
  console.log(id);

  // Validate that emails array is provided
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res
      .status(400)
      .json({ message: "Please provide an array of emails." });
  }

  // Prepare the email content
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = "Invitation to Join ZeroLab";

  const encryptedId = encrypt(id);

  // Assuming you want to include the id in the signup URL
  const signupUrl = `http://localhost:3000/login?inviteId=${encodeURIComponent(
    encryptedId
  )}`;

  sendSmtpEmail.htmlContent = `
    <html>
      <body>
        <p>You have been invited to join our Team. Click the link below to sign up:</p>
        <a href="${signupUrl}">Sign Up</a>
      </body>
    </html>`;

  sendSmtpEmail.sender = {
    email: "ujualk2000@gmail.com",
    name: "Zerolab",
  };

  // Add recipients
  sendSmtpEmail.to = emails.map((email) => ({ email }));

  try {
    // Send the email
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Invitation emails sent successfully");
    res.status(200).json({ message: "Invitation emails sent successfully." });
  } catch (error) {
    console.error("Error sending invitation emails:", error);
    res.status(500).json({ message: "Failed to send invitation emails." });
  }
};

export const getUsers = (req: Request, res: Response) => {
  res.json("haaaai");
};

// Create a new user
export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      role,
      designation,
      permissions,
      manager,
      subordinates,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, password, and role are required." });
    }

    // Check if the email already exists
    const existingUser = await userSchema.findOne({ email });

    console.log(existingUser);
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const newUser = new userSchema({
      name,
      email,
      password: hashedPassword,
      role,
      designation,
      permissions: permissions || [],
      manager: manager || null,
      subordinates: subordinates || [],
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Return the created user (excluding the password)
    res.status(201).json({
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      designation: savedUser.designation,
      permissions: savedUser.permissions,
      manager: savedUser.manager,
      subordinates: savedUser.subordinates,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getProducts = async (req: Request, res: Response) => {
  try {
    const product = await productSchema.find();
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to load product", error });
  }
};

export const saveProduct = async (req: Request, res: Response) => {
  const { id, name, price, features } = req.body;

  try {
    let product;

    if (id) {
      // If the ID exists, update the product
      product = await productSchema.findByIdAndUpdate(
        id,
        { name, price, features },
        { new: true } // Return the updated product
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
    } else {
      // If no ID, create a new product
      product = new productSchema({
        name,
        price,
        features,
      });

      await product.save();
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Failed to save product", error });
  }
};



export const deleteProduct = async (req: Request, res: Response) => {
  const { productId, featureId } = req.body;

  try {
    if (featureId) {
      // Delete a feature from a product
      const product = await productSchema.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Filter out the feature to be deleted
      product.features = product.features.filter(
        (feature) => feature._id?.toString() !== featureId
      );

      // Save the updated product
      await product.save();

      return res.status(200).json({ message: "Feature deleted", product });
    } else {
      // Delete the entire product
      await productSchema.findByIdAndDelete(productId);
      return res.status(200).json({ message: "Product deleted" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
