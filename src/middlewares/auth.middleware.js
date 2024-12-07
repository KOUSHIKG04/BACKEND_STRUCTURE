import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";



export const verifyJWT = asyncHandler(async (req, res, next) => {

  const token =
    req.cookies.accessToken ||
    req.header("Autorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, null, "Unauthorized");
  }

  try {
    const decodedToken = 
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRETS);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken",
    );
    if (!user) {
      throw new ApiError(401, null, "Unauthorized");
    }

    req.user = user; next();

  } catch (error) {
    console.log("Error", error);
    throw new ApiError(
        500,
        null,
        error?.message || "Invalid access token"
    );
  }
});
