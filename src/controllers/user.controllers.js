import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import bcrypt from "bcrypt"; 

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullname } = req.body;

  /** 
  if (!username || !email || !password || !fullname) {
    return res
    .status(400)
    .json(new ApiError(400, null, "All fields are required"));
  }
*/

  if (
    [fullname, username, email, password].some((fields) => {
      fields?.trim() === "";
    })
  ) {
    throw new ApiError(400, null, "All fiels are required");
  }
  // Can Use other library like zod for input validation

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, null, "User wih email or username already exists");
  }

  const avatarLocalPath = req.file?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, null, "Avatar file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const coverImageLocalPath = req.file?.coverImage[0]?.path;
  const coverImage = "";
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password - refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, null, "Something went wrong while registration");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registration sucessfull"));

  /*
  const hashedPassword = await bcrypt.hash(password, 13);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    fullname,
    avatar,
    coverImage,
  });

  await newUser.save();

  return res
    .status(201)
    .json(new ApiResponse(201, { username, email }, "User Registered"));
  */
});
