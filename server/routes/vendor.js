'use strict';
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const router = express.Router();
const Vendor = require('../models/vendor');


/**
 * GET /vendors/signup
 *
 * Display the signup form on the right step depending on the current completion.
 */
router.get('/signup', async (req, res) => {

  let signupToken = req.query.signupToken;
  let error = '';
  let step;

  if (signupToken) {
    const vendor = await Vendor.getVendorApplicationBySignupToken(signupToken);
    if (vendor) {
        if (!vendor.email) {
          step = 'account';
        } else if (!vendor.lastName || !vendor.firstName) {
          console.log(vendor.email)
          const isEmailUnique = await Vendor.isEmailUnique(vendor.email);
          if (isEmailUnique) {
            step = 'profile';
          } else {
            error = 'This email entered is already associated with another account';
            step = 'account';
          }
        } else if (!vendor.onboardingComplete) {
          step = 'payments';
        } else {
          step = 'done';
        }
    } else {
      // If token exists but no vendor found, generate a new vendor with this token
      error = 'Please refresh the page to retry signup';
      step = 'account';
    }
  } else {
    step = 'account';
    signupToken = uuidv4();
    const newVendor = new Vendor({ signupToken: signupToken });
    await newVendor.save();
  }
  res.render('signup', { step: step, signupToken: signupToken, error: error });
});


/**
 * POST /vendors/signup
 *
 * Create a user and update profile information during the pilot onboarding process.
 */
router.post('/signup', async (req, res) => {
  const updatingFields = req.body;
  const signupToken = req.query.signupToken;
  if (!signupToken) { return res.render('signup', { step: 'account', signupToken: null, error: 'Please refresh the page to retry signup' }); }
  let vendor = await Vendor.getVendorApplicationBySignupToken(signupToken);
  if (!vendor) { return res.render('signup', { step: 'account', signupToken: signupToken, error: 'Please refresh the page to retry signup' }); }
  Object.assign(vendor, updatingFields);
  vendor.updatedStamp = new Date().getTime();
  console.log(JSON.stringify(vendor))
  await vendor.save();
  res.redirect(`/vendors/signup?signupToken=${signupToken}`);
});


/**
 * GET /vendors/login
 *
 * Redirect to vendor console login.
 */
router.get('/login', (req, res) => {
  res.redirect('https://test.vendors.cashboardapp.co');
});


/**
 * GET /vendors/demo
 *
 * Redirect to demos page.
 */
router.get('/demo', (req, res) => {
  res.redirect('https://cashboardapp.co');
});

module.exports = router;
