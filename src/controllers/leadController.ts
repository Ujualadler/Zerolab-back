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
      dealValue,
      leadStatus,
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
      leadStatus,
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

export const getLead = async (req: Request, res: Response) => {
  try {
    const { from, to, state, status, strength, dealValue } = req.query;
    console.log(from, "-----", to);

    // Initialize query object and sort options
    const query: any = {};
    let sortOptions: any = {};

    // Check if all query parameters are empty
    const isAllParamsEmpty =
      !from && !to && !state && !status && !strength && !dealValue;

    // Apply filters based on query parameters only if they are not empty
    if (!isAllParamsEmpty) {
      if (state) {
        query.state = state;
      }

      if (status === "closed") {
        query.leadStatus = "Closed";
      } else if (status === "target") {
        query.leadStatus = { $ne: "Closed" }; // Not equal to 'closed'
      }

      // Check that 'from' and 'to' are valid non-empty strings before converting to dates
      if (from && to && from !== "" && to !== "") {
        const fromDate = new Date(from as string);
        const toDate = new Date(to as string);

        // Ensure valid date objects were created
        if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
          query.createdDate = {
            $gte: fromDate,
            $lte: toDate,
          };
        }
      }

      // Set sort options based on strength and dealValue parameters
      if (strength === "up") {
        sortOptions.noOfStudents = -1; // Sort by highest number of students
      } else if (strength === "down") {
        sortOptions.noOfStudents = 1; // Sort by lowest number of students
      }

      if (dealValue === "up") {
        sortOptions.dealValue = -1; // Sort by highest deal value
      } else if (dealValue === "down") {
        sortOptions.dealValue = 1; // Sort by lowest deal value
      }
    }

    // Fetch data with filters and sorting applied if any, otherwise fetch all data
    const data = await leadSchema
      .find(query)
      .sort(sortOptions)
      .populate({
        path: "products.productId",
        model: "Product",
      })
      .populate({
        path: "products.selectedFeatures",
        model: "Feature",
      });

    const totalTargetValue = await leadSchema.aggregate([
      {
        $group: {
          _id: null, // Group all documents
          totalDealValue: { $sum: "$dealValue" }, // Sum the dealValue field
        },
      },
    ]);
    const totalClosedValue = await leadSchema.aggregate([
      { $match: { leadStatus: "Closed" } },
      {
        $group: {
          _id: null, // Group all documents
          totalDealValue: { $sum: "$dealValue" }, // Sum the dealValue field
        },
      },
    ]);

    const totalValue =
      totalTargetValue.length > 0 ? totalTargetValue[0].totalDealValue : 0;
    const closedValue =
      totalClosedValue.length > 0 ? totalClosedValue[0].totalDealValue : 0;

    console.log("Total Deal Value:", totalValue);
    console.log("closed Deal Value:", closedValue);

    const closedCount = await leadSchema.countDocuments({
      leadStatus: "Closed",
    });
    const totalCount = await leadSchema.countDocuments({});


    // const pipelineData= await leadSchema

    const targetCount = totalCount - closedCount;

    console.log(`Count of closed leads: ${closedCount}`);
    console.log(`Count of Total leads: ${totalCount}`);

    const targetCounts = { closed: closedCount, target: targetCount };
    const targetValue = { closed: closedValue, target: totalValue };

    const leadStatusCounts = await leadSchema.aggregate([
      {
        $group: {
          _id: "$leadStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // console.log(data);
    return res
      .status(200)
      .json({ data, targetCounts, targetValue, leadStatusCounts, message: "success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "failed" });
  }
};

export const getSingleLead = async (req: Request, res: Response) => {
  try {
    const id = req.query.id;

    console.log(id);

    const lead = await leadSchema
      .findOne({ _id: id })
      .populate({
        path: "products.productId",
        model: "Product",
      })
      .populate({
        path: "products.selectedFeatures",
        model: "Feature",
      });

    console.log(lead);

    res.status(200).json(lead);
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};


export const updateSingleLead = async (req: Request, res: Response) => {
  try {
    const { NewLeadStatus, id } = req.body;

    console.log(NewLeadStatus)

    // Correctly use findByIdAndUpdate with separate filter and update objects
    const response = await leadSchema.findByIdAndUpdate(
      { _id: id },
      { $set: { leadStatus: NewLeadStatus } }
    );

    console.log(response)

    res.status(200).json({ message: 'success' });

  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};


export const getSalesRep = async (req: Request, res: Response) => {
  try {
    const response = await leadSchema.aggregate([
      {
        $group: {
          _id: "$assignedTo",
          data: { $push: "$$ROOT" },  // Collect all documents for each group
          target: { $sum: "$dealValue" },  // Sum of all deal values
          achievedTarget: {
            $sum: {
              $cond: [
                { $eq: ["$leadStatus", "Closed"] },  // Check if leadStatus is "Closed"
                "$dealValue",  // Include dealValue in the sum if true
                0  // Else, add 0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          data: 1,
          target: 1,
          achievedTarget: 1
        }
      }
    ]);

    res.status(200).json({ message: "success", data: response });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};