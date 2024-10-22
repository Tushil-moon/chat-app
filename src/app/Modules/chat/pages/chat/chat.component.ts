import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { IEmoji } from '../../model/emoji';
import { ChatService } from '../../../../Services/Chat/chat.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, filter, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../../Services/Auth/auth.service';
import { User } from 'firebase/auth';
import { Chatdetail, Message } from '../../model/chatDetail';
import { Receiver } from '../../model/receiver';
import { Router, RouterLink } from '@angular/router';
import { PresenseService } from '../../../../Services/Firebase/Presense/presense.service';
import { Status } from '../../model/status';
import { CryptoService } from '../../../../Services/Crypto/crypto.service';
import { object } from '@angular/fire/database';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [PickerModule, CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent {
  private chatservice = inject(ChatService);
  private authService = inject(AuthService);
  private router = inject(Router);
  presenseService = inject(PresenseService);
  crypto = inject(CryptoService);

  /**
   * Take refrense of child element from html
   */
  @ViewChild('chatMessages') chatMessages!: ElementRef;

  /**
   * hold today date
   */
  todayDate = signal<Date>(new Date());

  /**
   * Hold Login user data
   */
  user = signal<User | null>(null);

  /**
   * Hold dark mode state
   */
  isDark = signal<boolean>(false);

  /**
   * Hold receiver data
   */
  receiver = signal<Receiver | null>(null);

  /**
   * hold all users data
   */
  allusers = signal<Receiver[]>([]);

  /**
   * holds conversations
   */
  chatHistory = signal<Receiver[]>([]);

  /**
   * Hold activated chat messages
   */
  allChatmessages = signal<Chatdetail[]>([]);

  /**
   * hold perticuler chat massges
   */
  messages = signal<Message[]>([]);

  /**
   * Hold the status of emojipicker
   */
  showEmojiPicker = signal<boolean>(false);

  /**
   * Hold active chat detail
   */
  activeChat = new BehaviorSubject<Receiver | null>(null);

  /**
   * Hold message
   */
  message = signal<string>('');

  /**
   * Hold search string
   */
  searchString = signal<string>('');

  /**
   * Hold filter user
   */
  filteredUsers = signal<Receiver[]>([]);

  /**
   * Hold hide state
   */
  hide = signal<boolean>(false);

  /**
   * hold user active status
   */
  status = signal<Status | null>(null);

  /**
   * Const for emojipicker settings
   */
  readonly emojiPickerProps = {
    set: 'google',
    sheetSize: 16,
    skin: 1,
    tooltip: true,
    isNative: false,
    preview: false,
  };

  /**
   * Get ALl users
   */
  getAllUsers = toSignal(
    this.authService.getAllUsers().pipe(
      tap((users) => {
        this.presenseService.trackUserPresence();
        this.allusers.set(users);
      })
    )
  );

  /**
   * Get login user data and then get messages
   */
  getUser = toSignal(
    this.authService.user$.pipe(
      tap((user) => {
        if (user) {
          this.user.set(user);
          console.log('User data:', this.user());
          const activeChat = localStorage.getItem('activeChat');
          if (activeChat) {
            this.activeChat.next(JSON.parse(activeChat));
            this.receiver.set(JSON.parse(activeChat));
          }
        } else {
          // console.warn('No user is logged in');
        }
      }),
      filter((user) => !!user),
      switchMap((user) => this.chatservice.getChats(user.uid)),
      tap((chats) => {
        // console.log(chats);
        this.allChatmessages.set(chats);
        setTimeout(() => {
          
          const oldChats = chats.map((chat: Chatdetail) => {
            const otherUserUid = Object.keys(chat.participants).find(
              (key) => key !== this.user()?.uid
            );
            // If there's an unmatched key, find the user associated with it
            if (otherUserUid) {
              const matchedUser = this.allusers().find(
                (user: Receiver) => user.uid === otherUserUid
              );
              return matchedUser
                ? matchedUser
                : { uid: '', username: '', photoUrl: '', email: '' };
            } else {
              // If no unmatched key exists, find the user associated with the matched key
              const matchedUser =
                chat.messages[0]?.senderId === this.user()?.uid
                  ? this.allusers().find(
                      (user: Receiver) =>
                        user.uid === chat.messages[0].receiverid
                    )
                  : this.allusers().find(
                      (user: Receiver) => user.uid === chat.messages[0].senderId
                    );
              return matchedUser
                ? matchedUser
                : { uid: '', username: '', photoUrl: '', email: '' };
            }
          });
          this.chatHistory.set(oldChats);
        },500);

        const receiverId = localStorage.getItem('activeChatId');
        const senderId = this.user()?.uid;
        if (receiverId && senderId) {
          const chats = this.allChatmessages().find(
            (user) =>
              user.id === this.chatservice.getChatId(senderId, receiverId) ||
              user.id === this.chatservice.getChatId(receiverId, senderId)
          );
          if (chats) {
            
            console.log(this.user()?.uid)
            
            this.messages.set(chats?.messages);
        }
        }
      })
    )
  );

  /**
   * Get user presence status
   */
  getStatus = toSignal(
    this.activeChat.pipe(
      filter((receiver) => receiver !== null),
      switchMap((receiver) => this.presenseService.getStatusByUserId(receiver)),
      tap((data) => {
        this.status.set(data);
      })
    )
  );

  /**
   * Handle the add emoji event
   *
   * @param event
   */
  addEmoji(event: { emoji: IEmoji }): void {
    this.message.update((value) => value + event.emoji.native);
  }

  /**
   * Handle of make chat active
   *
   * @param receiver receiver user details
   */
  activateChat(receiver: Receiver): void {
    this.searchString.set('');
    this.status.set(null);
    this.presenseService.getStatusByUserId(receiver).subscribe((res) => {
      this.status.set(res);
    });
    this.back();
    this.receiver.set(receiver);
    this.activeChat.next(receiver);
    localStorage.setItem('activeChat', JSON.stringify(receiver));
    localStorage.setItem('activeChatId', receiver.uid);
    const senderId = this.user()?.uid;
    const receiverId = receiver.uid;
    if (senderId && receiverId) {
      if (receiverId) {
        const chats = this.allChatmessages().find(
          (user) =>
            user.id === this.chatservice.getChatId(senderId, receiverId) ||
            user.id === this.chatservice.getChatId(receiverId, senderId)
        );
        if (chats) {
          chats.messages.forEach((message) => {
              if (message.readStatus === 'delivered') {
                  message.readStatus = 'read';
                  this.chatservice.updateMessageStatus(message);
              }
          });
          this.messages.set(chats?.messages);
        } else {
          this.messages.set([]);
        }
      }
      this.scrollToBottom();
    }
  }

  /**
   * Handle the send messages
   */
  sendMessage(): void {
    this.showEmojiPicker.set(false);
    const senderId = this.user()?.uid;
    const receiverId = this.receiver()?.uid;
    if (this.message().trim() && senderId && receiverId) {
      const message = this.crypto.encrypt(this.message());
      const newMessage: Message = {
        text: message,
        senderId: senderId,
        receiverid: receiverId,
        timestamp: Date.now(),
        readStatus: 'sent',
      };
      this.chatservice
        .sendMessage(senderId, receiverId, newMessage)
        .subscribe(() => {
        });
      this.message.set('');
    }
  }

  /**
   * Handle user Search
   */
  onSearch(): void {
    const searchTerm = this.searchString();
    const allUsers = this.allusers();
    console.log(allUsers)
    this.filteredUsers.set(
      searchTerm
        ? allUsers.filter((user) =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : []
    );
  }

  /**
   * Handle user logout
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Logout failed', err),
    });
  }

  /**
   * Handle chat back
   */
  back(): void {
    this.hide.set(!this.hide());
  }

  /**
   * Toggler for emoji picker
   */
  toggleEmojiPicker(): void {
    this.showEmojiPicker.set(!this.showEmojiPicker());
  }

  /**
   * Handle darkmode
   */
  toggleDarkMode(): void {
    // console.log('darkmode');
    this.isDark.set(!this.isDark());
  }

  /**
   * Handle the chat scroll to bottom
   */
  private scrollToBottom(): void {
    if (this.chatMessages) {
      this.chatMessages.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }

  /**
   * handle date formation
   *
   * @returns formated date
   */
  formateDate(): string {
    const date = new Date();
    const yesterdayDate = date.getDate() - 1;
    return `${date.getMonth() + 1}/${yesterdayDate}/${date.getFullYear()}`;
  }

  /**
   * handle to get latest message of chat
   *
   * @param receiver perticular chat details
   * @returns last message and time
   */
  getLastMessage(receiver: Receiver): { message: string; timestamp: number } {
    // console.log(receiver);
    const senderId = this.user()?.uid;
    if (receiver && senderId) {
      const chats = this.allChatmessages().find(
        (user) =>
          user.id === this.chatservice.getChatId(senderId, receiver.uid) ||
          user.id === this.chatservice.getChatId(receiver.uid, senderId)
      );

      if (chats) {
        const userMessages = chats.messages.filter(
          (message) =>
            message.receiverid === senderId || message.senderId === senderId
        );

        if (userMessages.length > 0) {
          const lastMessage = userMessages[userMessages.length - 1];
          const decryptedMessage = this.crypto.decrypt(lastMessage.text);
          const timestamp = lastMessage.timestamp;

          // console.log({ message: decryptedMessage, timestamp });
          return { message: decryptedMessage, timestamp };
        }
      }
    }
    return { message: '', timestamp: 0 };
  }

  /**
   * handle to get unseen messages
   *
   * @param userId sender's id
   * @returns count of unseen massges
   */
  getUnseenMessageCount(userId: string): number {
    let count = 0;

    this.allChatmessages().forEach((chat) => {
      chat.messages.forEach((message) => {
        if (
          message.senderId === userId &&
          message.senderId !== this.user()?.uid &&
          message.readStatus === 'delivered'
        ) {
          count++;
        }
      });
    });
    return count;
  }
}
