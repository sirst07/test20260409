# test20260409

A simple React front end that loads an online OpenStreetMap background map with common map tools.

## Included features

- OpenStreetMap tile background
- Zoom control
- Scale bar
- Polygon drawing
- Polyline drawing
- Rectangle drawing
- Edit / drag / remove / cut tools
- Live GeoJSON export panel

## Tech stack

- React
- Vite
- Leaflet
- React Leaflet
- Leaflet-Geoman Free

## Getting started

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

```bash
http://localhost:5173
```

## Build for production

```bash
npm run build
npm run preview
```

## Notes

- This project reads OpenStreetMap tiles online, so internet access is required.
- The initial map center is Tokyo Station.
- The map toolbar is shown on the top-left of the map.
