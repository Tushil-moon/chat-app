import { Injectable } from '@angular/core';
import * as AES from 'crypto-js/aes';
import * as Utf8 from 'crypto-js/enc-utf8';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  /**
   * handle encryption
   *
   * @param data data to be encrypt
   * @returns ciphertext
   */
  encrypt(data: string): string {
    const secretKey = this.generateRandomString();
    const ciphertext = AES.encrypt(data, secretKey).toString();
    return `${ciphertext}${secretKey}`;
  }

  /**
   * Handle Decryption
   *
   * @param ciphertext text to be decrypt
   * @returns original data
   */
  decrypt(ciphertext: string): string {
    // console.log(ciphertext)
    const secretKey = ciphertext.slice(-8);
    // console.log("secret key ",secretKey)
    const bytes = AES.decrypt(ciphertext, secretKey);
    const originalText = bytes.toString(Utf8);
    return originalText;
  }

  /**
   * Generate secretKey
   */
  generateRandomString(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    return result;
  }
}
