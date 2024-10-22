import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './Services/Chat/notification.service';
import { NgToastModule } from 'ng-angular-popup';
import { ToasterPosition } from 'ng-toasty'; 


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,NgToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Chat-App';
  ToasterPosition = ToasterPosition;
  private messaging = inject(NotificationService);

  ngOnInit(){
    this.messaging.requestPermission()
  }
}
