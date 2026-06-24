import { DecryptionResult } from '../types';
import { decryptNcm } from './ncm';

export async function decryptFile(file: File): Promise<DecryptionResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'ncm':
      return await decryptNcm(file);
    case 'qmc0':
    case 'qmc3':
    case 'qmcflac':
    case 'qmcogg':
    case 'tkm':
    case 'mgg':
    case 'mflac':
      return await decryptQmc(file);
    case 'kgm':
    case 'kgma':
    case 'vpr':
      throw new Error('Kugou (.kgm) format is currently under development');
    default:
      throw new Error(`Unsupported format: .${ext}`);
  }
}

// Simple Static XOR for older QMC files
async function decryptQmc(file: File): Promise<DecryptionResult> {
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Basic static key for legacy QMC
  const key = [
    0x77, 0x48, 0x32, 0x73, 0x4B, 0x69, 0x6E, 0x62, 0x61, 0x78, 0x57, 0x48, 0x32, 0x73, 0x4B, 0x69,
    0x6E, 0x62, 0x61, 0x78, 0x57, 0x48, 0x32, 0x73, 0x4B, 0x69, 0x6E, 0x62, 0x61, 0x78, 0x57, 0x48
  ];

  const decrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    decrypted[i] = data[i] ^ key[i % key.length];
  }

  const outputExt = ext.includes('flac') ? 'flac' : (ext.includes('ogg') ? 'ogg' : 'mp3');
  const type = outputExt === 'flac' ? 'audio/flac' : (outputExt === 'ogg' ? 'audio/ogg' : 'audio/mpeg');

  return {
    blob: new Blob([decrypted], { type }),
    ext: outputExt,
    metadata: {
      title: file.name.replace(`.${ext}`, ''),
      artist: 'Unknown Artist'
    }
  };
}
