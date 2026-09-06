const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

/* ---------------- FCM PUSH NOTIFICATION ON NOTIFICATION CREATION ---------------- */
exports.onNotificationCreated = onDocumentCreated(
  "users/{userId}/notifications/{notificationId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const notifData = snap.data();
    const userId = event.params.userId;

    if (!notifData || !notifData.title || !notifData.message) return;

    // Fetch user document to get fcmToken
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    if (!userDoc.exists) return;

    const fcmToken = userDoc.data()?.fcmToken || notifData.fcmToken;
    if (!fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return;
    }

    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: notifData.title,
          body: notifData.message,
        },
        android: {
          priority: "high",
          notification: {
            channelId: "default",
            sound: "default",
            priority: "high",
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
              contentAvailable: true,
            },
          },
        },
        data: {
          title: String(notifData.title || ""),
          body: String(notifData.message || ""),
          message: String(notifData.message || ""),
          type: String(notifData.type || "warning"),
          violationReason: String(notifData.violationReason || ""),
          blockType: String(notifData.blockType || ""),
          executionTime: String(notifData.executionTime || ""),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      });
      console.log(`FCM push notification sent successfully to user ${userId} (Token: ${fcmToken})`);
    } catch (err) {
      console.error(`Error sending FCM push notification to user ${userId}:`, err);
    }
  }
);

exports.onWorkerVerificationStatusChange = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    const before = event.data.before?.data();
    const after = event.data.after?.data();
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
            ? "Your documents have been verified successfully."
            : "Your documents were rejected. Please upload valid documents.",
        type: "document_status",
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
            ? "Bank Details Approved"
            : "Bank Details Rejected",
        message:
          status === "verified"
            ? "Your bank account details have been verified successfully."
            : "Your bank details were rejected. Please re-check and update them.",
        type: "bank",
      });
    }

    if (notifications.length === 0) return;

    const userRef = admin.firestore().collection("users").doc(userId);
    const userDoc = await userRef.get();
    const fcmToken = userDoc.data()?.fcmToken;

    for (const notif of notifications) {
      // 🔔 Store notification
      await userRef.collection("notifications").add({
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 📲 Send push notification
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
