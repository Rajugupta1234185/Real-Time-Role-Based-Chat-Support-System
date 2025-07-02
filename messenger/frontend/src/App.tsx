import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Login from './Pages/Login/Login'
import Register from './Pages/Register/Register'
import UserDashboard from './Pages/UserDashboard/UserDashboard'
import AgentDashboard from './Pages/AgentDashboard/Agentdashboard'
import AdminDashboard from './Pages/AdminDashboard/Admindashboard'
import { BrowserRouter,Routes, Route } from 'react-router-dom'

function App() {
  
  return (
    
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/userdashboard" element={<UserDashboard/>}/>
      <Route path="/agentdashboard" element={<AgentDashboard/>}/>
      <Route path="/admindashboard" element={<AdminDashboard/>}/>
    </Routes>
    </BrowserRouter>
     
    
  )
}

export default App
