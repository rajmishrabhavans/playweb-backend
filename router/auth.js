const express = require('express');
const router = express.Router();
const User = require('../model/userSchema');
const Alert = require('../model/alertSchema')
const bcrypt = require('bcryptjs');
const ContactModel= require('../model/contactModel')
const VerificationToken = require('../model/verificationToken');
const authenticate = require('../middleware/authenticate');
const { generateOTP, sendMail, verifyEmail, isEmailVerified, verifyOtpToken } = require('../utils/mail');
const { sendError } = require('../utils/helper');
const { setSensorData, getSensorData,updateSensorData, setEspConfigData, getEspConfigData, fetchEspConfigData, saveSupplyList, getSupplyList, setHomeData, getHomeData, updateHomeData, setTankInfo, getTankInfo, updateSupplyDetails } = require('../utils/esp32');


router.get('/', (req,res)=>{
    res.send('home page')
});

//check if a email or phone already exists
router.post('/checkUser',async(req,res)=>{
    const {email,phone} = req.body;

    if(email){
    const haveEmail= await User.findOne({email});
    if(haveEmail) return res.json({error: "email"});
    }
    if(phone){
    const havePhone= await User.findOne({phone});
    if(havePhone) return res.json({error: "phone"});
    }
    return res.json({msg: "ok"});
})

// validating and registering users data to DB
router.post('/register',async(req,res)=>{
    try {
        // console.log(req.body);
        //getting necessary data from user
        const {name,email,phone,gender,password} = req.body;
        let creationdate= req.body.creationdate;
        console.log(req.body);

        //checking that all required fiels are given by user
        if(!name || !email || !phone || !password || !gender){
            return res.status(422).json({error: "please fill all details"});
        }

        //check if phone and email already exists
        const haveEmail= await User.findOne({email});
        const havePhone= await User.findOne({phone});
        if(haveEmail) return res.status(422).json({error: "email"});
        if(havePhone) return res.status(422).json({error: "phone"});

        // console.log(req.body);
        //creating new user with given details
        
        if(!creationdate) creationdate= new Date().toISOString();
        const newUser= new User({name,email,phone,gender,password,creationdate});

        const token = await newUser.generateAuthToken();
        res.cookie('jwtoken',token,{
            expires: new Date(Date.now()+(1000*60*60)),
            httpOnly:false
        })
        console.log(token);

        await newUser.save();  //adding user to DB
        console.log(newUser);
        res.status(201).json({
            message:"User Registeration successful",
            token,
            userData: newUser
        });
    }catch (error) {
        console.log(error);
    }
});

// verifying if user is registered and logging user with an authentication token
router.post('/login',async(req,res)=>{
    try {
        //getting email and pass to variable email and password using destructuring
        const {email,password} = req.body;
        if(!email || !password) return res.json({error:"Please fill all details"});
        const checkUser= await User.findOne({email});  //check if email exists in database
        if(checkUser){
            //checking if given pass is same as stored hashed password
            const checkPass = await bcrypt.compare(password,checkUser.password);
            if(checkPass){
                const token = await checkUser.generateAuthToken();
                res.cookie('jwtoken',token,{
                    expires: new Date(Date.now()+2592000000),
                    httpOnly:false
                })
                console.log(token);
                res.status(200).json({
                    message:"Successfully logged in",
                    token,
                    userData: checkUser
                });
            }else{
                res.status(422).json({error:"Incorrect password"});
            }
        }else{
            res.status(422).json({error:"Invalid User Credentials"});
        }
    }catch (error) {
        console.log(error);
        res.status(422).json({error});
    }
});

//for contact us and home page
router.post('/getdata',authenticate, (req,res)=>{
    // console.log('my user data');
    res.send(req.rootUser);
});

//for logging out
router.post('/logout',authenticate, async(req,res)=>{
    try{
    rootUser= req.rootUser;
    tokens= rootUser.tokens;
    // console.log(tokens);
    // console.log(tokens.filter((t)=>{console.log("Tokens: ",t.token,"\nToken: ",req.token,"\n",t.token===req.token,"\n");}));
    rootUser.tokens= tokens.filter((t)=>{return t.token!==req.token});
    // res.clearCookie("jwtoken",{path:"/"});
    await rootUser.save();
    res.send({msg:"Logout successful"});
    }catch(error){
        console.log(error);
        sendError(res,"Failed to logout")
    }
});


//for contact us message
router.post('/updateProfile',authenticate, async(req,res)=>{
    try {
        const {name,email,phone,gender,profilePic,societyName,societyLocation}= req.body.data;
        rootUser= req.rootUser;
        if(name)
            rootUser.name= name
        if(email)
            rootUser.email= email
        if(phone)
            rootUser.phone= phone
        if(gender)
            rootUser.gender= gender
        if(profilePic)
            rootUser.profilePic= profilePic
        if(societyName){
            // if(rootUser.societyName)
            // rootUser.societyName= societyName
            // else
            await User.updateMany({_id:rootUser._id},{$set:{societyName}})
        }
        if(societyLocation){
            // if(rootUser.societyLocation)
            // rootUser.societyLocation= societyLocation
            // else
            await User.updateOne({_id:rootUser._id},{$set:{societyLocation}})
        }
        const result= await rootUser.save();
        // console.log(result);
        console.log(result);
        res.send({msg:"your profile successfully updated"});
    } catch (error) {
        console.log(error);
    }
});


//for contact us message
router.post('/contact',authenticate, async(req,res)=>{
    try {
        
        const {name,email,phone,message}= req.body;
        rootUser= req.rootUser;
        const result = await rootUser.saveMessage({name,email,phone,message});

        //-----other ways to add message-----
        // rootUser.messages = await rootUser.messages.concat({name,email,phone,message});
        // const result= await rootUser.save();

        // const result = await User.updateOne({_id:rootUser._id},{$set:{messages:{name,email,phone,message}}})
        console.log(result);
        res.send({msg:"your message successfully saved"});
    } catch (error) {
        console.log(error);
    }
});

// for sending mail to users email for verification
router.post('/sendemail',async(req,res)=>{
    try{
        const userEmail= req.body.email;
        const userSubject= req.body.subject;
        const userContent= req.body.content;
        console.log(userEmail);
        newUser= await User.findOne({email:userEmail});
        if(!newUser) return sendError(res,'User not Found');
        // if (newUser.verified) return sendError(res, 'User already Verified');

        const token = await VerificationToken.findOne({ owner: newUser._id });
        console.log('Verification token ',token)
        if (token){                
            await VerificationToken.findByIdAndDelete(token._id);
        }

        let htmlContent;
        let mailSubject;
        if(!userContent || !userSubject){
            const OTP= generateOTP();
            mailSubject= "Verify your Email Address"
            htmlContent = `<h1>Your otp to verify email is ${OTP}</h1>`;
            const verificationToken= new VerificationToken({
                owner: newUser._id,
                token:OTP
            });
            await verificationToken.save();
        }else{
            htmlContent = userContent;
            mailSubject= userSubject;
        }
        
        await sendMail({
            from:process.env.MAIL_USERNAME2,
            to: userEmail,
            subject: "Verify your email address",
            html:htmlContent
        });
        console.log("Email successfully sent to "+userEmail);
        res.json({msg:"Email send successfully"});
        
    }catch(error){
        sendError(res,"Unable to send Email");
    }
    
})

// authenticating user by checking the given otp
router.post('/verifyemail',verifyEmail);
router.post('/isEmailVerified',isEmailVerified);

router.post('/forgotPassword', async(req,res)=>{
    try{
        console.log(req.body);
        const {email,otp,password}= req.body;
        const checkVerified = await verifyOtpToken(email,otp);
        console.log("CheckVer : ",checkVerified)
        if(checkVerified===true){
            const user = await User.findOne({email:email});
            user.password = password;
            user.save();
            res.json({msg:"password changed successfully"});
        }else{
            sendError(res,checkVerified)
        }
    }catch(error){
        console.log(error);
        // console.log();
        sendError(res,"Failed to change password");
    }
    
});

router.post('/home/contact', async(req,res)=>{
    try {
        console.log(req.body);
        const { firstName, lastName, subject, email, city, mobile, message} = req.body.data;

        const contact = new ContactModel({
            firstName,
            lastName,
            subject,
            email,
            city,
            mobile, 
            message
        });

        contact.save()
            .then(result => res.status(201).send({msg: "Contact Register Successfully"}))
            .catch(error => {
                console.log(error)
                res.status(500).send(error)
            })
        
    }catch(error){
        console.log(error)
        return res.status(500).send(error);
    }
 }) 
 
//for saving alerts to DB
router.post('/saveAlerts',authenticate, async(req,res)=>{
    try {
        
        const alertMsg= req.body.data;
        rootUser= req.rootUser;
        const alert= await Alert.findOne({owner:rootUser._id})
        if(alert){
            await alert.addAlert(alertMsg)
        }else{
            const nalert= new Alert({owner:rootUser._id,alerts:alertMsg});
            await nalert.save()
        }

        console.log(alert);
        res.send({msg:"Alert successfully saved"});
    } catch (error) {
        console.log(error);
    }
});

 
//for getting alerts from DB
router.post('/getAlerts',authenticate, async(req,res)=>{
    try {
        rootUser= req.rootUser;
        const alert= await Alert.findOne({owner:rootUser._id})
        if(alert){
            res.send({adminAlerts:alert,status:'ok'});
            console.log(alert);
        }else{
            sendError(res,"User not found");
        }
    } catch (error) {
        console.log(error);
    }
});


// related to the data send by the esp
router.post('/setSensorData',setSensorData);
router.post('/getSensorData',getSensorData);
router.post('/updateSensorData',updateSensorData);

// to fetch upper tank depth
router.post('/setTankInfo',setTankInfo);
router.post('/getTankInfo',getTankInfo);

//upper to home tank
router.post('/setHomeData',setHomeData);
router.post('/getHomeData',getHomeData);
router.post('/updateHomeData',updateHomeData);

// related to esp configuration data
router.post('/setEspConfigData',authenticate,setEspConfigData);
router.post('/getEspConfigData',getEspConfigData);
router.post('/fetchEspConfigData',authenticate,fetchEspConfigData);

router.post('/saveSupplyList',authenticate,saveSupplyList);
router.post('/getSupplyList',authenticate,getSupplyList);
router.post('/updateSupplyDetails',authenticate,updateSupplyDetails);

module.exports = router;
