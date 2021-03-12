const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  title: { type: String, required: true },
  xMin: { type: String, required: true },
  xMax: { type: String, required: true },
  yMin: { type: String, required: true },
  yMax: { type: String, required: true },
  contours: { type: String, required: true },
  theme: { type: String, required: true },
  imagePath: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = mongoose.model("Post", postSchema);
