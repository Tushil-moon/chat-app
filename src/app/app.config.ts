import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideFirebaseApp } from '@angular/fire/app';
import { initializeApp } from 'firebase/app';
import { environment } from './Environment/environment';
import { provideHttpClient } from '@angular/common/http';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { provideAnimations } from '@angular/platform-browser/animations';
import { getStorage, provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    provideDatabase(() => getDatabase()),
    provideAuth(() => getAuth()),
    provideMessaging(() => getMessaging()), 
    provideStorage(() => getStorage()),
  ]
};
