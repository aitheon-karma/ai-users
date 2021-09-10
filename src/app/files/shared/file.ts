export class File {
  _id: string;
  name: string;
  fileStoreKey: string;
  contentType: string;
  uploading: boolean;
  uploadingFinished: boolean;
  fileBlob: any;
  fileItem: any;
  size: number;
  uploadingProgress: number;
}
