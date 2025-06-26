export interface LearningTopic {
  id: string;
  title: string;
  explanation: string; // Can be plain text, or simple HTML/Markdown if we add a renderer
}

export const learningTopics: Record<string, LearningTopic> = {
  "tle": {
    id: "tle",
    title: "Two-Line Element Sets (TLEs)",
    explanation: `
      <p>A <strong>Two-Line Element set (TLE)</strong> is a data format encoding a list of orbital elements of an Earth-orbiting object for a specific point in time, the <i>epoch</i>.</p>
      <p>It consists of two 69-character lines of data, plus a preceding title line. The TLE describes the orbit of a satellite using a mathematical model called SGP4 (Simplified General Perturbations model 4).</p>
      <p><strong>Line 1 contains:</strong> Satellite catalog number, classification, international designator, epoch year and day, ballistic coefficient, etc.</p>
      <p><strong>Line 2 contains:</strong> Inclination, right ascension of the ascending node (RAAN), eccentricity, argument of perigee, mean anomaly, mean motion, and revolution number at epoch.</p>
      <p>TLEs are widely used by astronomers, satellite trackers, and space agencies to predict the future positions of satellites.</p>
    `,
  },
  "sgp4": {
    id: "sgp4",
    title: "SGP4 Orbit Propagator",
    explanation: `
      <p><strong>SGP4 (Simplified General Perturbations model 4)</strong> is an analytical theory for predicting the orbital trajectory of near-Earth satellites.</p>
      <p>It takes a Two-Line Element set (TLE) as input, which describes the satellite's state at a particular epoch (time).</p>
      <p>SGP4 then calculates the satellite's position (e.g., latitude, longitude, altitude) and velocity at different points in time, accounting for Earth's oblateness, atmospheric drag, and solar/lunar gravitational perturbations in a simplified manner.</p>
      <p>It's widely used due to its computational efficiency and reasonable accuracy for many near-Earth objects.</p>
    `,
  },
  "orbital_inclination": {
    id: "orbital_inclination",
    title: "Orbital Inclination",
    explanation: `
      <p><strong>Orbital inclination</strong> measures the tilt of an object's orbit around a celestial body. It is expressed as the angle between a reference plane and the orbital plane or axis of direction of the orbiting object.</p>
      <p>For a satellite orbiting Earth, the reference plane is usually Earth's equatorial plane.</p>
      <ul>
        <li>An inclination of 0 degrees means the satellite orbits directly above the equator in the same direction as Earth's rotation (prograde).</li>
        <li>An inclination of 90 degrees indicates a polar orbit.</li>
        <li>An inclination of 180 degrees indicates a retrograde equatorial orbit.</li>
      </ul>
      <p>Inclination is a key element determining the ground track of a satellite and what parts of the Earth it will pass over.</p>
    `,
  },
  "czml": {
    id: "czml",
    title: "CZML (Cesium Markup Language)",
    explanation: `
        <p><strong>CZML</strong> is a JSON-based data format for describing time-dynamic graphical scenes, primarily for display in Cesium virtual globes and maps.</p>
        <p>It can define properties of objects like satellites, ground stations, aircraft, etc., and how these properties change over time. This includes position, orientation, appearance (color, size, model), path, and associated sensor volumes.</p>
        <p>CZML is structured as a list of JSON objects, called "packets". The first packet is usually a "document" packet defining the overall scene properties, like the clock settings. Subsequent packets define individual objects and their characteristics.</p>
        <p>For satellites, CZML can directly embed TLE data, and Cesium's engine will use it to propagate and display the orbit.</p>
    `
  }
  // Add more topics as needed
};

export const getLearningTopic = (id: string): LearningTopic | undefined => {
  return learningTopics[id];
};
