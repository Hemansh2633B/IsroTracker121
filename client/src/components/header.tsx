import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Download, Satellite, PersonStanding, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

export function Header() {
  const [istTime, setIstTime] = useState(new Date());

  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system-status"],
    refetchInterval: 3000, // Fast auto-refresh every 3 seconds
  });

  // Update IST time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setIstTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format time to IST
  const formatISTTime = (date: Date) => {
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const mosdacStatus = systemStatus?.find((s: any) => s.component === "MOSDAC_API");
  const isOnline = mosdacStatus?.status === "Online";

  const handleExportData = async () => {
    try {
      const response = await apiRequest("GET", "/api/export-data?format=csv");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'mipid-export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <svg width="40" height="40" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
                <defs>
                  <linearGradient id="isroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#0D21A1", stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#1E40AF", stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <circle cx="24" cy="24" r="22" fill="url(#isroGradient)" stroke="#ffffff" strokeWidth="2"/>
                <rect x="20" y="18" width="8" height="12" fill="#ffffff" rx="1"/>
                <rect x="12" y="20" width="6" height="8" fill="#FFD700" rx="0.5"/>
                <rect x="30" y="20" width="6" height="8" fill="#FFD700" rx="0.5"/>
                <circle cx="24" cy="15" r="1.5" fill="#ffffff"/>
                <line x1="24" y1="13" x2="24" y2="8" stroke="#ffffff" strokeWidth="1"/>
                <path d="M 19 10 Q 24 6 29 10" stroke="#ffffff" strokeWidth="1" fill="none"/>
                <path d="M 17 12 Q 24 4 31 12" stroke="#ffffff" strokeWidth="1" fill="none"/>
                <circle cx="24" cy="24" r="18" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="2,2" opacity="0.5"/>
                <text x="24" y="40" textAnchor="middle" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="6" fontWeight="bold">ISRO</text>
              </svg>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MIPID</h1>
                <p className="text-xs text-gray-500">ISRO Machine Intelligence for Precipitation ID</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 status-pulse' : 'bg-red-500'}`}></span>
              <span className="text-gray-600">
                {isOnline ? 'MOSDAC Connected' : 'MOSDAC Offline'}
              </span>
            </div>
            
            <Button 
              onClick={handleExportData}
              className="flex items-center space-x-2 bg-primary hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Export Data</span>
            </Button>
            
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <PersonStanding className="h-4 w-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
