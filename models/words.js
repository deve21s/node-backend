const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const wordSchema = Schema(
  {
    title: {
      type: String,
    },
    details: {
      type: String,
    },
    ref: {
      type: ["Mixed"],
    },
    rel: {
      type: ["Mixed"],
    },
    likes: {
      likeCount: { type: Number, default: 0 },
      disLike: { type: Number, default: 0 },
    },
    like : {
      type : ["Mixed"]
    },
    dislike : {
      type : ["Mixed"]
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Word", wordSchema);
