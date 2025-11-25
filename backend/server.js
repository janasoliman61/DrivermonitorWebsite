const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

app.post("/process-frame", async (req, res) => {
    const frame = req.body.frame;

    // send frame to python model server
    const result = await axios.post("http://localhost:5000/infer", {
        frame: frame
    });

    res.json(result.data);
});

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
