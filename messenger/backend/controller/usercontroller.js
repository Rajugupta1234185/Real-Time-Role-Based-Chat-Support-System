import User from '../models/user.js'


const registeruser=async(req,res)=>{
    try{
        const {fullname,username,password}=req.body;
        
        const alreadypres=await User.findOne({username:username});
        if(! alreadypres){
            const newuser= new User({fullname,username,password});
            await newuser.save();
            res.status(201).json({message:"User registered successfully"});
        }
        else{
            res.status(400).json({message:"Username Already present"});
        }
    }
    catch(error){
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Internal server error occurred" });
    }
}

const getuser=async(req,res)=>{
    try{
        const users= await User.find();
        if(users){
            console.log("User retrieved successfully");
            res.status(201).json({message:"User retrieved successfully",users:users});
        }
        else{
            console.log("No user found");
            res.status(404).json({message:"No user found"});
        }
    }

    catch(error){
        console.error("Error while retrieving user Information");
    }
}

const authenticateuser=async(req,res)=>{
    try{
        const {username,password}=req.body;
         const userexist=await User.findOne({username:username,password:password});
         if(!userexist){
            console.log("Invalid Credentials");
            res.status(404).json({message:"User not found"});
         }
         else{
            if(userexist.role==="User"){

                await User.findOneAndUpdate(
                    {username:username},
                    {status:"Online"}
                );
           
                res.status(201).json({message:"User verified successfully"});

            }
            
            else if(userexist.role==="Agent"){
                 await User.findOneAndUpdate(
                    {username:username},
                    {status:"Online"}
                )
                res.status(202).json({message:"Agent Verified successfully"});
            }

            else if(userexist.role==="Admin"){
                 await User.findOneAndUpdate(
                    {username:username},
                    {status:"Online"}
                )
                res.status(203).json({message:"Admin Verified Successfully"});
            }
         }
    }
    catch(error){
        console.error("Eror while verifying login Credentials");
        res.status(500).json({message:"Internal Server error occurred"});
    }

}

export {registeruser,getuser,authenticateuser};