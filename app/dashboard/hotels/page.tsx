"use client";

import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

const properties = [
  { name: "Oceanview Grand Hotel", type: "5-Star Resort", units: 120, occ: "84%", revpar: "₹8,200", mgr: "Rajesh Mehta" },
  { name: "Seaside Boutique Hotel", type: "3-Star", units: 45, occ: "78%", revpar: "₹4,500", mgr: "Anita Desai" },
  { name: "Mountain View Resort", type: "Luxury Resort", units: 80, occ: "72%", revpar: "₹12,000", mgr: "Vikram Thapa" },
];

export default function HotelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Hotels & Resorts</h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Star-rated property operations</p>
      </div>
      <div className="grid gap-4">
        {properties.map((p) => (
          <Card key={p.name}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold" style={{ color: "#1A3C5E" }}>{p.name}</h3>
                  <Badge variant="teal">{p.type}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: "#64748B" }}>
                  <span>{p.units} rooms</span><span>Manager: {p.mgr}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right"><div className="text-sm font-semibold" style={{ color: "#2BAE8E" }}>{p.occ}</div><div className="text-xs" style={{ color: "#64748B" }}>Occ.</div></div>
                <div className="text-right"><div className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>{p.revpar}</div><div className="text-xs" style={{ color: "#64748B" }}>RevPAR</div></div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
