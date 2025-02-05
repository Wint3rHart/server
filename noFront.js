
let  express=require('express')
let [movies_model,user_model]=require('./newMongo')
let app=express();
let jwt=require('jsonwebtoken')
let {ObjectId}=require('mongodb')
app.use(express.json())
let cors=require("cors")

app.use(cors({
      origin: 'http://localhost:5173', // Replace with your frontend domain
      credentials: true // Allow credentials (cookies) to be sent
  }));
let cookie=require('cookie-parser');
app.use(cookie())
const key='xyz123';

app.get('/movies',async(req,res)=>{ console.log(req.query);
;if(req.query.type=='All'){let get=await movies_model.find();res.send(get)  }
else if(req.query.type=='custom'){let expression=new RegExp(req.query.title, 'i')
      ;let get= await movies_model.find({title:{$regex:expression }    });
      ;res.send(get) }
      else{let get=await movies_model.find({genre:req.query.type});res.send(get)}  })

app.get('/details',async(req,res)=>{ console.log(req.query.id);
;let get=await movies_model.findById(req.query.id); res.send(get)   })

app.get('/seats/:id',async(req,res)=>{
      // console.log(req.params);
console.log(req.query.screen);


        let get=await movies_model.aggregate([{$match:{_id:new ObjectId(`${req.params.id}`)}}, {$project:{_id:0,seats:1,screenA:{$cond:{if:{$eq:[req.query.screen,"1"]},then:"$screenA",else:"$$REMOVE"  }},screenB:{$cond:{if:{$eq:[req.query.screen,"2"]},then:"$screenB",else:"$$REMOVE"  }}    }}]);
      //   console.log(get);
        ;res.send(get) 

 })


app.put('/book',(req,res,next)=>{console.log(req.headers.authorization);
     
      try {
            let verify = jwt.verify(req.headers.authorization, key);
          
            if (!verify.error) {
              next();
            }
          } catch (error) {
            if (error.name === "TokenExpiredError") {
              console.log(error);
              res.send({ error: "token expired", msg: "use refresh token" });
            } else {
              console.log(error);
              res.json({ error: "user not authenticated" });
            }
          }
          

},async(req,res)=>{ 

      let movies_get=await movies_model.findOne({_id:req.body.movie_id},{_id:1})
    

      await user_model.updateOne({_id:req.body.user_id},[{$set:{bookings:{$cond:{if:{$in:[movies_get._id,{$map:{input:"$bookings",as:'x',in:"$$x.movie"}}]},then:"$bookings",else:{$concatArrays:["$bookings",[{movie:movies_get._id,screen:{screenA:[],screenB:[]}}]]}}}}}])

console.log('working');


 let map= req.body.seat_no.map(async(x,i) => {
// console.log(req.body);
let y=   await movies_model.findById(req.body.movie_id);
 let screenType=req.body.screen=="1"?"screenA":"screenB";

 return  Promise.all(    [ movies_model.updateOne(
            {_id:req.body.movie_id}
            ,{$set:{[`${req.body.screen=="1"?"screenA":"screenB"}.seats.${x[0]}.${x[1]}.availability`]:false,
            [`${req.body.screen=="1"?"screenA":"screenB"}.seats.${x[0]}.${x[1]}.occupant`]:req.body.user_id} }  ),

                    
      user_model.updateOne({_id:req.body.user_id,"bookings.movie":{$eq:movies_get._id}},{$push:{[`bookings.$.screen.${screenType}`]:{name:y[screenType].seats[x[0]][x[1]].name,price:y[screenType].seats[x[0]][x[1]].price}}}) ] )               
                       
                       
   


 
                     
                  
                  }); 
                  
                  
await Promise.all(map)


                        await user_model.updateOne({_id:req.body.user_id},[{$set:{bookings:{$map:{input:"$bookings",as:"x",in:{movie:"$$x.movie",screen:"$$x.screen",cost:{$sum:{$concatArrays:[{$map:{input:"$$x.screen.screenA",as:"y",in:"$$y.price"}},{$map:{input:"$$x.screen.screenB",as:"y",in:"$$y.price"}}]}}}}}}}])
                        


 })

 
// await user_model.updateOne({_id:req.body.user_id},[{$set:{booings:{$map:{input:"$bookings",as:"x",in:{movie:"$$x.movie",seats:"$$x.seats",cost:{$sum:{$map:{input:movies_get.seats,as:"y",in:{$map:{input:"$$y",as:"z",in:{$cond:{if:{$in:["$$z.name",{$filter:{input:"$$bookings",as:"sec",cond:{$cond:{if:{$eq:["$$sec.movie",movies_get._id]}, }}}}  ]}     }}}} }}}   }}}}}])


app.post('/sign',async(req,res)=>{  console.log("sign recieved");

      let set=await user_model.findOne({name:req.body.name,email:req.body.email,password:req.body.password});
      if (set!==null) { 
            let token= jwt.sign(req.body,key,{expiresIn:'10h'});

          
            res.send({token:token,id:set._id,status:set.name});
      } else{console.log('recieved');
      ;res.send({error:'No User Found'})} 
      
      
      
      
      
  });

  app.post('/reg',async (req,res,next)=>{console.log(req.body);
   ;let check= await user_model.findOne({$or:[{name:req.body.name},{email:req.body.email}]});console.log(check);
   ;if (check) {
      res.send({error:'User or Email Already present'});
 } else{next()}  },async(req,res)=>{ let ins= await user_model.create(req.body);console.log(ins);
 ;res.send({success:'Registered Successfuly'})  })


app.get('/user/:id',async(req,res)=>{ console.log('req rec');
 ;let get=await user_model.findById(req.params.id,{password:0}).populate({path:"bookings.movie"});res.send(get)   })



app.delete('/book',async(req,res)=>{
      console.log(req.body);

       await movies_model.updateOne({_id:req.body.movie_id},[{$set:{"screenA.seats":{$map:{input:"$screenA.seats",as:"x",in:{ $map:{input:"$$x",as:"y",in:{name:"$$y.name",availability:{$cond:{if:{$in:["$$y.name",{$map:{input:req.body.seatA,as:"z",in:"$$z.name"} }]},then:true,else:'$$y.availability'}},occupant:{$cond:{if:{$in:["$$y.name",{$map:{input:req.body.seatA,as:"z",in:"$$z.name"} }]},then:null,else:'$$y.occupant'}} } }}}}}},
            
   {$set:{"screenB.seats":{$map:{input:"$screenB.seats",as:"x",in:{ $map:{input:"$$x",as:"y",in:{name:"$$y.name",availability:{$cond:{if:{$in:["$$y.name",{$map:{input:req.body.seatB,as:"z",in:"$$z.name"} }]},then:true,else:'$$y.availability'}},occupant:{$cond:{if:{$in:["$$y.name",{$map:{input:req.body.seatB,as:"z",in:"$$z.name"} }]},then:null,else:'$$y.occupant'}} } }}}}}}]);
console.log('done');

        await user_model.updateOne({_id:req.body.user_id},{$pull:{bookings:{movie:req.body.movie_id}}})
res.json('done')
})



app.listen(4700,()=>{console.log('started');
})