"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Settings, Sliders, Bell, Database, RefreshCw, CheckCircle2,
  ShieldCheck, AlertTriangle, Hospital, UserCheck, Volume2
} from "lucide-react";

export default function SettingsPage() {
  const [criticalThreshold, setCriticalThreshold] = useState("80");
  const [highThreshold, setHighThreshold] = useState("60");
  const [mediumThreshold, setMediumThreshold] = useState("40");
  const [pollingInterval, setPollingInterval] = useState("3");
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);
  const [facilityName, setFacilityName] = useState("MediSync Clinical Triage Center");
  const [leadPhysician, setLeadPhysician] = useState("Dr. Narayan Murthy");
  const [stationName, setStationName] = useState("Acute Trauma Unit — Station A");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [reseedMessage, setReseedMessage] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReseed = async () => {
    setIsReseeding(true);
    setReseedMessage(null);
    try {
      const res = await fetch("/api/settings/reseed", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setReseedMessage("Database successfully reset and reseeded with 5 baseline cases!");
      } else {
        setReseedMessage("Failed to reset database: " + json.error);
      }
    } catch (err: any) {
      setReseedMessage("Error resetting database: " + err.message);
    } finally {
      setIsReseeding(false);
      setTimeout(() => setReseedMessage(null), 5000);
    }
  };

  const handleEnableDesktopNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setDesktopNotifications(true);
        new Notification("MediSync Alerts Active", {
          body: "Desktop alerts will now notify you when a CRITICAL case enters the queue.",
        });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-500">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Clinical Settings</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure triage scoring thresholds, real-time sync intervals, and local database management.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 rounded-xl">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          Settings saved successfully to active session.
        </div>
      )}

      {reseedMessage && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-xl">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
          {reseedMessage}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Triage Scoring Engine */}
        <Card className="border shadow-xs bg-white">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Triage Rule Thresholds</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">Rule Config v1.2</Badge>
            </div>
            <CardDescription>
              Adjust clinical score cut-offs (0–100) determining the patient priority bracket.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="critical" className="text-sm font-semibold text-slate-800">Critical Priority</Label>
                  <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">&ge; {criticalThreshold}</span>
                </div>
                <Input
                  id="critical"
                  type="number"
                  min="0"
                  max="100"
                  value={criticalThreshold}
                  onChange={(e) => setCriticalThreshold(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">Immediate trauma, chest pain, or respiratory failure.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="high" className="text-sm font-semibold text-slate-800">High Priority</Label>
                  <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">&ge; {highThreshold}</span>
                </div>
                <Input
                  id="high"
                  type="number"
                  min="0"
                  max="100"
                  value={highThreshold}
                  onChange={(e) => setHighThreshold(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">Severe pain, high fever, or acute onset within hours.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="medium" className="text-sm font-semibold text-slate-800">Medium Priority</Label>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">&ge; {mediumThreshold}</span>
                </div>
                <Input
                  id="medium"
                  type="number"
                  min="0"
                  max="100"
                  value={mediumThreshold}
                  onChange={(e) => setMediumThreshold(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">Persistent moderate symptoms requiring evaluation.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Sync & Notifications */}
        <Card className="border shadow-xs bg-white">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Real-time Sync & Sound Alerts</CardTitle>
            </div>
            <CardDescription>
              Configure auto-polling frequencies and alert mechanisms for clinicians on duty.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="polling" className="text-sm font-semibold text-slate-800">
                  SQLite Queue Polling Interval
                </Label>
                <select
                  id="polling"
                  value={pollingInterval}
                  onChange={(e) => setPollingInterval(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="2">2 seconds (High Responsiveness)</option>
                  <option value="3">3 seconds (Recommended)</option>
                  <option value="5">5 seconds (Standard)</option>
                  <option value="10">10 seconds (Low Bandwidth)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  The Doctor Dashboard automatically checks SQLite for new incoming patients.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-slate-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-800">Audible Critical Alert Chime</div>
                      <div className="text-xs text-muted-foreground">Plays chime when a CRITICAL case enters queue</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-slate-600" />
                    <div>
                      <div className="text-sm font-medium text-slate-800">Desktop Push Notifications</div>
                      <div className="text-xs text-muted-foreground">Pop up browser alerts for emergency cases</div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleEnableDesktopNotifications}
                  >
                    {desktopNotifications ? "Enabled ✓" : "Enable"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Facility & Clinician Profile */}
        <Card className="border shadow-xs bg-white">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Hospital className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Facility & Station Profile</CardTitle>
            </div>
            <CardDescription>
              Operational identity displayed on generated triage reports and notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="facility" className="text-sm font-semibold text-slate-800">Department / Facility</Label>
                <Input
                  id="facility"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="physician" className="text-sm font-semibold text-slate-800">Attending Lead</Label>
                <Input
                  id="physician"
                  value={leadPhysician}
                  onChange={(e) => setLeadPhysician(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="station" className="text-sm font-semibold text-slate-800">Operational Bay</Label>
                <Input
                  id="station"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50/50 border-t flex justify-end p-4">
            <Button type="submit" className="gap-2">
              Save Clinical Settings
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Database Maintenance */}
      <Card className="border shadow-xs border-amber-200 bg-amber-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <Database className="h-4 w-4 text-amber-600" />
              <span>Database Maintenance</span>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded font-mono font-medium">data/medisync.db</span>
          </div>
          <CardDescription className="text-amber-800/80">
            Reset or restore sample clinical records for demonstration and testing purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-slate-600">
            Resets the SQLite database tables and repopulates the 5 original clinical triage cases (Robert T., Emma W., David K., James L., Sarah M.).
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0 gap-2"
            onClick={handleReseed}
            disabled={isReseeding}
          >
            <RefreshCw className={`h-4 w-4 ${isReseeding ? "animate-spin" : ""}`} />
            {isReseeding ? "Resetting…" : "Reset & Reseed Demo Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
