

import {
  db,
  collection,
  addDoc,
  serverTimestamp
} from "./js/firebase.js";





import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export { collection, addDoc, serverTimestamp };
















import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCkNU-b_ItnJhWTDNxwewuRG_DLBCGuCDk",
  authDomain: "paw-house-7acb6.firebaseapp.com",
  projectId: "paw-house-7acb6",
  storageBucket: "paw-house-7acb6.firebasestorage.app",
  messagingSenderId: "461862762380",
  appId: "1:461862762380:web:3a51d5410857d5966a48a9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);