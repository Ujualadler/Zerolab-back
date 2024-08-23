import { Router } from "express";
import {
  getUsers,
  createUser,
  postInvitation,
  saveProduct,
  getProducts,
  deleteProduct,
  saveform,
  getForm,
  getSingleForm,
} from "../controllers/userController";
// import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get("/", getUsers);
router.post("/", createUser);
router.post("/invitation", postInvitation);
router.get("/product", getProducts);
router.post("/product", saveProduct);
router.delete("/product", deleteProduct);
router.get("/form", getForm);
router.get("/form/:id", getSingleForm);
router.post("/form", saveform);

export default router;
