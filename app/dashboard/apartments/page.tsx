"use client";

import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";

const properties = [
  { name: "Cityscape Serviced Apartments", location: "Downtown", units: 60, occ: "79%", adr: "₹5,400", mgr: "Sneha Kapoor" },
  { name: "Harbour View Residences", location: "Waterfront", units: 35, occ: "82%", adr: "₹6,200", mgr: "Arun Nair" },
];

export default function ApartmentsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Service Apartments</h1><p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Extended-stay furnished units</p></div>
      <div className="grid gap-4">
        {properties.map((p) => (
          <Card key={p.name}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold" style={{ color: "#1A3C5E" }}>{p.name}</h3>
                  <Badge variant="amber">{p.location}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: "#64748B" }}>
                  <span>{p.units} units</span><span>Manager: {p.mgr}</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right"><div className="text-sm font-semibold" style={{ color: "#2BAE8E" }}>{p.occ}</div><div className="text-xs" style={{ color: "#64748B" }}>Occ.</div></div>
                <div className="text-right"><div className="text-sm font-semibold" style={{ color: "#1A3C5E" }}>{p.adr}</div><div className="text-xs" style={{ color: "#64748B" }}>ADR</div></div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
