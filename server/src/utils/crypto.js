import CryptoJS from 'crypto-js';
import env from '../config/env.js';

const key = env.ENCRYPTION_KEY || 'default-dev-key-change-in-production';

export const encrypt = (text) => {
    if (!text) return '';
    return CryptoJS.AES.encrypt(text, key).toString();
};

export const decrypt = (ciphertext) => {
    if (!ciphertext) return '';
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
};
