import { Schema, model, Document, ObjectId } from "mongoose";

interface IFeature {
    _id: Schema.Types.ObjectId;
    name: string,
    price: string,
    count: string,
}

interface IProduct {
    _id: Schema.Types.ObjectId;
    name: string,
    price: string,
    features: IFeature[],
    package: string,
    type: string,
    count: number
}

interface IARequirements {
    name: string,
    amount: number,
    quantity: number,
    total: number
}

// Define an interface for Product, which extends mongoose Document
interface IRequirement extends Document {
  leadId: string,
  products: IProduct[],
  aRequirements: IARequirements[],
  totalAmount: number,
}

const RequirementSchema: Schema = new Schema<IRequirement>({
    leadId: { type: String, required: true },
    products: [{
        type: new Schema<IProduct>({
            _id: { type: Schema.Types.ObjectId, required: true },
            name: { type: String, required: true },
            price: { type: String, required: true },
            features: [{
                _id: { type: Schema.Types.ObjectId, required: true },
                name: { type: String, required: true },
                price: { type: String, required: true },
                count: { type: Number, required: true }
            }],
            package: { type: String, required: false },
            type: { type: String, required: true },
            count: { type: Number, required: true }
        }),
        required: true
    }],
    aRequirements: [{
        name: { type: String, required: true },
        amount: { type: Number, required: true },
        quantity: { type: Number, required: true },
        total: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true }
});

const Requirement = model<IRequirement>("Requirement", RequirementSchema);

export default Requirement; 

export { IRequirement, IProduct, IFeature, IARequirements }; 