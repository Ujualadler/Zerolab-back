import { Router } from "express";
import {
  getUsers,
  createUser,
  postInvitation,
  saveProduct,
  getProducts,
  saveform,
  getForm,
  getSingleForm,
} from "../controllers/userController";
import { createLead, getLead } from "../controllers/leadController";
// import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get("/", getUsers);
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

export default router;
