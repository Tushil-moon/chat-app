import { inject, Injectable } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import {
  createUserWithEmailAndPassword,
  User,
  UserCredential,
} from 'firebase/auth';
import { BehaviorSubject, catchError, from, map, Observable } from 'rxjs';
import { loginUser } from '../../Modules/auth/model/user';
import { toSignal } from '@angular/core/rxjs-interop';
import { Database, ref, set } from '@angular/fire/database';
import { get } from '@angular/fire/database';
import { Receiver } from '../../Modules/chat/model/receiver';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private db = inject(Database);

  /**
   * Hold current user
   */
  user$: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);

  /**
   * Handle Auth State
   */
  authState = toSignal(
    new Observable(() => {
      onAuthStateChanged(this.auth, (user) => {
        this.user$.next(user);
      });
    })
  );

  /**
   * Hnadle Login request
   *
   * @param user user data
   * @returns loggedin user data
   */
  login(user: loginUser): Observable<User | null> {
    const email = user.email;
    const password = user.password;
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map((userCredential) => userCredential.user)
    );
  }

  /**
   * Handle User Logout
   *
   * @returns void
   */
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      catchError((error) => {
        console.error('Logout failed', error);
        return [];
      })
    );
  }

  /**
   * Handle User Registration
   *
   * @param user user data to be register
   * @returns user credential
   */
  register(email: string, password: string): Observable<UserCredential> {
    return from(createUserWithEmailAndPassword(this.auth, email, password));
  }

  /**
   * handle reset password
   *
   * @param email email for sent link
   * @returns nothing
   */
  resetPassword(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email));
  }

  /**
   * handle store profile in db
   *
   * @param user user details
   * @returns nothing
   */
  saveProfileInDb(user: User): Observable<void> {
    const userRef = ref(this.db, 'users/' + user.uid);
    return from(
      set(userRef, {
        email: user.email,
        username: user.displayName,
        photoUrl: user.photoURL,
      })
    ).pipe(
      catchError((error) => {
        console.error('Error saving user data:', error);
        return [];
      })
    );
  }

  /**
   * Fetch all users
   *
   * @returns user details
   */
  getAllUsers(): Observable<Receiver[]> {
    const usersRef = ref(this.db, 'users');
    return new Observable((observer) => {
      get(usersRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const users: any[] = [];
            snapshot.forEach((childSnapshot) => {
              const userData = childSnapshot.val();
              users.push({ uid: childSnapshot.key, ...userData });
            });
            observer.next(users);
          } else {
            observer.next([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching users:', error);
          observer.error(error);
        });
    });
  }
}
