require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error("Missing MONGO_URI in environment variables.");
    process.exit(1);
}

mongoose.connect(mongoUri)
.then(() => {
    console.log("MongoDB connected successfully.");

    app.use("/api/auth", authRoutes);
    app.get("/api/status", (req, res) => {
        res.json({ status: "ok" });
    });

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
})
.catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
});
