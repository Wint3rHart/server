
let mongoose=require('./mongo')


let movies_schema=mongoose.Schema({title:String,genre:String,screenA:{seats:[[{name:String,availability:Boolean,occupant:{type:mongoose.Schema.Types.ObjectId,ref:'user'},price:Number}]]  ,timings:String,date:Date },screenB:{seats:[[{name:String,availability:Boolean,occupant:{type:mongoose.Schema.Types.ObjectId,ref:'user'},price:Number}]]  ,timings:String,date:Date }   })
let user_schema=mongoose.Schema({ name:String,email:String,password:String,token:String ,
    bookings:[{movie:{type:mongoose.Schema.Types.ObjectId,ref:'movies'},screen:{screenA:[{name:{type:String},price:Number }],screenB:[{name:{type:String},price:Number }]  },cost:Number}]   },{Timestamps:true})


let movies_model=mongoose.model('movies',movies_schema,'details')
let user_model=mongoose.model('user',user_schema,'users')

module.exports=[movies_model,user_model]