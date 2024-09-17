import mongoose, { Document, Types } from "mongoose";

const { Schema } = mongoose;

export type LeadDocument = Document & {
  phone: number;
  mobile: number;
  email: string;
  contactPerson: string;
  clientValue: number;
  leadStatus: string;
  status: string;
  team: string;
  leadChannel: string;
  currentVendor: string;
  items: string[];
  timeFrame: string;
  assignee: string;
  cordinates: number[];
  leadOwner: string;
  leadSource: string;
  leadQuality: string;
  client: string;
  website: string;
  decisionMaker: string;
  spoc: string;
  street: string;
  state: string;
  description: string;
  stateType: string;
  dealValue: number;
  country: string;
  city: string;
  otherDistrict: string;
  affiliationCode: string;
  district: string;
  zipCode: string;
  board: string;
  forms: Types.ObjectId[]; // Reference to Form
  products: {
    productId: Types.ObjectId; // Ensure Types.ObjectId for productId
    selectedFeatures: Types.ObjectId[]; // Array of ObjectIds for selected features
  }[];
  noOfStudents: number;
  assignedTo: string;
  assignmentDate: string;
  createdDate: Date; // New field for created date
};

const leadSchema = new Schema<LeadDocument>(
  {
    phone: { type: Number },
    mobile: { type: Number },
    email: { type: String },
    contactPerson: { type: String },
    clientValue: { type: Number },
    leadStatus: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "disapproved"], // Set possible values
      default: "pending", // Set default value
    },
    team: { type: String },
    leadChannel: { type: String },
    currentVendor: { type: String },
    items: [{ type: String }],
    timeFrame: { type: String },
    assignee: { type: String },
    cordinates: [{ type: Number }],
    leadOwner: { type: String },
    leadSource: { type: String },
    leadQuality: { type: String },
    affiliationCode: { type: String },
    client: { type: String },
    website: { type: String },
    decisionMaker: { type: String },
    description: { type: String },
    spoc: { type: String },
    street: { type: String },
    state: { type: String },
    stateType: { type: String },
    country: { type: String },
    city: { type: String },
    otherDistrict: { type: String },
    district: { type: String },
    zipCode: { type: String },
    board: { type: String },
    dealValue: { type: Number },
    forms: [
      {
        type: Schema.Types.ObjectId,
        ref: "Form", // Reference to the Form schema
      },
    ],
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        selectedFeatures: [{ type: Schema.Types.ObjectId, ref: "Feature" }],
      },
    ],
    noOfStudents: { type: Number },
    assignedTo: { type: String },
    assignmentDate: { type: String },
    createdDate: {
      type: Date,
      default: Date.now, // Set the default value to the current date
    },
  },
  { timestamps: true }
);

const Lead = mongoose.model<LeadDocument>("Lead", leadSchema);

export default Lead;

