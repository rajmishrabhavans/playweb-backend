const { isValidObjectId } = require('mongoose');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const User = require('../model/userSchema');
const verificationToken = require('../model/verificationToken');
const VerificationToken = require('../model/verificationToken');
// const {mailTransport} = require('./mail');
const { sendError } = require('./helper');

exports.generateOTP = () => {
  let otp = '';
  for (let i = 0; i <= 5; i++) {
    const randVal = Math.round(Math.random() * 9);
    otp += randVal;
  }
  return otp;
}

async function sendMail(details) {
  try {
    const { from, to, subject, html } = details;
    const oauth2Client = new OAuth2(
      process.env.MAIL_CLIENT_ID,
      process.env.MAIL_SECRET,
      "https://developers.google.com/oauthplayground" // Redirect URL
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.MAIL_REFRESH_TOKEN
    });
    const accessToken = await oauth2Client.getAccessToken();
    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.MAIL_USERNAME,
        clientId: process.env.MAIL_CLIENT_ID,
        clientSecret: process.env.MAIL_SECRET,
        refresh_token: process.env.MAIL_REFRESH_TOKEN,
        accessToken: accessToken.token
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    // console.log('my Access token : ',accessToken.token);

    const mailOptions = {
      from,
      to,
      subject,
      html,
    };
    smtpTransport.sendMail(mailOptions, (error, response) => {
      error ? console.log(error) : console.log('Verification email sent');
      smtpTransport.close();
    });
  } catch (error) {
    console.log(error);
    sendError(res,"Unable to send Email")
  }
}

exports.isEmailVerified = async (req, res) => {
  const userID = req.userID;
  const user = await User.findById(userID);
  if (!user) return res.json({ msg: 'not found' });
  else return res.json({ msg: 'found' });
}

exports.verifyEmail = async (req, res) => {
  try {
    const userID = req.userID;
    const otp = req.body.otp;
    if (!userID || !otp) {
      return sendError(res, "Invalid request missing parameters")
    }
    if (!isValidObjectId(userID)) {
      return sendError(res, "Invalid user id")
    }
    const user = await User.findById(userID);
    if (!user) return sendError(res, 'Sorry User not found');

    if (user.verified) return sendError(res, 'User already Verified');
    const token = await VerificationToken.findOne({ owner: user._id });
    if (!token) return sendError(res, 'Sorry User not found');
    const isMatched = await token.compareToken(otp);
    console.log(req.body, isMatched);
    if (!isMatched) return sendError(res, 'Please provide valid otp');
    user.verified = true;
    await verificationToken.findByIdAndDelete(token._id);
    await user.save();

    sendMail({
      from: process.env.MAIL_USERNAME2,
      to: user.email,
      subject: "Email Verification Success",
      html: `<h1>Your email has been verified successfully</h1>`,
    })
    // console.log(status);
    res.json({ msg: "Email verified Successfully" });
  } catch (error) {
    console.log(error);
    sendError(res,"Unable to verify Email")
  }
}

exports.sendMail = sendMail;