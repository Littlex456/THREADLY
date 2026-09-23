const express = require("express");

const app = express();

const PORT = 3000;

app.use(express.static("Threadlypublic"));

app.listen(PORT, () => {
    console.log(`THREADLY server is running on http://localhost:${PORT}`);
});