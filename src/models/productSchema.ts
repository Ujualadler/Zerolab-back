import { Schema, model, Document, ObjectId } from "mongoose";
import { IFeature } from "./featureSchema"; // Adjust the import path

// Define an interface for Product, which extends mongoose Document
interface IProduct extends Document {
  name: string;
  price: string;
  features: ObjectId[]; // Reference array of ObjectIds for features
}

// Define the Product schema
const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  price: { type: String, required: true },
  features: [{ type: Schema.Types.ObjectId, ref: "Feature" }], // Reference Feature model
});

// Create the Product model
const Product = model<IProduct>("Product", ProductSchema);

export default Product;
export { IProduct };
