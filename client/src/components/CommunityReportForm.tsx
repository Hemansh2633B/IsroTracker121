import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast"; // Assuming a toast hook exists for notifications
import { InsertCommunityReport } from '@/lib/smartAlertTypes'; // Reusing this as it has the types, or create specific one

const CommunityReportForm: React.FC = () => {
  const [satelliteName, setSatelliteName] = useState('');
  const [sightingTime, setSightingTime] = useState(''); // Store as ISO string or YYYY-MM-DDTHH:mm
  const [latitude, setLatitude] = useState<number | string>('');
  const [longitude, setLongitude] = useState<number | string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast(); // From Shadcn UI template

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!sightingTime || !latitude || !longitude || !satelliteName) {
        toast({ title: "Error", description: "Please fill in all required fields (Satellite Name, Sighting Time, Latitude, Longitude).", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const reportData: Omit<InsertCommunityReport, 'id' | 'submittedAt'> = { // Make sure this matches InsertCommunityReport structure
      satelliteName,
      sightingTime: new Date(sightingTime).toISOString(), // Ensure it's ISO format for backend
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
      notes: notes || undefined,
    };

    try {
      const response = await fetch('/api/community-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }

      toast({ title: "Success!", description: "Your sighting report has been submitted.", variant: "default" });
      // Clear form
      setSatelliteName('');
      setSightingTime('');
      setLatitude('');
      setLongitude('');
      setNotes('');
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(5));
          setLongitude(position.coords.longitude.toFixed(5));
          toast({ title: "Location Updated", description: "Current location fetched." });
        },
        (error) => {
          toast({ title: "Geolocation Error", description: `Could not get location: ${error.message}`, variant: "destructive" });
        }
      );
    } else {
      toast({ title: "Geolocation Not Supported", description: "Your browser doesn't support geolocation.", variant: "warning" });
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold">Report a Satellite Sighting</h3>
      <div>
        <Label htmlFor="satelliteName">Satellite Name*</Label>
        <Input id="satelliteName" value={satelliteName} onChange={(e) => setSatelliteName(e.target.value)} placeholder="e.g., ISS, Starlink-1234" required />
      </div>
      <div>
        <Label htmlFor="sightingTime">Sighting Date and Time*</Label>
        <Input id="sightingTime" type="datetime-local" value={sightingTime} onChange={(e) => setSightingTime(e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitude*</Label>
          <Input id="latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g., 28.5619" required/>
        </div>
        <div>
          <Label htmlFor="longitude">Longitude*</Label>
          <Input id="longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g., -80.5773" required/>
        </div>
      </div>
       <Button type="button" variant="outline" onClick={handleGeolocate} className="mr-2">Use My Current Location</Button>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., Brightness, direction of travel, weather conditions..." />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </Button>
    </form>
  );
};

export default CommunityReportForm;
