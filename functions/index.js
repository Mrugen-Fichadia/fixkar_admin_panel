/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {setGlobalOptions} = require("firebase-functions");
// const {onRequest} = require("firebase-functions/https");
// const logger = require("firebase-functions/logger");







// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.



//setGlobalOptions({ maxInstances: 10 });



// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
// const functions = require("firebase-functions");
// const admin = require("firebase-admin");

// admin.initializeApp();

// exports.onWorkerVerificationStatusChange = functions.firestore
//   .document("users/{userId}")
//   .onUpdate(async (change, context) => {
//     const before = change.before.data();
//     const after = change.after.data();
//     const userId = context.params.userId;

//     if (!before || !after) return null;

//     const notifications = [];

//     /* ----------------------------
//      * DOCUMENT STATUS
//      * ---------------------------- */
//     if (
//       before.documentVerificationStatus !==
//       after.documentVerificationStatus
//     ) {
//       const status = after.documentVerificationStatus;

//       notifications.push({
//         title:
//           status === "verified"
//             ? "Documents Approved"
//             : "Documents Rejected",
//         message:
//           status === "verified"
//             ? "Your documents have been successfully verified."
//             : "Your documents were rejected. Please upload valid documents.",
//         type: "DOCUMENT_STATUS",
//       });
//     }

//     /* ----------------------------
//      * BANK STATUS
//      * ---------------------------- */
//     if (
//       before.bankDetailsVerificationStatus !==
//       after.bankDetailsVerificationStatus
//     ) {
//       const status = after.bankDetailsVerificationStatus;

//       notifications.push({
//         title:
//           status === "verified"
//             ? "Bank Details Verified"
//             : "Bank Details Rejected",
//         message:
//           status === "verified"
//             ? "Your bank details have been verified successfully."
//             : "Your bank details were rejected. Please re-check and update.",
//         type: "BANK_STATUS",
//       });
//     }

//     if (notifications.length === 0) return null;

//     const userRef = admin.firestore().collection("users").doc(userId);
//     const userDoc = await userRef.get();
//     const fcmToken = userDoc.data()?.fcmToken;

//     for (const notif of notifications) {
//       // 1️⃣ Store notification in Firestore
//       await userRef.collection("notifications").add({
//         title: notif.title,
//         message: notif.message,
//         type: notif.type,
//         isRead: false,
//         createdAt: admin.firestore.FieldValue.serverTimestamp(),
//       });

//       // 2️⃣ Send FCM push
//       if (fcmToken) {
//         await admin.messaging().send({
//           token: fcmToken,
//           notification: {
//             title: notif.title,
//             body: notif.message,
//           },
//           data: {
//             type: notif.type,
//           },
//         });
//       }
//     }

//     return null;
//   });
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onWorkerVerificationStatusChange = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    const userId = event.params.userId;

    if (!before || !after) return;

    const notifications = [];

    /* ---------------- DOCUMENT STATUS ---------------- */
    if (
      before.documentVerificationStatus !==
      after.documentVerificationStatus
    ) {
      const status = after.documentVerificationStatus;

      notifications.push({
        title:
          status === "verified"
            ? "Documents Approved"
            : "Documents Rejected",
        message:
          status === "verified"
            ? "Your documents have been successfully verified."
            : "Your documents were rejected. Please upload valid documents.",
        type: "DOCUMENT_STATUS",
      });
    }

    /* ---------------- BANK STATUS ---------------- */
    if (
      before.bankDetailsVerificationStatus !==
      after.bankDetailsVerificationStatus
    ) {
      const status = after.bankDetailsVerificationStatus;

      notifications.push({
        title:
          status === "verified"
            ? "Bank Details Verified"
            : "Bank Details Rejected",
        message:
          status === "verified"
            ? "Your bank details have been verified successfully."
            : "Your bank details were rejected. Please re-check and update.",
        type: "BANK_STATUS",
      });
    }

    if (notifications.length === 0) return;

    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();
    const fcmToken = userDoc.data()?.fcmToken;

    for (const notif of notifications) {
      await userRef.collection("notifications").add({
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: {
            title: notif.title,
            body: notif.message,
          },
          data: {
            type: notif.type,
          },
        });
      }
    }
  }
);
