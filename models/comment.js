const mongoose = require('mongoose')
const Schema = mongoose.Schema

const commentSchema = new Schema({
    text: String,
    name : String,
    imageUrl : String,
    replys: [
      {
        type: Schema.Types.ObjectId,
        ref: "Reply"
      }
    ]
    });
  
  module.exports = mongoose.model("Comment",commentSchema);