import mongoose, { Schema, Document } from "mongoose";

type FormFieldType =
  | "text"
  | "select"
  | "checkbox"
  | "radio"
  | "yesno"
  | "rating";

interface IFormField extends Document {
  type: FormFieldType;
  label: string;
  options?: string[];
  ratingValue?: number;
}

interface IForm extends Document {
  title: string;
  fields: IFormField[];
}

const FormFieldSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ["text", "select", "checkbox", "radio", "yesno", "rating"],
    required: true,
  },
  label: { type: String, required: true },
  options: [{ type: String }],
  ratingValue: { type: Number },
});

const FormSchema: Schema = new Schema({
  title: { type: String, required: true },
  fields: [FormFieldSchema],
});

const Form = mongoose.model<IForm>("Form", FormSchema);
export default Form;
