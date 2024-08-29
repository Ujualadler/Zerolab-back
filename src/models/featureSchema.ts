import { Schema, model, Document, ObjectId } from "mongoose";

// Define an interface for Feature
interface IFeature extends Document {
  name: string;
  price: string;
}

// Define the Feature schema
const FeatureSchema = new Schema<IFeature>({
  name: { type: String, required: true },
  price: { type: String, required: true },
});

// Create the Feature model
const Feature = model<IFeature>("Feature", FeatureSchema);

export default Feature;
export { IFeature };
