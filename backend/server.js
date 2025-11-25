const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

// allow large frames
app.use(express.json({ limit: "50mb" }));
app.use(cors());

// route that frontend calls
app.post("/process-frame", async (req, res) => {
    try {
        const frame = req.body.frame;

        // send image to Python YOLO server
        const result = await axios.post("http://localhost:5000/infer", {
            frame: frame
        });

        res.json(result.data);

    } catch (err) {
        console.error("Error contacting Python server:", err.message);
        res.status(500).json({ error: "Model server not responding" });
    }
});

app.listen(3000, () => {
    console.log("Backend running on http://localhost:3000");
});
