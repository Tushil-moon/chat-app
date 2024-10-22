importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: 'AIzaSyBn6L7kaQJ3T9C05x0FUfEyG8YZSMcED-I',
    authDomain: 'angularchatapp-8b6c5.firebaseapp.com',
    databaseURL: 'https://angularchatapp-8b6c5-default-rtdb.firebaseio.com',
    projectId: 'angularchatapp-8b6c5',
    storageBucket: 'angularchatapp-8b6c5.appspot.com',
    messagingSenderId: '944742361264',
    appId: '1:944742361264:web:e9249d132ab57a1b113375',
    measurementId: 'G-99FZM2W5EQ',
    vapidKey:'BKQeP6dwy2G4tXozVtDMXs76_GzQEB2HufE9xGjV1GsZCjA0NG65Qd6uJ4yaCQD-HWe0mISz0E5henJma0w7lFc'
}

// Initialize Firebase app
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging(app); // Pass the initialized app instance
 
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message: ', payload);
}); 