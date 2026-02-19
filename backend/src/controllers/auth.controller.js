import User from "../schemas/user.schema.js";
import bcrypt from "bcryptjs";
import ErrorResponse from "../response/ErrorResponse.js";
import SimpleResponse from "../response/SimpleResponse.js";
import jwt from "jsonwebtoken";

export async function handleRegister(req, res) {
    const { firstName, lastName, email, password, eDEK, rDEK } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res
            .status(403)
            .json(new ErrorResponse("User with this email already exists."));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
        firstName,
        lastName,
        email,
        hashedPassword,
        eDEK,
        rDEK,
    });

    try {
        await user.save();
    } catch (error) {
        console.error("Error saving user:", error);
        return res
            .status(500)
            .json(new ErrorResponse("Failed to register user", 500));
    }

    res.status(201).json(
        new SimpleResponse("User registered successfully.", 201),
    );
}

export async function handleLogin(req, res) {
    const { email, password } = req.body;

    let user = null;
    user = await User.findOne({ email });

    if (!user)
        return res
            .status(400)
            .json(new ErrorResponse("Invalid credentials.", 400));

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid)
        return res
            .status(400)
            .json(new ErrorResponse("Invalid credentials.", 400));

    const token = jwt.sign(
        { firstName: user.firstName, lastName: user.lastName, email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json(new SimpleResponse("Login successful.", 200));
}
