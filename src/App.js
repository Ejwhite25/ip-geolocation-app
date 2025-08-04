import React, { useState } from 'react';
import axios from 'axios';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBGwriOW66NZg0QlMfLIEY8GAs9mb-p1RU'; // Replace with real key

// UI Styles
const cardStyle = {
  backgroundColor: '#fff',
  maxWidth: '700px',
  margin: '40px auto',
  padding: '30px 40px',
  borderRadius: '10px',
  boxShadow: '0 6px 18px rgba(0,0,0,0.1)',
  fontFamily: 'Segoe UI, sans-serif',
  color: '#333',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '1rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
  marginBottom: '16px',
  minHeight: '80px',
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '1rem',
  backgroundColor: '#1976d2',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  marginBottom: '20px',
};

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

export default function App() {
  const [ipList, setIpList] = useState('');
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const fetchGeoData = async (ip) => {
    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      console.log(`Fetched for ${ip}:`, response.data);
      if (!response.data || response.data.error) {
        throw new Error(`Could not fetch ${ip}`);
      }
      return {
        ip,
        lat: response.data.latitude,
        lng: response.data.longitude,
        city: response.data.city,
        country: response.data.country_name,
      };
    } catch (err) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLocations([]);

    const rawIPs = ipList.split(/[\s,]+/).filter(Boolean); // supports commas, newlines, spaces
    const results = await Promise.all(rawIPs.map(ip => fetchGeoData(ip)));

    const validLocations = results.filter(Boolean);
    if (validLocations.length === 0) {
      setError('No valid IPs found.');
    } else {
      setLocations(validLocations);
    }

    setLoading(false);
  };

  const routePath = locations.map(loc => ({ lat: loc.lat, lng: loc.lng }));

  return (
    <div style={cardStyle}>
      <h2>🧭 Multi-IP Geolocation Mapper</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={ipList}
          onChange={(e) => setIpList(e.target.value)}
          placeholder="Enter multiple IP addresses, separated by comma, space, or new lines"
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? 'Locating...' : 'Map IPs'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isLoaded && locations.length > 0 && (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={routePath[0]}
          zoom={3}
        >
          {locations.map((loc, idx) => (
            <Marker
              key={idx}
              position={{ lat: loc.lat, lng: loc.lng }}
              label={`${idx + 1}`}
              title={`${loc.ip} — ${loc.city}, ${loc.country}`}
            />
          ))}

          <Polyline
            path={routePath}
            options={{
              strokeColor: '#1976d2',
              strokeOpacity: 0.8,
              strokeWeight: 3,
            }}
          />
        </GoogleMap>
      )}
    </div>
  );
}