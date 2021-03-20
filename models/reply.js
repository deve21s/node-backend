const mongoose = require('mongoose')
const Schema = mongoose.Schema

const replySchema = new Schema({
        text: String,
       name : String,
});
  
  module.exports = mongoose.model("Reply",replySchema);