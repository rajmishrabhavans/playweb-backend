const jwt = require('jsonwebtoken');
const User = require('../model/userSchema');

const authenticate = async(req,res,next) => {
    try {
        const cookies = req.body.cookie;
        // console.log("Cookies: ",cookies);
        // console.log("Headers: ",req.body);
        if(!cookies){
            return res.status(401).json({error:"token not found!"});
        }
        const cookie= cookies.substring(cookies.indexOf('=')+1);

        // console.log(cookie);
        const token= cookie;
        const verifyToken = jwt.verify(token,process.env.SECRET_KEY);
        const rootUser = await User.findOne({_id:verifyToken._id, "tokens.token":token});
        if(!rootUser){throw new Error('User not found!')};

        req.token= token;
        req.rootUser= rootUser;
        req.userID= rootUser._id;
        next();
        
    } catch (error) {
        res.status(401).json({error:"Unauthorized: No token provided"})
        console.log(error);
    }
}
module.exports = authenticate;
