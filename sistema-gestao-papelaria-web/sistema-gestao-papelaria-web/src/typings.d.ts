declare namespace google.maps.visualization {
  export interface WeightedLocation {
    location: google.maps.LatLng;
    weight: number;
  }
  export interface HeatmapLayerOptions {
    data: any;
    map?: google.maps.Map;
    maxOpacity?: number;
    radius?: number;
    dissipating?: boolean;
    opacity?: number;
  }
}
