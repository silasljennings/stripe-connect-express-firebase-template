'use strict';
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const db = admin.firestore();

class Vendor {
  constructor(data) {
    this.id = data?.id ?? uuidv4();
    this.signupToken = data.signupToken;
    this.vendorId = data.vendorId ?? `vend-${ Math.floor(10000000 + Math.random() * 90000000).toString() }`;
    this.scid = data.scid ?? '';
    this.scaid = data.scaid ?? '';
    this.email = data?.email ?? '';
    this.accountType = data?.accountType ?? 'company';
    this.firstName = data?.firstName ?? '';
    this.lastName = data?.lastName ?? '';
    this.phoneNumber = data?.phoneNumber ?? '';
    this.address = data?.address ?? '';
    this.postalCode = data?.postalCode ?? '';
    this.city = data?.city ?? '';
    this.state = data?.state ?? '';
    this.country = data?.country ?? 'US';
    this.createdStamp = data?.createdStamp ?? new Date().getTime();
    this.updatedStamp = data?.updatedStamp ?? new Date().getTime();
    this.businessName = data?.businessName ?? '';
    this.onboardingComplete = data?.onboardingComplete ?? false;
    this.isAthlete = data?.isAthlete ?? false;
  }

  static async isEmailUnique(email) {
    const vendorsCollectionRef = await db.collection('vendors').get();
    let isUnique = true;

    // Loop over each vendor in the vendors collection and check if the email being entered for signup already exists in the system
    for (const vendorDoc of vendorsCollectionRef.docs) {
      console.log(vendorDoc.data())
      const vendorId = vendorDoc.data().vendorId;
      console.log(vendorId);
      // Get the users collection for each vendor
      const usersCollectionRef = await db.collection(`vendors/${vendorId}/users`)
          .where('email', '==', email)
          .get();

      // If any document exists in the users collection with this email, set isUnique to false
      if (!usersCollectionRef.empty) {
        isUnique = false;
        break;
      }
    }
    return isUnique;
  }

  static async getVendorApplicationBySignupToken(signupToken) {
    const snapshot = await db.collection('applications').where('signupToken', '==', signupToken).limit(1).get();
    if (snapshot.empty) return null;
    const vendorData = snapshot.docs[0].data();
    vendorData.id = snapshot.docs[0].id;
    return new Vendor(vendorData);
  }

  async save() {
    const vendorData = {
      id: this.id,
      signupToken: this.signupToken,
      vendorId: this.vendorId,
      scid: this.scid,
      scaid: this.scaid,
      email: this.email,
      accountType: this.accountType,
      firstName: this.firstName,
      lastName: this.lastName,
      phoneNumber: this.phoneNumber,
      address: this.address,
      postalCode: this.postalCode,
      city: this.city,
      state: this.state,
      country: this.country,
      createdStamp: this.createdStamp,
      updatedStamp: this.updatedStamp,
      businessName: this.businessName,
      onboardingComplete: this.onboardingComplete,
      isAthlete: this.isAthlete
    };
    console.log('saving', vendorData);
    await db.collection('applications').doc(vendorData.id).set(vendorData);
  }
}

module.exports = Vendor;
