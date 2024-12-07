import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrenrUser,
  updateAccounrDetailes,
  updateUserAvatar,
  updateCoverImage,
  userChannelProfile,
  getWatchHistory,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// unsecured routes
userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);
userRouter.route("/login").post(loginUser);
userRouter.route("/refresh-token").post(refreshAccessToken);

// secured routes
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword);
userRouter.route("/c/:username").get(verifyJWT, userChannelProfile);
userRouter.route("/current-user").get(verifyJWT, getCurrenrUser);
userRouter
  .route("/update-image")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
userRouter.route("/update-acc").patch(verifyJWT, updateAccounrDetailes);
userRouter
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
userRouter.route("/history").get(verifyJWT, getWatchHistory);

export default userRouter;
