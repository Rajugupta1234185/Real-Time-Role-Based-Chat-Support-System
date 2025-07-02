import React,{useState} from "react";
import { FaEye,FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { NavigateFunction } from "react-router-dom";
import axios from 'axios';
import type { AxiosResponse } from "axios";

export default function Login(){
    const navigate:NavigateFunction=useNavigate();
    const[username,setusername]=useState<string>("");
    const[password,setpasswordvalue]=useState<string>("");
    const [showpassword,setpassword]=useState<boolean>(false);


    const handlelogin=async():Promise<void>=>{
        try{
            const res:AxiosResponse=await axios.post("http://localhost:5000/authenticate",{username:username,password:password});
            if(res.status==201){
                localStorage.setItem("username",username);
                navigate('/userdashboard')
            }
            else if(res.status==202){
                localStorage.setItem("username",username);
                navigate('/agentdashboard')
            }
            else if(res.status==203){
                localStorage.setItem("username",username);
                navigate('/admindashboard');
            }
            else{
                alert("Invalid Credentials");
            }
        }
        catch(error){
            alert("Server side erro occurred");
        }
    }


    return(

        <div className=" bg-cover h-screen w-screen flex justify-center items-center " style={{backgroundImage:`url("/Images/login.jpg")`}}>
            <div className="flex flex-col h-[30rem] w-[20rem] bg-gradient-to-b from-[#DFE1F9] to-[#111A6D] rounded-md">
                <p className="flex justify-center items-baseline mt-[3rem] italic font-extrabold text-2xl text-pink-500">Welcome <span className="ml-2 text-3xl italic mb-2 font-thin text-blue-500 ">{"   Back!!!"}</span></p>
                <p className="flex justify-center items-center gap-1  font-extralight text-white">
                    Don't have any account?
                    <span className="relative font-extrabold italic text-white cursor-pointer group" onClick={()=>navigate('/register')}>
                        Sign Up
                        <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
                    </span>                   
                </p>
                <p className="mt-4 ml-3 font-extrabold italic text-md text-white">Enter Username:</p>
                <input type="text" className="mt-2 ml-4 w-[80%] h-[7%]  rounded-md bg-white" value={username} onChange={(e)=>setusername(e.target.value)} placeholder="Enter username..."/>
                <p className="mt-4 ml-3 font-extrabold italic text-md text-white">Enter Password:</p>
                <input type={showpassword?"password": "text"} className="mt-2 ml-4 w-[80%] h-[7%] rounded-md bg-white item-baseline" value={password} onChange={(e)=>setpasswordvalue(e.target.value)} placeholder="Enter password..."/> 
                <span className="absolute mt-63 ml-62" onClick={()=>setpassword(!showpassword)}>{showpassword?<FaEye className="text-xl"/>:<FaEyeSlash className="text-xl"/>}</span>
                <div className="flex flex-row ml-3 mt-3">
                    <input type="checkbox"/><p className="font-light inter text-sm text-white">Stay Logged In</p>
                <p className="ml-15 font-light inter text-sm text-white">
                <span className="relative inline-block group cursor-pointer">
                    Forget Password?
                    <span className="absolute left-0 -bottom-1 h-[1px] w-0 bg-white transition-all duration-300 group-hover:w-full"></span>
                </span>
                </p>

                </div>
                
                <div className="ml-[15%] mr-[15%] h-[7%] rounded-md mt-[2rem] flex justify-center bg-gradient-to-b from-[#EEADE2] to-[#1E1EAA] cursor-pointer hover:from-[#1E1EAA] hover:to-[#EEADE2]"><p className="flex items-center font-extrabold inter text-white" onClick={handlelogin}>Login</p></div>


            </div>

        </div>

        

    )
}

