let mongoose=require('mongoose')
let connect= mongoose.connect('mongodb://127.0.0.1:27017/movies')

module.exports=mongoose

