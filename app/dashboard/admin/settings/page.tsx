"use client";

import { useState, useEffect } from "react";
import Card, { CardHeader } from "@/components/ui/card";
import Button from "@/components/ui/button";
import { useSystemSettings } from "@/lib/hooks";
import { Save, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useGlobalSettings } from "@/components/providers/SettingsProvider";

export default function GlobalSettingsPage() {
  const { settings, isLoading, mutate } = useSystemSettings();
  const [formData, setFormData] = useState<any>({
    company_name: "",
    logo_url: "",
    primary_color: "",
    secondary_color: "",
    currency_symbol: "₹",
    timezone: "Asia/Kolkata"
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Failed to save settings");
      await mutate();
      toast.success("Global configuration updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: settings?.primary_color || "#1A3C5E" }}>System Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">Manage global branding, currency, and localization settings for the entire tenant.</p>
      </div>

      <Card>
        <CardHeader title="Branding & Aesthetics" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Logo URL</label>
              <input
                type="text"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="text-xs text-gray-400 mt-1">Provide a relative path (e.g., /eHMS_logo.png) or full URL.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primary_color || "#1A3C5E"}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-10 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Secondary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.secondary_color || "#2BAE8E"}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-10 h-10 border rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Localization & Currency" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <div>
            <label className="block text-sm font-medium mb-1">Currency Symbol</label>
            <select
              value={formData.currency_symbol}
              onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY/CNY)</option>
              <option value="A$">A$ (AUD)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <select
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => setFormData(settings)}>
          <RefreshCw className="w-4 h-4 mr-2" /> Reset
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          style={{ backgroundColor: formData.primary_color }}
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Configuration
        </Button>
      </div>

    </div>
  );
}
