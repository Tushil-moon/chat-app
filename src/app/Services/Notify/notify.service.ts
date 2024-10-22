import { inject, Injectable } from '@angular/core';
import { NgToastService } from 'ng-angular-popup';

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
    private toast = inject(NgToastService);
  
    /**
     * use for toast error message
     *
     * @param message message to be show
     */
    error(message: string): void {
      this.toast.danger(message, '', 2000);
    }
  
    /**
     * use for toast success message
     *
     * @param message message to be show
     */
    success(message: string): void {
      this.toast.success(message, '', 2000);
    }
  
    /**
     * use for toast info message
     *
     * @param message message to be show
     */
    info(message: string): void {
      this.toast.info(message, '', 2000);
    }
  
    /**
     * use for toast warning message
     *
     * @param message message to be show
     */
    warning(message: string): void {
      this.toast.warning(message, '', 2000);
    }
  
}
