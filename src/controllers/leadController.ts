import { Request, Response } from "express";
import leadSchema from "../models/leadSchema";

import mongoose from "mongoose";
import coordinateQueue from "../jobs/geoQueue";
import Requirement from "../models/requirementSchema";

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

    console.log(apiResponseData);

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
      } else if (status === "rejected") {
        query.leadStatus = "Rejected";
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

    // Get the total deal value for the filtered leads (target leads)
    const totalTargetValue = await leadSchema.aggregate([
      { $match: query }, // Apply the filters to the aggregation
      {
        $group: {
          _id: null,
          totalDealValue: { $sum: "$dealValue" }, // Sum the dealValue field
        },
      },
    ]);

    // Get the total deal value for closed leads among the filtered leads

    const totalClosedValue = await leadSchema.aggregate([
      { $match: { ...query, leadStatus: "Closed" } }, // Apply filters and restrict to 'Closed' leads
      {
        $group: {
          _id: null,
          totalDealValue: { $sum: "$dealValue" }, // Sum the dealValue field
        },
      },
    ]);

    const totalValue =
      totalTargetValue.length > 0 ? totalTargetValue[0].totalDealValue : 0;
    const closedValue =
      totalClosedValue.length > 0 ? totalClosedValue[0].totalDealValue : 0;

    console.log("Total Deal Value (filtered):", totalValue);
    console.log("Closed Deal Value (filtered):", closedValue);

    // Get the count of closed leads among the filtered leads

    let closedCount = 0;

    if (status === "closed" || status === "") {
      closedCount = await leadSchema.countDocuments({
        ...query,
        leadStatus: "Closed",
      });
    }
    let rejectedCount = 0;
    if (status === "rejected" || status === "") {
      rejectedCount = await leadSchema.countDocuments({
        ...query,
        leadStatus: "Rejected",
      });
    }

    let targetCount = 0;

    if (status === "target" || status === "") {
      const totalCount = await leadSchema.countDocuments(query);

      targetCount = totalCount - closedCount;
    }

    // Get the count of all filtered leads (total leads)

    console.log(`Count of closed leads (filtered): ${closedCount}`);
    // console.log(`Count of Total leads (filtered): ${totalCount}`);
    console.log(`Count of rejected leads (filtered): ${rejectedCount}`);

    const targetCounts = {
      closed: closedCount,
      target: targetCount,
      rejected: rejectedCount,
    };
    const targetValue = { closed: closedValue, target: totalValue };

    // Aggregate lead status counts for filtered leads
    const leadStatusCounts = await leadSchema.aggregate([
      { $match: query }, // Apply filters to aggregate the status counts
      {
        $group: {
          _id: "$leadStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Return the filtered data and relevant counts/values
    return res.status(200).json({
      data,
      targetCounts,
      targetValue,
      leadStatusCounts,
      message: "success",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "failed" });
  }
};

export const getSalesPipelineLeadData = async (req: Request, res: Response) => {
  try {
    const { teamMember, from, to, status } = req.query;

    // Initialize query
    let query: any = {};

    // Filter by team member if provided
    if (teamMember && teamMember !== "") {
      query.assignedTo = teamMember;
    }

    // Add date range filter if provided
    if (from && to) {
      query.createdDate = {
        $gte: new Date(from as string),
        $lte: new Date(to as string),
      };
    }

    // Fetch the data without applying the status filter first (so we can count all stages)
    const allData = await leadSchema
      .find(query)
      .populate({
        path: "products.productId",
        model: "Product",
      })
      .populate({
        path: "products.selectedFeatures",
        model: "Feature",
      });

    if (!allData.length) {
      return res.status(200).json({
        message: "No leads found",
        percentages: {},
        targetCounts: {},
        data: [],
        totalCount: 0,
      });
    }

    // Function to calculate lead status percentage and target count based on all data
    const calculateLeadStatusData = (targetStatus: string, data: any[]) => {
      const baseCount = data.length;
      let targetCount = baseCount;

      if (targetStatus !== "Lead Generation") {
        targetCount = data.filter(
          (lead) => lead.leadStatus === targetStatus
        ).length;
      }

      const percentage = baseCount !== 0 ? (targetCount / baseCount) * 100 : 0;
      return { percentage, targetCount };
    };

    // List of all pipeline stages you want to calculate data for
    const pipelineStages = [
      "Lead Generation",
      "Qualification",
      "Demo",
      "Proposal",
      "Negotiation",
      "Closed",
      "Retention",
      "Rejected",
      "Hold",
    ];

    const percentages: any = {};
    const targetCounts: any = {};

    // Calculate percentage and count for each pipeline stage based on the entire dataset
    pipelineStages.forEach((stage) => {
      const { percentage, targetCount } = calculateLeadStatusData(
        stage,
        allData
      );
      percentages[stage] = percentage;
      targetCounts[stage] = targetCount;
    });

    // Now filter the data based on the selected status
    let filteredData = allData;
    if (status && status !== "") {
      filteredData = allData.filter((lead: any) => lead.leadStatus === status);
    }

    // Return the result with percentage, target count for each stage, and the filtered data
    return res.status(200).json({
      message: "success",
      percentages,
      targetCounts,
      totalCount: allData.length,
      data: filteredData, // Return the filtered data
    });
  } catch (error) {
    console.error("Error fetching sales pipeline lead data:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch sales pipeline lead data" });
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
      })
      .populate({
        path: "forms", // Populating the forms field
        model: "Form", // Reference the Form model
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

    console.log(NewLeadStatus);

    // Correctly use findByIdAndUpdate with separate filter and update objects
    const response = await leadSchema.findByIdAndUpdate(
      { _id: id },
      { $set: { leadStatus: NewLeadStatus } }
    );

    console.log(response);

    res.status(200).json({ message: "success" });
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
          data: { $push: "$$ROOT" }, // Collect all documents for each group
          target: { $sum: "$dealValue" }, // Sum of all deal values
          achievedTarget: {
            $sum: {
              $cond: [
                { $eq: ["$leadStatus", "Closed"] }, // Check if leadStatus is "Closed"
                "$dealValue", // Include dealValue in the sum if true
                0, // Else, add 0
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          data: 1,
          target: 1,
          achievedTarget: 1,
        },
      },
    ]);

    res.status(200).json({ message: "success", data: response });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const uploadBulkLead = async (req: Request, res: Response) => {
  try {
    const { csvData } = req.body;
    console.log(csvData);
    const result = await leadSchema.insertMany(csvData);
    result.forEach(lead => {
      coordinateQueue.add({
        _id: lead._id,
        client: lead.client,
        city: lead.city,
        state: lead.state,
        zipCode: lead.zipCode,
        products: lead.products
      })
    })
    return res.status(200).json({ message: "success", data: result })
  } catch(e) {
    console.log(e);
    return res.status(500).json({ message: "failed" })
  }
}

export const createRequirement = async (req: Request, res: Response) => {
  try {
    const { requirements } = req.body; 
    console.log(requirements); 
    const data = await Requirement.insertMany(requirements);
    res.status(200).json({ message: "Requirements saved successfully" });
  } catch(e) {
    console.log(e);
  }
}