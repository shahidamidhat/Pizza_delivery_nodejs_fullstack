const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const URL = "mongodb://localhost:27017"
const DB = "pizzadelivery";



app.use(cors())
app.use(express.json())



app.post("/register",async function(req,res){
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);

        
        let isEmailUnique = await db.collection("users").findOne({email : req.body.email})
        if(isEmailUnique) {
            res.status(401).json({
                message: "User Already Exists"
            })
        }
        else{
            //generating salt
            let salt = await bcrypt.genSalt(10)

            //hash the password
            let hash = await bcrypt.hash(req.body.password,salt)
            //storing hash instead of raw password
            req.body.password = hash

            let users = await db.collection("users").insertOne(req.body)
            await connection.close()
            res.json(
                {
                    message: "User Registered"
                }
            )
        }
    }
    catch (error){
        console.log(error)
    }
})

app.post("/login",async function(req,res){
    try {
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);

        //find the username or useremail
        let user = await db.collection("users").findOne({email : req.body.email})
         
        //hashing the password and matching with that of user

        if(user){
            let isPassCorrect = await bcrypt.compare(req.body.password, user.password)
             
            if (isPassCorrect){

                //generating jwt token
                let token = jwt.sign({id : user._id},"xyzsecretkeyhjdjdhduisjssk")
                //pass token
                res.json({
                    message:"Allow User",
                    token
                })
            }
            else{
                res.status(404).json({
                    message: "Email or Password is Incorrect"
                })
            }
        }
        else{
            res.status(404).json({
                message: "Email or Password is Incorrect"
            })
        }

    }
    catch(error){
        console.log(error)
    }
})

function authenticate(req,res,next){
    //to check presence of token
    if(req.headers.authorization){        
        //check validity of token
        try {
            let jwtValid = jwt.verify(req.headers.authorization,"xyzsecretkeyhjdjdhduisjssk")
            if(jwtValid){
                next()
            }
        }
        catch(error){
            res.status(401).json({
                message:"Invalid token"
            })
        }
    }else {
        res.status(401).json({
            message:"No token found"
        })
    }
}

app.get("/userdashboard",authenticate,function(req,res){
    res.json({
        message : "Seured dashboard"
    })
})

app.listen(3001)