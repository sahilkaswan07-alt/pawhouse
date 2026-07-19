
// js/register.js
// This file previously defined a duplicate, broken window.saveUserToFirebase()
// (imported a non-existent "db" export from firebase.js, and skipped the
// photo upload entirely). All of that logic now lives in js/firebase.js,
// which is the single source of truth for saving registrations.
//
// Kept as an empty module so the existing <script type="module" src="js/register.js">
// tag in registration.html doesn't need to be removed. Safe to delete this
// file and the script tag entirely if you prefer.