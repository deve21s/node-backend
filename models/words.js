const mongoose = require('mongoose')
const Schema = mongoose.Schema

const wordSchema = Schema({
    // title : {
    //     type : String,
    //     require : true

    // },
    // details : {
    //     type : String,
    //     require : true

    // },
    // ref : {
    //     type : String,
    //     require : true
    // },
    // rel : {
    //     type : String,
    //     require : true
    // }
    
        title: {
          type: String
        },
        details: {
          type: String
        },
        ref: {
          type: [
            "Mixed"
          ]
        },
        rel: {
          type: [
            "Mixed"
          ]
        }
      

}, { timestamps : true})

module.exports = mongoose.model('Word', wordSchema)