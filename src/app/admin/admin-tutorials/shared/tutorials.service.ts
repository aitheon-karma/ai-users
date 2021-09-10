import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { MediaFile } from './media';
import { TutorialSettings } from './tutorial-settings';

@Injectable({
  providedIn: 'root'
})
export class TutorialsService {

  constructor(private restService: RestService) { }

  listSettings(): Observable<TutorialSettings> {
    return this.restService.fetch(`/api/admin/tutorials/settigs`);
  }

  createVideo(video: MediaFile): Observable<any> {
    return this.restService.post(`/api/admin/tutorials/media`, video);
  }

  update(any: any): Observable<any> {
   return this.restService.put(`/api/admin/user/types/${ any._id }`, any);
  }

  getById(anyId: string): Observable<any> {
    return this.restService.fetch(`/api/admin/user/types/${ anyId }`);
  }

  remove(anyId: string): Observable<any> {
    return this.restService.delete(`/api/admin/user/types/${ anyId }`);
  }

}
