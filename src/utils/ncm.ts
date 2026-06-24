import CryptoJS from 'crypto-js';
import * as musicMetadata from 'music-metadata-browser';
import { Buffer } from 'buffer';
import { DecryptionResult } from '../types';

const CORE_KEY = CryptoJS.enc.Hex.parse('687a4852416d736f356b496e62617857');
const META_KEY = CryptoJS.enc.Hex.parse('2331346C6A6B5F215C5D2630553C2728');

export async function decryptNcm(file: File): Promise<DecryptionResult> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  let offset = 0;

  // 1. Magic Header
  const header = String.fromCharCode(...data.slice(0, 10));
  if (header !== 'CTENFDAMAM') {
    throw new Error('Not a valid NCM file');
  }
  offset += 10;
  offset += 2; // Gap

  // 2. Key Data
  const keyLen = new DataView(buffer).getUint32(offset, true);
  offset += 4;
  const keyData = data.slice(offset, offset + keyLen).map(b => b ^ 0x64);
  offset += keyLen;

  const keyHex = Buffer.from(keyData).toString('hex');
  const decryptedKey = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Hex.parse(keyHex) } as any,
    CORE_KEY,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  
  const finalKey = decryptedKey.toString(CryptoJS.enc.Utf8).slice(17); // Remove 'neteasecloudmusic'
  const finalKeyBytes = Buffer.from(finalKey, 'utf8');

  // 3. Meta Data
  const metaLen = new DataView(buffer).getUint32(offset, true);
  offset += 4;
  const metaData = data.slice(offset, offset + metaLen).map(b => b ^ 0x63);
  offset += metaLen;

  const metaHex = Buffer.from(metaData).toString('hex');
  const decryptedMeta = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Hex.parse(metaHex.slice(22)) } as any, // Remove '163 key(Don't modify):'
    META_KEY,
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
  );
  
  const metadata = JSON.parse(decryptedMeta.toString(CryptoJS.enc.Utf8));

  // 4. CRC & Gap
  offset += 4; // CRC
  offset += 5; // Gap
  const imgLen = new DataView(buffer).getUint32(offset, true);
  offset += 4;
  const imgData = data.slice(offset, offset + imgLen);
  offset += imgLen;

  // 5. Audio Data XOR
  const audioData = data.slice(offset);
  const box = new Uint8Array(256);
  for (let i = 0; i < 256; i++) box[i] = i;
  
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + box[i] + finalKeyBytes[i % finalKeyBytes.length]) & 0xff;
    [box[i], box[j]] = [box[j], box[i]];
  }

  const keystream = new Uint8Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    const i8 = (i + 1) & 0xff;
    const si = box[i8];
    const sj = box[(i8 + si) & 0xff];
    keystream[i] = box[(si + sj) & 0xff];
  }

  const decryptedAudio = new Uint8Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    decryptedAudio[i] = audioData[i] ^ keystream[i];
  }

  const blob = new Blob([decryptedAudio], { type: metadata.format === 'flac' ? 'audio/flac' : 'audio/mpeg' });
  
  // Extract real metadata if possible
  let coverUrl = '';
  if (imgData.length > 0) {
    coverUrl = URL.createObjectURL(new Blob([imgData]));
  }

  return {
    blob,
    ext: metadata.format || 'mp3',
    metadata: {
      title: metadata.musicName,
      artist: metadata.artist?.[0]?.[0] || 'Unknown Artist',
      album: metadata.album,
      picture: coverUrl
    }
  };
}
