
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'kycDocumentStatus'})
export class KYCDocumentStatusPipe implements PipeTransform {
  transform(value: string): string {
      switch (value) {
        case 'UPLOADED':
            return 'Uploaded';
        case 'PROCESSING':
            return 'Processing';
        case 'VERIFIED':
            return 'Verified';
        case 'REJECTED':
            return 'Rejected';
        default:
            return 'Waiting for upload';
      }
  }
}
