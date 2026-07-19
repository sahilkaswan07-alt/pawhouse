// js/firebase.js
// Saves the registration to Firestore, including the pet photo.
//
// NOTE: Firebase Storage now requires the paid Blaze plan (a Google policy
// change effective Feb 2026) — it can no longer be used on the free Spark
// plan at all, even within the free quota. So instead of uploading the
// photo to Storage, we compress it in the browser and store it directly
// as a field inside the Firestore document. Firestore itself stays fully
// free on Spark. Firestore's per-document limit is 1 MiB, so the photo is
// resized/compressed client-side to comfortably fit well under that.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCkNU-b_ItnJhWTDNxwewuRG_DLBCGuCDk",
  authDomain: "paw-house-7acb6.firebaseapp.com",
  projectId: "paw-house-7acb6",
  storageBucket: "paw-house-7acb6.firebasestorage.app",
  messagingSenderId: "461862762380",
  appId: "1:461862762380:web:3a51d5410857d5966a48a9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Resizes + re-encodes a base64 image data URL down to a small JPEG,
// so it comfortably fits inside a Firestore document (1 MiB limit).
function compressImage(dataUrl, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round(height * (maxDim / width));
        width = maxDim;
      } else if (height >= width && height > maxDim) {
        width = Math.round(width * (maxDim / height));
        height = maxDim;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Compresses the pet photo and saves the full registration (including the
 * photo) to Firestore. Returns { id, photoURL } on success — photoURL here
 * is the compressed base64 JPEG data itself (not a hosted link), null on
 * failure.
 */
window.saveUserToFirebase = async function (formData, petPhotoDataUrl, razorpayPaymentId) {
  try {
    let photoData = "";

    if (petPhotoDataUrl) {
      // First pass: reasonable size/quality.
      photoData = await compressImage(petPhotoDataUrl, 800, 0.6);
      // Firestore hard limit is 1 MiB per document; stay well under it.
      if (photoData.length > 700000) {
        photoData = await compressImage(petPhotoDataUrl, 500, 0.45);
      }
    }

    const docRef = await addDoc(collection(db, "registrations"), {
      ownerName: formData.ownerName || "",
      ownerContact: formData.ownerContact || "",
      ownerEmail: formData.ownerEmail || "",
      petName: formData.petName || "",
      petBreed: formData.petBreed || "",
      petSex: formData.petSex || "",
      petAge: formData.petAgeDisplay || "",
      petPhoto: photoData,
      razorpayPaymentId: razorpayPaymentId || "",
      createdAt: serverTimestamp()
    });

    return { id: docRef.id, photoURL: photoData };
  } catch (err) {
    console.error("saveUserToFirebase error:", err);
    return null;
  }
};