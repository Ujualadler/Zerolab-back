import { Router } from "express";
import {
  createUser,
  postInvitation,
  saveProduct,
  getProducts,
  saveform,
  getForm,
  getSingleForm,
  postLogin,
} from "../controllers/userController";
import {
  createLead,
  getLead,
  getSalesPipelineLeadData,
  getSalesRep,
  getSingleLead,
  updateSingleLead,
} from "../controllers/leadController";
// import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post("/", createUser);
router.post("/invitation", postInvitation);
router.get("/product", getProducts);
router.post("/product", saveProduct);
// router.delete("/product", deleteProduct);
router.get("/form", getForm);
router.get("/form/:id", getSingleForm);
router.post("/form", saveform);
router.post("/lead", createLead);
router.get("/lead", getLead);
router.get("/pipelineLead", getSalesPipelineLeadData);
router.get("/singleLead", getSingleLead);
router.put("/singleLead", updateSingleLead);
router.get("/salesRep", getSalesRep);
router.post("/login", postLogin);

export default router;
