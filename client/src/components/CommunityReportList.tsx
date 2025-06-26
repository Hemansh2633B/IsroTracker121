import React, { useEffect, useState } from 'react';
import { CommunityReport } from '@/lib/smartAlertTypes'; // Reusing, or create specific type

const CommunityReportList: React.FC = () => {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/community-reports');
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data: CommunityReport[] = await response.json();
        setReports(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();

    // Optional: Poll for new reports periodically or implement real-time updates if needed
    // const intervalId = setInterval(fetchReports, 30000); // Fetch every 30 seconds
    // return () => clearInterval(intervalId);
  }, []);

  if (isLoading) return <p className="p-4">Loading sighting reports...</p>;
  if (error) return <p className="p-4 text-red-500">Error loading reports: {error}</p>;
  if (reports.length === 0) return <p className="p-4">No sighting reports submitted yet.</p>;

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold">Community Satellite Sightings</h3>
      <div className="max-h-96 overflow-y-auto space-y-3 pr-2"> {/* Scrollable list */}
        {reports.map((report) => (
          <div key={report.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
            <p className="font-semibold text-primary">{report.satelliteName}</p>
            <p className="text-sm">
              Sighted: {new Date(report.sightingTime).toLocaleString()}
            </p>
            <p className="text-sm">
              Location: Lat: {report.latitude.toFixed(4)}, Lon: {report.longitude.toFixed(4)}
            </p>
            {report.notes && <p className="text-sm mt-1 italic">Notes: "{report.notes}"</p>}
            <p className="text-xs text-gray-500 mt-1">
              Reported: {new Date(report.submittedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityReportList;
