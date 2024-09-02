import jwt from "jsonwebtoken";
import userSchema from "../models/userSchema";
import { config } from "dotenv";

config();

export const generateAccessToken = (user: any) => {
    if(process.env.JWT_ACCESS_SECRET)
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "60s" }
  ); // JWT_SECRET is your secret key
};

export const generateRefreshToken = (user: any) => {
    if(process.env.JWT_REFRESH_SECRET)
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "1h" }
  );

};

export const verifyToken = (refreshToken: string) => {
    if(process.env.JWT_REFRESH_SECRET)
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async(err, decode) => {
    if(err) {
        console.log(err)
        return err;
    } else {
        console.log(decode)
        // const accessToken = generateAccessToken(decode);
        // return sendResponse(res, { accessToken: accessToken });
    }
});
}