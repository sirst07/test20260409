import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';

const INITIAL_CENTER = [35.681236, 139.767125];
const INITIAL_ZOOM = 12;

function ScaleControl() {
  const map = useMap();

  useEffect(() => {
    const control = L.control.scale({
      position: 'bottomleft',
      metric: true,
      imperial: false,
    });

    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}

function MapBridge({ onMapReady }) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
}

function DrawingControls({ onGeoJsonChange }) {
  const map = useMap();

  useEffect(() => {
    if (!map.pm) {
      return undefined;
    }

    const syncGeoJson = () => {
      const features = [];

      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          return;
        }

        if (layer._pmTempLayer) {
          return;
        }

        if (!(layer.pm && typeof layer.toGeoJSON === 'function')) {
          return;
        }

        const geoJson = layer.toGeoJSON();

        if (!geoJson) {
          return;
        }

        if (geoJson.type === 'FeatureCollection') {
          geoJson.features.forEach((feature) => features.push(feature));
          return;
        }

        if (geoJson.type === 'Feature') {
          features.push(geoJson);
          return;
        }

        features.push({
          type: 'Feature',
          properties: {},
          geometry: geoJson,
        });
      });

      onGeoJsonChange({
        type: 'FeatureCollection',
        features,
      });
    };

    map.pm.addControls({
      position: 'topleft',
      drawCircle: false,
      drawCircleMarker: false,
      drawMarker: false,
      drawPolyline: true,
      drawRectangle: true,
      drawPolygon: true,
      drawText: false,
      cutPolygon: true,
      dragMode: true,
      editMode: true,
      removalMode: true,
      rotateMode: true,
    });

    const events = [
      'pm:create',
      'pm:edit',
      'pm:remove',
      'pm:cut',
      'pm:dragend',
      'pm:rotateend',
    ];

    events.forEach((eventName) => {
      map.on(eventName, syncGeoJson);
    });

    syncGeoJson();

    return () => {
      events.forEach((eventName) => {
        map.off(eventName, syncGeoJson);
      });

      map.pm.removeControls();
    };
  }, [map, onGeoJsonChange]);

  return null;
}

export default function App() {
  const [map, setMap] = useState(null);
  const [geoJson, setGeoJson] = useState({
    type: 'FeatureCollection',
    features: [],
  });
  const [copyMessage, setCopyMessage] = useState('');

  const geoJsonText = useMemo(() => JSON.stringify(geoJson, null, 2), [geoJson]);

  const resetView = () => {
    if (!map) {
      return;
    }

    map.setView(INITIAL_CENTER, INITIAL_ZOOM);
  };

  const clearDrawings = () => {
    if (!map) {
      return;
    }

    const removableLayers = [];

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer || layer._pmTempLayer) {
        return;
      }

      if (layer.pm && typeof layer.toGeoJSON === 'function') {
        removableLayers.push(layer);
      }
    });

    removableLayers.forEach((layer) => {
      map.removeLayer(layer);
    });

    setGeoJson({
      type: 'FeatureCollection',
      features: [],
    });
  };

  const copyGeoJson = async () => {
    try {
      await navigator.clipboard.writeText(geoJsonText);
      setCopyMessage('GeoJSON copied to clipboard.');
    } catch (error) {
      console.error(error);
      setCopyMessage('Copy failed. Please copy from the text box manually.');
    }
  };

  useEffect(() => {
    if (!copyMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCopyMessage('');
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copyMessage]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">React + Leaflet + OSM</p>
          <h1>OSM online background map demo</h1>
          <p className="subtext">
            Includes zoom control, scale bar, and drawing/editing tools for polygons,
            polylines, and rectangles.
          </p>
        </div>
      </header>

      <main className="app-main">
        <section className="map-panel">
          <MapContainer
            center={INITIAL_CENTER}
            zoom={INITIAL_ZOOM}
            zoomControl={false}
            className="map-container"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ZoomControl position="topright" />
            <ScaleControl />
            <MapBridge onMapReady={setMap} />
            <DrawingControls onGeoJsonChange={setGeoJson} />
          </MapContainer>
        </section>

        <aside className="sidebar">
          <div className="card">
            <h2>Tools</h2>
            <p>
              Use the toolbar on the map to draw and edit features. The current drawing
              result is exported below as GeoJSON.
            </p>
            <div className="button-group">
              <button type="button" onClick={resetView}>
                Reset view
              </button>
              <button type="button" onClick={clearDrawings}>
                Clear drawings
              </button>
              <button type="button" onClick={copyGeoJson}>
                Copy GeoJSON
              </button>
            </div>
            {copyMessage ? <p className="message">{copyMessage}</p> : null}
          </div>

          <div className="card">
            <h2>Current status</h2>
            <ul className="status-list">
              <li>
                <span>Base map</span>
                <strong>OpenStreetMap</strong>
              </li>
              <li>
                <span>Drawn features</span>
                <strong>{geoJson.features.length}</strong>
              </li>
              <li>
                <span>Initial view</span>
                <strong>Tokyo Station</strong>
              </li>
            </ul>
          </div>

          <div className="card geojson-card">
            <h2>GeoJSON output</h2>
            <textarea readOnly value={geoJsonText} />
          </div>
        </aside>
      </main>
    </div>
  );
}
