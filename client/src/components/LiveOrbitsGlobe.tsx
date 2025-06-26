import React, { useEffect, useState } from "react";
import { Viewer, CzmlDataSource } from "resium";
import { Ion, JulianDate, CzmlPacket } from "cesium";
import { DialogTrigger } from "@/components/ui/dialog"; // Shadcn UI DialogTrigger
import LearningModeModal from "./LearningModeModal"; // The modal we just created
import { InfoIcon } from "lucide-react"; // For a trigger icon
import { Button } from "@/components/ui/button";


// Optional: Set your Cesium Ion access token if you want to use Ion assets (e.g., high-res terrain/imagery)
// Ion.defaultAccessToken = "YOUR_CESIUM_ION_ACCESS_TOKEN";

interface CelestrakSatellite {
  OBJECT_NAME: string;
  TLE_LINE1: string;
  TLE_LINE2: string;
  EPOCH: string; // Celestrak JSON TLEs include EPOCH
}

const LiveOrbitsGlobe: React.FC = () => {
  const [czmlData, setCzmlData] = useState<CzmlPacket[]>([]);
  const [learningModalOpen, setLearningModalOpen] = useState(false);
  const [currentLearningTopic, setCurrentLearningTopic] = useState<string | null>(null);

  const openLearningModal = (topicId: string) => {
    setCurrentLearningTopic(topicId);
    setLearningModalOpen(true);
  };

  useEffect(() => {
    fetch("https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json")
      .then((res) => res.json())
      .then((satellites: CelestrakSatellite[]) => {
        const now = JulianDate.now();
        const end = JulianDate.addDays(now, 2, new JulianDate()); // Show orbit for next 2 days

        const czmlDocument: CzmlPacket = {
          id: "document",
          name: "CelestrakSpaceStations",
          version: "1.0",
          clock: {
            interval: `${JulianDate.toIso8601(now)}/${JulianDate.toIso8601(end)}`,
            currentTime: JulianDate.toIso8601(now),
            multiplier: 60, // Time multiplier for animation speed
            range: "LOOP_STOP",
            step: "SYSTEM_CLOCK_MULTIPLIER",
          },
        };

        const satelliteCzmlPackets: CzmlPacket[] = satellites.map((sat) => {
          // Ensure TLE lines are correctly formatted without extra newlines if any
          const tle_line1 = sat.TLE_LINE1.trim();
          const tle_line2 = sat.TLE_LINE2.trim();

          return {
            id: sat.OBJECT_NAME,
            name: sat.OBJECT_NAME,
            availability: `${JulianDate.toIso8601(now)}/${JulianDate.toIso8601(end)}`,
            position: {
              epoch: sat.EPOCH, // Use the epoch from the TLE data
              orbitalReferenceFrame: "INERTIAL", // Or TEME if propagator expects it
              tle: [tle_line1, tle_line2],
            },
            point: {
              pixelSize: 8,
              color: { rgba: [255, 255, 0, 255] }, // Yellow point
            },
            path: {
              material: {
                polylineOutline: {
                  color: { rgba: [255, 255, 255, 100] }, // White path with some transparency
                  outlineColor: { rgba: [255, 0, 0, 100] },
                  outlineWidth: 1,
                },
              },
              width: 2,
              leadTime: 0, // Show path ahead of current time
              trailTime: JulianDate.secondsDifference(end, now) / 2, // Show half of the orbit trail
              resolution: 600, // Resolution in seconds
            },
            label: {
              text: sat.OBJECT_NAME,
              fillColor: { rgba: [255, 255, 255, 200] },
              font: "12pt sans-serif",
              horizontalOrigin: "LEFT",
              pixelOffset: { cartesian2: [12, 0] },
              showBackground: true,
              backgroundColor: {rgba: [0,0,0,100]}
            }
          };
        });

        setCzmlData([czmlDocument, ...satelliteCzmlPackets]);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <div style={{ height: "100%", width: "100%" }}> {/* Changed height to 100% to fit parent */}
        <div className="absolute top-2 right-2 z-10"> {/* Info button position */}
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => openLearningModal('czml')}>
              <InfoIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </div>
        <Viewer full timeline terainProviderViewModels={[]} imageryProviderViewModels={[]}>
          {czmlData.length > 0 && <CzmlDataSource data={czmlData} name="satellites" />}
        </Viewer>
      </div>
      <LearningModeModal
        topicId={currentLearningTopic}
        isOpen={learningModalOpen}
        onClose={() => setLearningModalOpen(false)}
      />
    </>
  );
};

export default LiveOrbitsGlobe;
