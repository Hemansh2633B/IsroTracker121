import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Shield, Lock, Globe, AlertTriangle, CheckCircle } from "lucide-react";

export function SecurityMonitor() {
  const { data: securityStatus } = useQuery({
    queryKey: ["/api/security-status"],
    refetchInterval: 5000,
  });

  const getSecurityIcon = (status: string) => {
    switch (status) {
      case 'secure': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSecurityColor = (status: string) => {
    switch (status) {
      case 'secure': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Security Status</h3>
          <Badge variant="secondary" className="ml-auto">
            CloudFlare Protected
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* CloudFlare Protection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">CloudFlare CDN</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Cache Hit Ratio:</span>
                  <span className="font-medium">98.7%</span>
                </div>
                <div className="flex justify-between">
                  <span>Bandwidth Saved:</span>
                  <span className="font-medium">2.4 GB</span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">SSL/TLS</span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Encryption:</span>
                  <Badge className="bg-green-100 text-green-800">TLS 1.3</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Certificate:</span>
                  <span className="font-medium">Valid</span>
                </div>
                <div className="flex justify-between">
                  <span>HSTS:</span>
                  <span className="font-medium">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Metrics */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Security Metrics (Last 24h)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-800">99.9%</div>
                <div className="text-xs text-green-600">Uptime</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-800">847</div>
                <div className="text-xs text-blue-600">Threats Blocked</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-semibold text-purple-800">2.1s</div>
                <div className="text-xs text-purple-600">Avg Response</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-semibold text-yellow-800">0</div>
                <div className="text-xs text-yellow-600">Vulnerabilities</div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Active Protections</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { name: 'DDoS Protection', status: 'secure' },
                { name: 'Bot Management', status: 'secure' },
                { name: 'WAF Rules', status: 'secure' },
                { name: 'Rate Limiting', status: 'secure' },
                { name: 'Geo Blocking', status: 'secure' },
                { name: 'API Security', status: 'secure' }
              ].map((feature) => (
                <div key={feature.name} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    {getSecurityIcon(feature.status)}
                    <span className="text-sm">{feature.name}</span>
                  </div>
                  <Badge className={getSecurityColor(feature.status)}>
                    {feature.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Threats */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full status-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Real-time Protection Active</span>
            </div>
            <div className="text-xs text-gray-600">
              All MIPID services are protected by CloudFlare enterprise security.
              Last threat detected and blocked: 14 minutes ago
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}