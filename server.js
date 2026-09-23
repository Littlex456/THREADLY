const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

const sitePath = path.join(__dirname, "Threadlypublic");

// Serve THREADLY files
app.use(express.static(sitePath));

// Explicit homepage route
app.get("/", (req, res) => {
    res.sendFile(path.join(sitePath, "index.html"));
});

app.listen(PORT, () => {
    console.log(`THREADLY server is running on port ${PORT}`);
});

module.exports = app;