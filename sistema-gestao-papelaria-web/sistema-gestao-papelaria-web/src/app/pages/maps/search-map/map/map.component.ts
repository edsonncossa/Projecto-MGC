import { Component, Input, OnInit } from '@angular/core';
import { PositionModel } from '../entity/position.model';

@Component({
  selector: 'ngx-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit {
  // Inicializado com uma coordenada padrão estável para evitar o erro de 'null'
  position: google.maps.LatLngLiteral = { lat: -25.9653, lng: 32.5892 };
  zoom: number = 12;

  @Input()
  public set searchedPosition(position: PositionModel) {
    if (position) {
      // Converte o modelo customizado para o formato literal exigido pelo Google Maps
      this.position = {
        lat: position.lat,
        lng: position.lng
      };
      this.zoom = 15;
    }
  }

  ngOnInit() {
    // Configura a localização atual via API do navegador
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.position = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.zoom = 15;
      }, (error) => {
        console.warn('Geolocalização rejeitada ou indisponível, usando coordenada padrão.', error);
      });
    }
  }
}
