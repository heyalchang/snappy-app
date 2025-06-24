/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
// import {onSchedule} from "firebase-functions/v2/scheduler";
// import * as logger from "firebase-functions/logger";
// import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
// admin.initializeApp();

// Set global options for cost control
setGlobalOptions({maxInstances: 10});

// TODO: Implement scheduled function to delete expired stories
// export const deleteExpiredStories = onSchedule(
//   "every 1 hours",
//   async (event) => {
//     logger.info("Starting expired stories cleanup");
//
//     const now = admin.firestore.Timestamp.now();
//     const twentyFourHoursAgo = new admin.firestore.Timestamp(
//       now.seconds - 24 * 60 * 60,
//       now.nanoseconds
//     );
//
//     // Query and delete expired stories
//     // Implementation added when Stories feature is built
//   }
// );
