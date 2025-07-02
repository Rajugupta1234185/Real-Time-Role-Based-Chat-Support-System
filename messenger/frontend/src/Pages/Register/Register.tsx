import React,{useState} from "react";
import { FaEye,FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Register(){
    const navigate=useNavigate();

    const [showpassword,setpassword]=useState<boolean>(false);


    return(

        <div className=" bg-cover h-screen w-screen flex justify-center items-center " style={{backgroundImage:`url("/Images/login.jpg")`}}>
            <div className="flex flex-col h-[30rem] w-[20rem] bg-gradient-to-b from-[#DFE1F9] to-[#111A6D] rounded-md">
                <p className="flex justify-center items-baseline mt-[3rem] italic font-extrabold text-2xl text-pink-500">Register <span className="ml-2 text-3xl italic mb-2 font-thin text-blue-500 ">{"Account"}</span></p>
                <p className="flex justify-center items-center gap-1  font-extralight text-white">
                    Already Have an Account?
                    <span className="relative font-extrabold italic text-white cursor-pointer group" onClick={()=>navigate('/')}>
                        Log In
                        <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
                    </span>                   
                </p>
                <p className="mt-4 ml-3 font-extrabold italic text-md text-white">Enter Full Name:</p>
                <input type="text" className="mt-2 ml-4 w-[80%] h-[7%]  rounded-md bg-white" placeholder="Enter Fullname..."/>

                
                <p className="mt-4 ml-3 font-extrabold italic text-md text-white">Enter UserName:</p>
                <input type="text" className="mt-2 ml-4 w-[80%] h-[7%]  rounded-md bg-white" placeholder="Enter Username..."/>

                <p className="mt-4 ml-3 font-extrabold italic text-md text-white">Enter Password:</p>
                <input type={showpassword?"password": "text"} className="mt-2 ml-4 w-[80%] h-[7%] rounded-md bg-white item-baseline " autoComplete="new-password" placeholder="Enter password..."/> 
                <span className="absolute mt-83 ml-62" onClick={()=>setpassword(!showpassword)}>{showpassword?<FaEye className="text-xl"/>:<FaEyeSlash className="text-xl"/>}</span>
                
                
                <div className="ml-[15%] mr-[15%] h-[7%] rounded-md mt-[2rem] flex justify-center bg-gradient-to-b from-[#EEADE2] to-[#1E1EAA] cursor-pointer hover:from-[#1E1EAA] hover:to-[#EEADE2]"><p className="flex items-center font-extrabold inter text-white">Register</p></div>


            </div>

        </div>

        

    )
}

