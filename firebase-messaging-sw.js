importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon-192.png"
  });
});

const firebaseConfig = {
  apiKey: "AIzaSyCkNU-b_ItnJhWTDNxwewuRG_DLBCGuCDk",
  authDomain: "paw-house-7acb6.firebaseapp.com",
  projectId: "paw-house-7acb6",
  storageBucket: "paw-house-7acb6.firebasestorage.app",
  messagingSenderId: "461862762380",
  appId: "1:461862762380:web:3a51d5410857d5966a48a9"
};
