const mongoose = require('mongoose')

const Schema = mongoose.Schema

const movieSchema = new Schema({
    id : {type:String},
    list_id:String

})

module.exports = mongoose.model('Movie',movieSchema)