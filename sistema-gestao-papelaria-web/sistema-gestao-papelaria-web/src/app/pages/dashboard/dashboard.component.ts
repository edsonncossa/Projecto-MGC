import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  emitirCertificado(): void {
    // Lógica para acionar a emissão (ex: abrir modal ou gerar PDF)
    console.log('A emitir certificado...');
  }

  partilhar(): void {
    console.log('A partilhar...');
  }

}
