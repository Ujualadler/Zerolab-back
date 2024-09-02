import { Express, NextFunction, Request, Response } from 'express';
import { generateAccessToken, verifyToken } from '../config/jwt';
import userSchema from '../models/userSchema';
import IUser from '../models/userSchema';


export const authCallback = (req: Request, res: Response) => {
    const user = req.user as any;
    // Ensure that the user and token are correctly attached to req.user
    const token = generateAccessToken(user);
    console.log(token);
    if (token) {
        console.log(req.user);
        res.json({ token });
    } else {
        res.status(500).json({ message: 'Authentication successful but no token was provided.' });
    }
}

export const refresh = (req: Request, res: Response, next: NextFunction) => {
    try {
        const cookies = req.cookies;
        if(!cookies?.jwt)  throw new Error('Cookie is empty');
        const refreshToken = cookies.jwt;
    
        const accessToken = verifyToken(refreshToken);

        res.status(200).json({ token: accessToken });

    } catch(e) {
        return res.status(500).json({ message: 'Authentication successful but no token was provided.' });

    }
}