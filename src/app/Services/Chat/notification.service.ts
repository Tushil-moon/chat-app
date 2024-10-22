import { inject, Injectable } from '@angular/core';
import { initializeApp } from '@angular/fire/app';
import {
  getMessaging,
  getToken,
  Messaging,
  onMessage,
} from '@angular/fire/messaging';
import { environment } from '../../Environment/environment';
import { ref, set } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { AuthService } from '../Auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private db = inject(Database);
  auth = inject(AuthService)
  requestPermission() {
    console.log('Requesting notification permission...');
    Notification.requestPermission()
      .then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          this.getFCMToken();
        } else {
          console.warn('Notification permission not granted.');
        }
      })
      .catch((error) => {
        console.error('Error requesting permission:', error);
      });
  }

  getFCMToken() {
    try {
      const app = initializeApp(environment.firebaseConfig);
      const messaging: Messaging = getMessaging(app);
      getToken(messaging, { vapidKey: environment.firebaseConfig.vapidKey })
        .then((currentToken) => {
          if (currentToken) {
            console.log('FCM Token:', currentToken);
            if(this.auth.user$.value?.uid){
              const fcmTokenRef = ref(this.db, `users/${this.auth.user$.value?.uid}/fcmToken`);
              set(fcmTokenRef, currentToken)
                .then(() => {
                  console.log('FCM token saved to Firebase');
                })
                .catch((error) => {
                  console.error('Error saving FCM token to Firebase:', error);
                });
            }
            
          } else {
            console.warn('No registration token available.');
          }
        })
        .catch((error) => {
          console.error('Error retrieving FCM token:', error);
        });
    } catch (error) {
      console.error('Error initializing Firebase app:', error);
    }
  }
  listenForMessages() {
    onMessage(getMessaging(), (payload) => {
      console.log('Message received: ', payload);
    });
  }
}
