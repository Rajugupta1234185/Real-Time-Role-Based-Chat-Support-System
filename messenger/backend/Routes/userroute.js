import {registeruser,getuser,authenticateuser} from '../controller/usercontroller.js'
import express from "express"

const router=express.Router();

//defining routes for usercontroller
router.post('/register',registeruser);
router.get('/getuser',getuser);
router.post('/authenticate',authenticateuser);

export default router;