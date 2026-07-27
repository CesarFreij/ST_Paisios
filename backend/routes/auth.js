const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const JWT_EXPIRES_IN = "7d";

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "الرجاء إدخال اسم المستخدم وكلمة المرور." });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "يجب أن تتكون كلمة المرور من 6 أحرف أو أكثر." });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "اسم المستخدم موجود بالفعل." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    const token = createToken(user);

    return res.status(201).json({
      user: { id: user._id, username: user.username },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ داخلي. حاول مرة أخرى." });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "الرجاء إدخال اسم المستخدم وكلمة المرور." });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة." });
    }

    const token = createToken(user);
    return res.json({
      user: { id: user._id, username: user.username },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ داخلي. حاول مرة أخرى." });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("_id username");
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود." });
    }

    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "حدث خطأ داخلي. حاول مرة أخرى." });
  }
});

module.exports = router;
