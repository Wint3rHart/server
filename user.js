let mongoose=require('./mongo')

let user_schema=mongoose.Schema({name:String,posts:[{type:mongoose.Schema.Types.ObjectId,ref:'posts'}]  })
let user_model=mongoose.model('user',user_schema,'users');

module.exports=user_model