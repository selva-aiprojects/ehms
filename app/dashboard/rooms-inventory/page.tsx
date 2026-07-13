"use client";

import { useState, useEffect } from "react";
import { DoorOpen, Building2, AlertCircle } from "lucide-react";
import { useProperties } from "@/lib/hooks";
import { useJourney } from "@/components/providers/JourneyProvider";
import PropertyRoomsInventory from "@/app/dashboard/admin/properties/[id]/components/PropertyRoomsInventory";

export default function RoomsInventoryPage() {
  const { properties = [], isLoading: propsLoading } = useProperties();
  const { activeJourney, selectedPropertyId: journeyPropertyId, setSelectedPropertyId: setJourneyPropertyId } = useJourney();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const filteredProperties = properties.filter((p: any) => {
    if (activeJourney === "all") return true;
    if (activeJourney === "hotels") return p.vertical_type === "hotel";
    if (activeJourney === "apartments") return p.vertical_type === "service_apartment";
    if (activeJourney === "rental") return p.vertical_type === "rental_apartment";
    if (activeJourney === "workplace") return p.vertical_type === "workplace";
    return true;
  });

  useEffect(() => {
    if (journeyPropertyId && journeyPropertyId !== "all") {
      setSelectedPropertyId(journeyPropertyId);
    } else if (filteredProperties.length > 0 && (!selectedPropertyId || !filteredProperties.some((p: any) => p.id === selectedPropertyId))) {
      setSelectedPropertyId(filteredProperties[0].id);
    }
  }, [journeyPropertyId, filteredProperties, selectedPropertyId]);

  const currentProperty = filteredProperties.find((p: any) => p.id === selectedPropertyId) || filteredProperties[0] || properties[0];

  if (propsLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Loading rooms inventory...
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <Building2 className="w-10 h-10 mx-auto text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-700">No Properties Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Please create a property or workspace first before managing rooms and units.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4" style={{ borderColor: "#E2E8F0" }}>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
            <DoorOpen className="w-6 h-6 text-[#2BAE8E]" />
            Property Rooms & Units Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            Manage buildings, floors, room matrix, AC/Non-AC status, and unit attributes across your properties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Property:</label>
          <select
            value={selectedPropertyId || currentProperty?.id || ""}
            onChange={(e) => {
              setSelectedPropertyId(e.target.value);
              setJourneyPropertyId(e.target.value);
            }}
            className="px-3 py-1.5 rounded-lg border text-sm font-medium outline-none bg-white shadow-sm"
            style={{ borderColor: "#CBD5E1", color: "#1E293B" }}
          >
            {filteredProperties.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.vertical_type || "Property"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentProperty ? (
        <PropertyRoomsInventory propertyId={currentProperty.id} property={currentProperty} />
      ) : (
        <div className="p-8 text-center text-slate-400 border rounded-xl">
          Select a property above to view inventory.
        </div>
      )}
    </div>
  );
}
