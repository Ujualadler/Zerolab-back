import { Schema, model, Document, ObjectId } from "mongoose";

// Define an interface for Feature
interface IFeature {
  _id?: ObjectId;
  name: string;
  price: string;
}

// Define an interface for Product, which extends mongoose Document
interface IProduct extends Document {
  name: string;
  price: string;
  features: IFeature[];
}

// Define the Feature schema
const FeatureSchema = new Schema<IFeature>({
  name: { type: String, required: true },
  price: { type: String, required: true },
});

// Define the Product schema
const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  price: { type: String, required: true },
  features: [FeatureSchema],
});

// Create the Product model
const Product = model<IProduct>("Product", ProductSchema);

export default Product;
