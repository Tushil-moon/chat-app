import { inject, Injectable } from '@angular/core';
import { Auth, authState, User } from '@angular/fire/auth';
import { Database, ref, set, onValue } from '@angular/fire/database';
import { from, Observable } from 'rxjs';
import { Receiver } from '../../../Modules/chat/model/receiver';
import { Status } from '../../../Modules/chat/model/status';

@Injectable({
  providedIn: 'root',
})
export class PresenseService {
  private db = inject(Database);
  private auth = inject(Auth);

  /**
   * track user presenece
   */
  trackUserPresence() {
    authState(this.auth).subscribe((user: User) => {
      if (user) {
        const statusRef = ref(this.db, `status/${user.uid}`);
        const connectedRef = ref(this.db, '.info/connected');
        onValue(connectedRef, (snapshot) => {
          const connected = snapshot.val();
          if (connected) {
            set(statusRef, { status: 'online', last_changed: Date.now() });
            window.addEventListener('beforeunload', () => {
              set(statusRef, { status: 'offline', last_changed: Date.now() });
            });
            
          } else {
            set(statusRef, { status: 'offline', last_changed: Date.now() });
          }
        });
      }
    });
  }

  /**
   * handle user status by user id
   * 
   * @param receiver receiver user detail
   * @returns status
   */
  getStatusByUserId(receiver: Receiver): Observable<Status> {
    const uid = receiver?.uid;
    if (uid) {
      const statusRef = ref(this.db, `status/${uid}`);

      return new Observable<Status>((observer) => {
        onValue(statusRef, (snapshot) => {
          const status = snapshot.val();
          if (status) {
            observer.next(status);
          } else {
            observer.next({ last_changed: 0, status: '' });
          }
        });
      });
    } else {
      console.error('uid not exist in status');
      return from([{ last_changed: 0, status: '' }]);
    }
  }
}
