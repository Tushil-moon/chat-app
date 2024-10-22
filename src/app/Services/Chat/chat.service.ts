import { inject, Injectable } from '@angular/core';
import { Database, ref, push, update, get } from '@angular/fire/database';
import { Message, Chatdetail } from '../../Modules/chat/model/chatDetail';
import { from, Observable, switchMap } from 'rxjs';
import { equalTo, onValue, orderByChild, query } from 'firebase/database';
import { AuthService } from '../Auth/auth.service';
import { Receiver } from '../../Modules/chat/model/receiver';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../Environment/environment';
import { CryptoService } from '../Crypto/crypto.service';


@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private db = inject(Database);
  private auth = inject(AuthService);
  private http = inject(HttpClient)
  private crypto = inject(CryptoService);
  /**
   * Generates a unique chat ID based on the two usernames (sorted alphabetically).
   *
   * @param userId1 UID of the first user
   * @param userId2 UID of the second user
   * @returns the unique chat ID
   */
  getChatId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }
  /**
   * Gets the messages exchanged between two users for the logged-in user
   *
   * @param userId Current user
   * @returns Observable of the messages array
   */
  getChats(userId: string): Observable<Chatdetail[]> {
    // console.log(userId);
    const chatsRef = ref(this.db, 'chats');

    return new Observable<Chatdetail[]>((observer) => {
      const chatQuery = query(
        chatsRef,
        orderByChild(`participants/${userId}`),
        equalTo(true)
      );

      onValue(
        chatQuery,
        (snapshot) => {
          const data = snapshot.val();
          const chatList: Chatdetail[] = [];

          if (data) {
            // Iterate through each child in the data
            snapshot.forEach((childSnapshot) => {
              const chatDetail: Chatdetail = childSnapshot.val();
              const messages: Message[] = chatDetail.messages;
              const messageList: Message[] = [];
              // Iterate through each message in the messages object
              Object.entries(messages).forEach(
                ([messageId, message]: [string, Message]) => {
                  messageList.push({
                    ...message,
                    id: messageId,
                  });
                }
              );
              const active = localStorage.getItem('activeChat');

              messageList.forEach((message) => {
                if (
                  message.receiverid === this.auth.user$.value?.uid &&
                  active
                ) {
                  const chat: Receiver = JSON.parse(active);
                  console.log(this.auth.user$.value?.uid);
                  // Check if the sender is the active chat user
                  if (message.senderId === (chat && chat.uid)) {
                    console.log(message.senderId === chat.uid);
                    console.log(message.readStatus);
                    if (message.readStatus === 'sent') {
                      // Only update if not already read
                      message.readStatus = 'read'; // Mark as read if the sender is the active chat
                      this.updateMessageStatus(message);
                    }
                  } else {
                    // Mark as delivered if the message is not from the active chat
                    if (message.readStatus === 'sent') {
                      // Only update if not already delivered
                      message.readStatus = 'delivered';
                      this.updateMessageStatus(message)
                    }
                  }
                }
              });
              chatList.push({
                ...chatDetail,
                id: childSnapshot.key,
                messages: messageList,
              });
            });
          }
          observer.next(chatList as Chatdetail[]);
        },
        (error) => {
          observer.error(error);
        }
      );
    });
  }

  /**
   * send the message to other user
   *
   * @param senderId sender id
   * @param receiverId receiver id
   * @param message message to be sent
   * @returns nothing
   */
  sendMessage(
    senderId: string,
    receiverId: string,
    message: Message
  ): Observable<void> {
    const chatId = this.getChatId(senderId, receiverId);

    const chatRef = ref(this.db, `chats/${chatId}/messages`);
    const participantsRef = ref(this.db, `chats/${chatId}/participants`);

    const participants = {
      [senderId]: true,
      [receiverId]: true,
    };

    const updates: any = {};
    updates[`chats/${chatId}/participants`] = participants;
    updates[`chats/${chatId}/messages/${push(chatRef).key}`] = message;

    return from(update(ref(this.db), updates)).pipe(
      switchMap(() => {
        // After sending the message, trigger a notification to the receiver
        return this.sendNotification(receiverId, message.text);
      })
    );;
  }

   /**
   * Send notification to a specific user
   * 
   * @param receiverId receiver user ID
   * @param messageText text of the message
   * @returns observable of void
   */
   private sendNotification(receiverId: string, messageText: string): Observable<void> {
    // Get receiver's FCM token (assume you store it in the database)
    console.log("hello")
    const fcmTokenRef = ref(this.db, `users/${receiverId}/fcmToken`);
  
    return from(get(fcmTokenRef)).pipe(
      switchMap((tokenSnapshot) => {
        const fcmToken = tokenSnapshot.val();  // Get FCM token from database
        if (fcmToken) {
          // Prepare the notification payload
          const payload = {
            notification: {
              title: this.auth.user$.value?.displayName,  // Custom title with sender's name
              body: this.crypto.decrypt(messageText),  // Decrypted message text
              icon: this.auth.user$.value?.photoURL,  // Sender's profile picture as the notification icon
              click_action: 'FLUTTER_NOTIFICATION_CLICK'  // Custom action when notification is clicked
            },
            to: fcmToken,
          };
  
          // Send the notification via your server API
          return this.http.post<void>(
            'https://oauth-nine-lyart.vercel.app/api/auth/send-notification',
            payload
          );
        } else {
          console.warn('No FCM token available for the receiver');
          return from([]); // Return empty observable if no token found
        }
      })
    );
  }
  
  /**
   * Updates the read status of a message.
   *
   * @param messageId The ID of the message to update.
   * @param status The new status ('sent', 'delivered', 'read').
   * @returns An Observable indicating the completion of the update.
   */
  updateMessageStatus(message: Message): Observable<void> {
    const chatId = this.getChatId(message.senderId, message.receiverid);
    const updates: any = {};
    console.log(message);
    updates[`chats/${chatId}/messages/${message.id}/readStatus`] =
      message.readStatus;
    console.log(update);
    return from(update(ref(this.db), updates));
  }
}
