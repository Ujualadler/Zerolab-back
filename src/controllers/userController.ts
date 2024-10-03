import { Request, Response } from "express";
import bcrypt from "bcrypt";
import userSchema from "../models/userSchema";
import productSchema from "../models/productSchema";
import featureSchema from "../models/featureSchema";
const SibApiV3Sdk = require("sib-api-v3-sdk");
import dotenv from "dotenv";
import * as crypto from "crypto";
import jwt from "jsonwebtoken";
import formSchema from "../models/formSchema";
import { ObjectId, Types } from "mongoose";
import Lead from "../models/leadSchema";
import Product from "../models/productSchema";
import Feature from "../models/featureSchema";
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
// apiKey.apiKey = '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';

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

export const postLogin = (req: Request, res: Response) => {
  console.log(req.body);
  res.json({ message: "success" });
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

export const getProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Find all products and populate the features field
    const products = await productSchema.find().populate("features");
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load products", error });
  }
};

// Adjust the import path

// Adjust the import path

export const saveProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  console.log("req.body",req.body);
  try {
      const features = req.body.features;
      let featuresId: any[] = [];
      if(features.length > 0) {
        const response = await Feature.insertMany(features);
        response.forEach((feature) => featuresId.push(feature._id));
      }

      const data = await Product.create({
        name: req.body.name,
        price: req.body.price,
        type: req.body.type,
        package: req.body.package,
        features: featuresId,
      });
      return res.status(200).json({ message: "Product added" });
  } catch(e) {
    console.log("e", e);
    return res.status(503).json({ message: "Error occured" })
  }
}

// export const saveProduct = async (
//   req: Request,
//   res: Response
// ): Promise<Response> => {
//   const { id, name, price, features } = req.body;

//   try {
//     let product;
//     let featureIds: Types.ObjectId[] = [];

//     // First, create or update features
//     if (features && Array.isArray(features)) {
//       // Save each feature and store its ObjectId
//       for (const feature of features) {
//         let savedFeature;

//         // Check if the feature has an id (indicating an update operation)
//         if (feature._id) {
//           savedFeature = await featureSchema.findByIdAndUpdate(
//             feature._id,
//             { name: feature.name, price: feature.price },
//             { new: true, upsert: true } // upsert: true will create the feature if it doesn't exist
//           );
//         } else {
//           // Create a new feature if no _id is provided
//           const newFeature = new featureSchema({
//             name: feature.name,
//             price: feature.price,
//           });
//           savedFeature = await newFeature.save();
//         }

//         // Push the saved or updated feature ObjectId to featureIds array
//         if (savedFeature && savedFeature._id) {
//           featureIds.push(savedFeature._id as Types.ObjectId); // Type assertion here
//         }
//       }
//     }

//     if (id) {
//       // If the ID exists, update the product
//       product = await productSchema.findByIdAndUpdate(
//         id,
//         { name, price, features: featureIds }, // Use the new or updated feature ObjectIds
//         { new: true } // Return the updated product
//       );

//       if (!product) {
//         return res.status(404).json({ message: "Product not found" });
//       }
//     } else {
//       // If no ID, create a new product
//       product = new productSchema({
//         name,
//         price,
//         features: featureIds, // Array of ObjectId references to Feature documents
//       });

//       await product.save();
//     }

//     // Populate features in the response
//     product = await productSchema.findById(product._id).populate("features");

//     return res.status(200).json(product);
//   } catch (error) {
//     return res.status(500).json({ message: "Failed to save product", error });
//   }
// };

export const getForm = async (req: Request, res: Response) => {
  try {
    const forms = await formSchema.find().select("_id title");
    res.status(200).json(forms);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const getSingleForm = async (req: Request, res: Response) => {
  try {
    const form = await formSchema.findById(req.params.id);
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.status(200).json(form);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const saveform = async (req: Request, res: Response) => {
  try {
    const { id, title, fields } = req.body;

    // Create a new form
    const form = new formSchema({
      title,
      fields,
    });
    await form.save();

    // Update the corresponding lead by adding the form's ID to its forms array
    await Lead.findByIdAndUpdate(
      id, // The lead's ID
      { $push: { forms: form._id } }, // Add the form ID to the lead's forms array
      { new: true }
    );

    res.status(201).json(form);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};
