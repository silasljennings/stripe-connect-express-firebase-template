'use strict';
const config = require('../config');
const stripe = require('stripe')(config.stripe.secretKey, { apiVersion: config.stripe.apiVersion || '2022-08-01' });
const express = require('express');
const Vendor = require("../models/vendor");
const router = express.Router();

/**
 * GET /vendors/stripe/authorize
 *
 * Redirect to Stripe to set up payments.
 */
router.get('/authorize', async (req, res, next) => {
  // Generate a random string as `state` to protect from CSRF and include it in the session
  req.session.state = Math.random().toString(36).slice(2);
  try {
    let signupToken = req.query.signupToken;
    const user = await Vendor.getVendorApplicationBySignupToken(signupToken);
    let connectedAccountId = user.scaid;

    // Create a Stripe account for this user if one does not exist already
    if (connectedAccountId === '') {
      // Define the parameters to create a new Stripe account with
      let accountParams = {
        type: 'express',
        country: user.country || undefined,
        email: user.email || undefined,
        business_type: user.accountType || 'individual',
      }
  
      // Companies and individuals require different parameters
      if (accountParams.business_type === 'company') {
        accountParams = Object.assign(accountParams, {
          company: {
            name: user.businessName || undefined
          }
        });
      } else {
        accountParams = Object.assign(accountParams, {
          individual: {
            first_name: user.firstName || undefined,
            last_name: user.lastName || undefined,
            email: user.email || undefined
          }
        });
      }

      // create connected account and customer account so subscription can be applied
      const connectedAccount = await stripe.accounts.create(accountParams);
      connectedAccountId = connectedAccount.id;
      const customerAccount = await stripe.customers.create({ email: user.email });
      const customerAccountId = customerAccount.id;

      // Update the model and store the Stripe account ID in the datastore:
      // this Stripe account ID will be used to issue payouts to the vendor
      user.scaid = connectedAccountId;
      user.scid = customerAccountId;
      await user.save();
    }

    // Create an account link for the user's Stripe account onboarding
    const accountLink = await stripe.accountLinks.create({
      account: connectedAccountId,
      refresh_url: config.publicDomain + `/vendors/stripe/authorize?signupToken=${signupToken}`,
      return_url: config.publicDomain + `/vendors/stripe/onboarded?signupToken=${signupToken}`,
      type: 'account_onboarding'
    });
    res.redirect(accountLink.url);
  } catch (err) {
    console.log('Failed to create a Stripe account.');
    console.log(err);
    next(err);
  }
});

/**
 * GET /vendors/stripe/onboarded
 *
 * Return endpoint from Stripe onboarding, checks if onboarding has been completed
 */
router.get('/onboarded', async (req, res, next) => {
  try {
    // Retrieve the user's Stripe account and check if they have finished onboarding
    let signupToken = req.query.signupToken;
    const user = await Vendor.getVendorApplicationBySignupToken(signupToken);
    const connectedAccount = await stripe.account.retrieve(user.scaid);

    if (connectedAccount.details_submitted) {
      if (user.scid !== '') {
        const subscription = await stripe.subscriptions.create({
          customer: user.scid, // Use the customer ID associated with the account
          items: [{ price: config.stripe.freeSubscriptionPriceId }], // Replace with your free plan price ID
        });
        user.onboardingComplete = true;
        await req.user.save();
        req.flash('showBanner', 'true');
        res.redirect('/vendors/login');
      } else {
        console.log('The onboarding process was not completed due to a customer account id not being created.');
        res.redirect('/vendors/signup');
      }
    } else {
      console.log('The onboarding process was not completed.');
      res.redirect('/vendors/signup');
    }
  } catch (err) {
    console.log('Failed to retrieve Stripe account information.');
    console.log(err);
    next(err);
  }
})
module.exports = router;
