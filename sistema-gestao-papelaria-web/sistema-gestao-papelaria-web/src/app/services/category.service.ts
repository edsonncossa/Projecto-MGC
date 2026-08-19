import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Category } from "@app/shared/models/product";
import { map, Observable } from "rxjs";
import { environment } from "src/environments/environment";


interface HateoasResponse {
  _embedded: {
    categorys?: Category[];
    [key: string]: Category[] | undefined;
  };
  page: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}


@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  baseURL = `${environment.apiURL}api/category/v1`;
  constructor(private http: HttpClient) {}

  findAll(
    page: number,
    size: number,
    sortField: string,
    direction: 'asc' | 'desc',
    filter: string = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortField', sortField)
      .set('direction', direction);

    if (filter) {
      params = params.set('search', filter);
    }
    return this.http.get<any>(this.baseURL, { params });
  }

  create(category: Category): Observable<Category> {
    return this.http.post<Category>(this.baseURL, category);
  }

  update(category: Category): Observable<Category> {
    return this.http.put<Category>(this.baseURL, category);
  }

  findById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.baseURL}/${id}`);
  }

  disableCategory(id: number): Observable<Category> {
    return this.http.patch<Category>(`${this.baseURL}/disableCategory/${id}`, {});
  }

}




