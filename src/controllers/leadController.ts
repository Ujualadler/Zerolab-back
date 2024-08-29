import { Request, Response } from "express";
import leadSchema from "../models/leadSchema";

import mongoose from "mongoose";

export const createLead = async (req: Request, res: Response) => {
  try {
    console.log(process.env.GOOGLE_MAP_KEY);
    const {
      address,
      phone,
      email,
      mobile,
      contactPerson,
      leadOwner,
      leadSource,
      leadQuality,
      client,
      website,
      currentVendor,
      decisionMaker,
      spoc,
      street,
      state,
      stateType,
      country,
      city,
      otherDistrict,
      district,
      zipCode,
      board,
      products, // Coming as an array of product IDs from the request
      selectedFeatures, // Coming as an object of arrays with feature IDs keyed by productId
      noOfStudents,
      assignedTo,
      assignmentDate,
      dealValue
    } = req.body;

    console.log(`${client} ${city} ${state} ${zipCode}`);

    const googleData = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${client}, ${city}, ${state}, ${zipCode}&key=${process.env.GOOGLE_MAP_KEY}`
    );

    const apiResponseData = await googleData.json();

    let location;
    if (apiResponseData.status === "OK") {
      const coordinates = apiResponseData.results[0].geometry.location;
      location = Object.values(coordinates).reverse();
    }

    // Format the products correctly
    const formattedProducts = products.map((productId: string) => ({
      productId: new mongoose.Types.ObjectId(productId), // Convert string ID to ObjectId
      selectedFeatures: (selectedFeatures[productId] || []).map(
        (featureId: string) => new mongoose.Types.ObjectId(featureId)
      ), // Convert feature IDs to ObjectIds, safely handle undefined
    }));

    const lead = await leadSchema.create({
      leadOwner,
      leadSource,
      leadQuality,
      client,
      currentVendor,
      website,
      decisionMaker,
      spoc,
      dealValue,
      phone,
      mobile,
      email,
      board,
      products: formattedProducts, // Use formatted products
      noOfStudents,
      street,
      state,
      stateType,
      country,
      city,
      otherDistrict,
      district,
      zipCode,
      assignedTo,
      assignmentDate,
      cordinates: location,
    });

    return res.status(200).json({ message: "success", data: lead });
  } catch (e) {
    console.log("error::", e);
    return res.status(500).json({ message: "failed" });
  }
};

// Make sure to adjust the import path

// Make sure to adjust the import path

export const getLead = async (req: Request, res: Response) => {
  try {
    const data = await leadSchema
      .find()
      .populate({
        path: "products.productId", // First populate productId
        model: "Product",
      })
      .populate({
        path: "products.selectedFeatures", // Then populate selectedFeatures
        model: "Feature",
      });

    console.log(data);
    return res.status(200).json({ data: data, message: "success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "failed" });
  }
};
