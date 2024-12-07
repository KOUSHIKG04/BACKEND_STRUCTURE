import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
// import bcrypt from "bcrypt";

export const generateAcessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, null, "User not found!");
    }

    const accessToken = user.generateAccessToken(); const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      null,
      "Something went wrong while generating tokens!",
    );
  }
};

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

  // console.warn(req.files)
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, null, "Avatar file is missing");
  }
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  /** 
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = "";
  if (coverImageLocalPath) {
    coverImage = 
    await uploadOnCloudinary(coverImageLocalPath);
  } */

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("uploaded avatar!", avatar);
  } catch (error) {
    console.log("error uploading avatar", error);
    throw new ApiError(500, null, "Failed to upload avatar");
  }

  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverLocalPath);
    console.log("uploaded coverImage!", coverImage);
  } catch (error) {
    console.log("error uploading coverImage", error);
    throw new ApiError(500, null, "Failed to upload coverImage");
  }

  let createdUser;
  try {
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    createdUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    if (!createdUser) {
      throw new ApiError(500, null, "Something went wrong while registration");
    }
  } catch (error) {
    console.log("User creation failed....", error);
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }
    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }

    throw new ApiError(
      500,
      null,
      "User registration failed, and resources were cleaned up.",
    );
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

export const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!email) {
    throw new ApiError(400, null, "Email not found!");
  }

  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(409, null, "User not found!");
  }

  // validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, null, "Invalid Credential!");
  }

  const { accessToken, refreshToken } = await generateAcessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!loggedInUser) {
    throw new ApiError(500, null, "Something went wrong while logging in!");
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookies("accessToken", accessToken, options).cookies("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully!",
      ),
    );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const inCommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!inCommingRefreshToken) {
    throw new ApiError(401, null, "Refresh token is expried");
  }

  try {
    const decodedToken = jwt.verify(
      inCommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRETS,
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, null, "Invalid refresh token!");
    }

    if (inCommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, null, "Invalid refresh token!");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAcessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookies("accessToken", accessToken, options).cookies("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully!",
        ),
      );
  } catch (error) {
    console.log("Error", error);
    throw new ApiError(
      500,
      null,
      "Something went wrong while refreshing access token",
    );
  }
});



export const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set :{
        refreshToken: undefined,
      }
    },
    {
      new : true
    }
  )

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken",options).clearCookie("refreshToken",options)
    .json(
      new ApiResponse(
        200,
        {},
        "User loged out successfully!",
      ),
    );
})