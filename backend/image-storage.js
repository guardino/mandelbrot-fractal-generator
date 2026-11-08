const fs = require("fs");
const path = require("path");

const imageStorageDirectory = path.join(__dirname, "..", "images");
fs.mkdirSync(imageStorageDirectory, { recursive: true });

module.exports = imageStorageDirectory;
