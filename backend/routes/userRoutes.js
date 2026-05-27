import { Router } from "express";
import {
  authUser,
  deleteUser,
  getUserById,
  getUserProfile,
  getUsers,
  logoutUser,
  registerUser,
  updateUser,
  updateUserProfile,
} from "../controllers/userController.js";
import { adminMw, protectMw } from "../middlewares/authMiddleware.js";

const userRouter = Router();

userRouter.route("/").post(registerUser).get(protectMw, adminMw, getUsers);

userRouter.post("/logout", logoutUser);
userRouter.post("/auth", authUser);

userRouter
  .route("/profile")
  .get(protectMw, getUserProfile)
  .put(protectMw, updateUserProfile);

userRouter
  .route("/:id")
  .delete(protectMw, adminMw, deleteUser)
  .get(protectMw, adminMw, getUserById)
  .put(protectMw, adminMw, updateUser);

export default userRouter;
