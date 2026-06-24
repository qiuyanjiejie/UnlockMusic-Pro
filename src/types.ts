export interface DecryptedFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  blob?: Blob;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    picture?: string;
  };
}

export type DecryptionResult = {
  blob: Blob;
  metadata: {
    title?: string;
    artist?: string;
    album?: string;
    picture?: string;
  };
  ext: string;
};
