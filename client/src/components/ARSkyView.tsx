import 'aframe'; // Import A-Frame. This will register all core components.
import React, { useEffect, useRef, useState } from 'react';
import * as satellite from 'satellite.js'; // satellite.js for TLE propagation
import { LL2Launch, LL2UpcomingLaunchesResponse } from '@/lib/smartAlertTypes'; // For fetching satellite TLEs (example)

// Helper: Convert degrees to radians
const degToRad = (degrees: number) => degrees * (Math.PI / 180);

// Helper: Geodetic (LLA) to ECEF (Earth-Centered, Earth-Fixed)
// Simplified: Assumes spherical Earth for now for basic ECEF conversion.
// For higher accuracy, WGS84 ellipsoid model should be used.
const llaToEcef = (lat: number, lon: number, alt: number) => {
  const R = 6371 + alt / 1000; // Radius of Earth + altitude in km
  const latRad = degToRad(lat);
  const lonRad = degToRad(lon);
  const x = R * Math.cos(latRad) * Math.cos(lonRad);
  const y = R * Math.cos(latRad) * Math.sin(lonRad);
  const z = R * Math.sin(latRad);
  return { x, y, z }; // In km
};


const ARSkyView: React.FC = () => {
  const sceneRef = useRef<any>(null); // For A-Frame scene specific interactions if needed
  const [satData, setSatData] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<{ alpha: number | null; beta: number | null; gamma: number | null }>({ alpha: null, beta: null, gamma: null });
  const [error, setError] = useState<string>('');
  const [isARSupported, setIsARSupported] = useState(true); // Assume supported initially

  // 1. Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          setError(`Error getting location: ${err.message}. Defaulting to a sample location.`);
          // Default location if user denies or error (e.g., Bangalore)
          setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
        }
      );
    } else {
      setError("Geolocation is not supported by this browser. Defaulting to a sample location.");
      setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
    }
  }, []);

  // 2. Get device orientation
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setDeviceOrientation({
        alpha: event.alpha, // Z-axis rotation (compass heading)
        beta: event.beta,   // X-axis rotation (front-back tilt)
        gamma: event.gamma, // Y-axis rotation (side-to-side tilt)
      });
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      setError(prev => prev + "\nDevice orientation not supported.");
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);


  // 3. Fetch TLE data for some satellites
  useEffect(() => {
    fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json") // Space Stations
      .then(res => res.json())
      .then((data: any[]) => { // Using any[] for Celestrak's direct JSON TLE format
        const processedSats = data.map(tleData => {
          const satrec = satellite.twoline2satrec(tleData.TLE_LINE1, tleData.TLE_LINE2);
          return { name: tleData.OBJECT_NAME, satrec };
        }).slice(0, 5); // Take first 5 for simplicity
        setSatData(processedSats);
      })
      .catch(err => {
        console.error("Error fetching TLEs:", err)
        setError(prev => prev + `\nError fetching TLEs: ${err.message}`);
      });
  }, []);

  // 4. Calculate satellite positions and update A-Frame entities
  // This would typically run in an A-Frame component's tick handler or a React useEffect with a timer
  // For this example, we'll just log positions. Rendering them accurately in AR is the complex part.

  useEffect(() => {
    if (!userLocation || satData.length === 0) return;

    const now = new Date();
    console.log(`User Location: Lat ${userLocation.latitude.toFixed(2)}, Lon ${userLocation.longitude.toFixed(2)}`);
    console.log(`Device Orientation: Alpha ${deviceOrientation.alpha?.toFixed(0)}, Beta ${deviceOrientation.beta?.toFixed(0)}, Gamma ${deviceOrientation.gamma?.toFixed(0)}`);

    satData.forEach(sat => {
      if (sat.satrec) {
        const positionAndVelocity = satellite.propagate(sat.satrec, now);
        if (positionAndVelocity && typeof positionAndVelocity.position !== 'boolean') {
          const gmst = satellite.gstime(now);
          const positionGd = satellite.eciToGeodetic(positionAndVelocity.position as satellite.EciVec3<number>, gmst);

          const latitude = satellite.degreesLat(positionGd.latitude);
          const longitude = satellite.degreesLong(positionGd.longitude);
          const altitudeKm = positionGd.height; // in km

          // TODO: Convert LLA to local ENU frame relative to user
          // TODO: Project ENU to camera view based on device orientation
          // This is where the core AR math happens.

          console.log(`${sat.name}: Lat ${latitude.toFixed(2)}, Lon ${longitude.toFixed(2)}, Alt ${altitudeKm.toFixed(0)}km`);
        }
      }
    });
  }, [satData, userLocation, deviceOrientation, /* add a timer dependency if making this 'live' */]);

  // A-Frame scene setup
  // For true AR, you'd use specific A-Frame components for WebXR or AR.js.
  // e.g., <a-scene webxr="optionalFeatures: dom-overlay, hit-test;" arjs='sourceType: webcam; trackingMethod: best; debugUIEnabled: false;'>
  // This example focuses on getting sensor data and displaying a basic scene.
  // The actual overlaying of satellites onto the camera requires more setup.

  if (error.includes("AR not supported") || error.includes("WebXR not available")) {
      return <div className="p-4 text-red-500">Error: {error}. Your browser/device may not support WebXR/AR.</div>;
  }

  // Basic A-Frame scene structure. This does not yet overlay on camera or use device orientation for camera.
  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {error && <pre style={{position: 'absolute', top: 0, left: 0, color: 'red', backgroundColor: 'white', zIndex: 100, padding: '10px'}}>{error}</pre>}
      <a-scene
        ref={sceneRef}
        embedded // Important for embedding in a div
        renderer="antialias: true; physicallyCorrectLights: true;"
        // To enable WebXR AR mode, something like this would be needed:
        // webxr="optionalFeatures: dom-overlay, hit-test; overlayElement: #overlay;"
        // arjs='sourceType: webcam; displayPlanes: true' // Example for AR.js
        // For now, a simple scene. Device orientation would control the <a-camera>.
      >
        <a-assets>
          {/* Define any assets like 3D models for satellites here */}
        </a-assets>

        {/* Camera - its rotation should ideally be driven by deviceOrientation */}
        {/* For a simple "sky map" effect, you might set rotation directly based on deviceOrientation.alpha/beta/gamma */}
        <a-camera
          look-controls-enabled="false"
          wasd-controls-enabled="false"
          rotation={`${deviceOrientation.beta || 0} ${deviceOrientation.alpha ? -deviceOrientation.alpha : 0} ${deviceOrientation.gamma || 0}`}
        >
        </a-camera>

        <a-sky color="#222"></a-sky>

        {/* Placeholder for satellites - actual positioning is complex */}
        {/* This is just a conceptual rendering. Real positions need ENU conversion & projection */}
        {satData.map((sat, index) => (
           <a-sphere
             key={sat.name}
             position={`${index * 2 - satData.length / 2} 1.5 -5`} // Placeholder positions
             radius="0.2"
             color="yellow"
           >
            <a-text value={sat.name} align="center" position="0 -0.5 0" color="white" width="2"></a-text>
           </a-sphere>
        ))}

      </a-scene>
      <div id="ar-status" style={{position: 'absolute', bottom: '10px', left: '10px', color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px'}}>
        Location: {userLocation ? `${userLocation.latitude.toFixed(2)}, ${userLocation.longitude.toFixed(2)}` : "Getting..."} <br/>
        Orientation: Alpha: {deviceOrientation.alpha?.toFixed(1)}, Beta: {deviceOrientation.beta?.toFixed(1)}, Gamma: {deviceOrientation.gamma?.toFixed(1)}
      </div>
    </div>
  );
};

export default ARSkyView;
