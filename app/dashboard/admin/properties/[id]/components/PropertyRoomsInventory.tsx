"use client";

import { useState } from "react";
import {
  DoorOpen, Building2, Layers, Plus, Edit2, Trash2, Check, X,
  AlertCircle, CheckCircle, Loader2, RefreshCw, Sparkles, Filter,
  DollarSign, Users, Maximize2, Wind, Wifi, Tv, Coffee, Search, Tag, Eye
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { usePropertyInventory } from "@/lib/hooks";

interface PropertyRoomsInventoryProps {
  propertyId: string;
  property: any;
}

export default function PropertyRoomsInventory({ propertyId, property }: PropertyRoomsInventoryProps) {
  const {
    buildings,
    floors,
    units,
    roomCategories,
    facilities,
    isLoading,
    mutate
  } = usePropertyInventory(propertyId);

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("all");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpec, setFilterSpec] = useState<"all" | "ac" | "non-ac">("all");

  // Modal states
  const [modalType, setModalType] = useState<"building" | "unit" | "bulk_units" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form Data
  const [buildingForm, setBuildingForm] = useState({ name: "", code: "", floors: 3, year_built: new Date().getFullYear() });
  const [unitForm, setUnitForm] = useState<any>({
    id: null,
    building_id: "",
    floor_id: "",
    unit_label: "",
    unit_type: "room",
    layout_type: "",
    sq_ft: 350,
    max_occupancy: 2,
    base_rate: 4500,
    status: "vacant",
    attributes: {
      ac: true,
      category_name: "",
      bed_type: "King",
      features: ["WiFi", "TV", "Air Conditioning"],
      smoking: false
    }
  });

  const [bulkForm, setBulkForm] = useState({
    building_id: "",
    floor_id: "",
    prefix: "1",
    start_num: 1,
    end_num: 10,
    unit_type: "room",
    layout_type: "",
    sq_ft: 350,
    max_occupancy: 2,
    base_rate: 4500,
    attributes: {
      ac: true,
      category_name: "",
      bed_type: "King",
      features: ["WiFi", "TV", "Air Conditioning"],
      smoking: false
    }
  });

  // Filtered Floors & Units
  const displayedFloors = floors.filter(f =>
    selectedBuildingId === "all" || f.building_id === selectedBuildingId
  );

  const displayedUnits = units.filter(u => {
    if (selectedFloorId !== "all" && u.floor_id !== selectedFloorId) return false;
    if (selectedBuildingId !== "all") {
      const flr = floors.find(f => f.id === u.floor_id);
      if (!flr || flr.building_id !== selectedBuildingId) return false;
    }
    if (filterSpec === "ac" && !u.attributes?.ac && !u.layout_type?.toLowerCase().includes("ac")) {
      // Check if specifically non-ac
      if (u.attributes?.ac === false || u.layout_type?.toLowerCase().includes("non-ac")) return false;
    }
    if (filterSpec === "ac" && u.attributes?.ac === false) return false;
    if (filterSpec === "non-ac" && u.attributes?.ac !== false && !u.layout_type?.toLowerCase().includes("non-ac")) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchLabel = u.unit_label?.toLowerCase().includes(q);
      const matchType = u.layout_type?.toLowerCase().includes(q) || u.unit_type?.toLowerCase().includes(q);
      const matchCat = u.attributes?.category_name?.toLowerCase().includes(q);
      return matchLabel || matchType || matchCat;
    }
    return true;
  });

  // Quick stats
  const totalUnits = units.length;
  const acUnitsCount = units.filter(u => u.attributes?.ac || u.layout_type?.toLowerCase().includes("ac") && !u.layout_type?.toLowerCase().includes("non")).length;
  const nonAcUnitsCount = totalUnits - acUnitsCount;
  const totalBuildings = buildings.length;

  function showMessage(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleAddBuilding(e: React.FormEvent) {
    e.preventDefault();
    if (!buildingForm.name || !buildingForm.code) {
      showMessage("error", "Please provide building name and code");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_building",
          ...buildingForm
        })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", data.message || "Building added successfully");
        setModalType(null);
        mutate();
      } else {
        showMessage("error", data.error || "Failed to create building");
      }
    } catch {
      showMessage("error", "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitForm.floor_id || !unitForm.unit_label) {
      showMessage("error", "Please select floor and enter room number/label");
      return;
    }
    setIsSubmitting(true);
    try {
      const action = unitForm.id ? "update_unit" : "create_unit";
      const payload: any = {
        action,
        floor_id: unitForm.floor_id,
        unit_label: unitForm.unit_label,
        unit_type: unitForm.unit_type,
        layout_type: unitForm.layout_type,
        sq_ft: unitForm.sq_ft,
        max_occupancy: unitForm.max_occupancy,
        base_rate: unitForm.base_rate,
        status: unitForm.status,
        attributes: unitForm.attributes
      };
      if (unitForm.id) payload.unit_id = unitForm.id;

      const res = await fetch(`/api/properties/${propertyId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", data.message || "Room saved successfully");
        setModalType(null);
        mutate();
      } else {
        showMessage("error", data.error || "Failed to save room");
      }
    } catch {
      showMessage("error", "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!bulkForm.floor_id) {
      showMessage("error", "Please select a floor");
      return;
    }
    if (bulkForm.start_num > bulkForm.end_num || bulkForm.end_num - bulkForm.start_num > 100) {
      showMessage("error", "Range must be valid and max 100 rooms at once");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_bulk_units",
          floor_id: bulkForm.floor_id,
          prefix: bulkForm.prefix,
          start_num: bulkForm.start_num,
          end_num: bulkForm.end_num,
          unit_type: bulkForm.unit_type,
          layout_type: bulkForm.layout_type,
          sq_ft: bulkForm.sq_ft,
          max_occupancy: bulkForm.max_occupancy,
          base_rate: bulkForm.base_rate,
          attributes: bulkForm.attributes
        })
      });
      const data = await res.json();
      if (res.ok) {
        showMessage("success", data.message || `Successfully created ${data.count} rooms`);
        setModalType(null);
        mutate();
      } else {
        showMessage("error", data.error || "Failed to bulk create rooms");
      }
    } catch {
      showMessage("error", "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUnit(unitId: string, label: string) {
    if (!confirm(`Are you sure you want to delete Room ${label}?`)) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_unit", unit_id: unitId })
      });
      if (res.ok) {
        showMessage("success", `Room ${label} deleted`);
        mutate();
      } else {
        const d = await res.json();
        showMessage("error", d.error || "Failed to delete room");
      }
    } catch {
      showMessage("error", "Network error occurred");
    }
  }

  async function handleDeleteFloor(floorId: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}? All rooms on this floor will also be removed.`)) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_floor", floor_id: floorId })
      });
      if (res.ok) {
        showMessage("success", `${name} deleted`);
        mutate();
      } else {
        const d = await res.json();
        showMessage("error", d.error || "Failed to delete floor");
      }
    } catch {
      showMessage("error", "Network error occurred");
    }
  }

  async function handleDeleteBuilding(buildingId: string, name: string) {
    if (!confirm(`Are you sure you want to delete Building "${name}"? All floors and rooms inside will be permanently deleted.`)) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_building", building_id: buildingId })
      });
      if (res.ok) {
        showMessage("success", `Building "${name}" deleted`);
        mutate();
      } else {
        const d = await res.json();
        showMessage("error", d.error || "Failed to delete building");
      }
    } catch {
      showMessage("error", "Network error occurred");
    }
  }

  function openAddUnitModal(defaultFloorId?: string) {
    const firstBuilding = buildings.length > 0 ? buildings[0].id : "";
    const firstFloor = defaultFloorId || (floors.length > 0 ? floors[0].id : "");
    const firstCat = roomCategories.length > 0 ? roomCategories[0] : null;

    setUnitForm({
      id: null,
      building_id: firstBuilding,
      floor_id: firstFloor,
      unit_label: "",
      unit_type: "room",
      layout_type: firstCat ? firstCat.name : "Deluxe Room",
      sq_ft: 350,
      max_occupancy: 2,
      base_rate: firstCat ? firstCat.base_price || 4500 : 4500,
      status: "vacant",
      attributes: {
        ac: firstCat?.name?.toLowerCase().includes("non-ac") ? false : true,
        category_name: firstCat ? firstCat.name : "Deluxe Room",
        bed_type: "King",
        features: ["WiFi", "TV", "Air Conditioning", "Ensuite Bathroom"],
        smoking: false
      }
    });
    setModalType("unit");
  }

  function openEditUnitModal(unit: any) {
    const flr = floors.find(f => f.id === unit.floor_id);
    setUnitForm({
      id: unit.id,
      building_id: flr ? flr.building_id : "",
      floor_id: unit.floor_id,
      unit_label: unit.unit_label,
      unit_type: unit.unit_type || "room",
      layout_type: unit.layout_type || "",
      sq_ft: unit.sq_ft || 350,
      max_occupancy: unit.max_occupancy || 2,
      base_rate: unit.base_rate || 0,
      status: unit.status || "vacant",
      attributes: {
        ac: unit.attributes?.ac !== false,
        category_name: unit.attributes?.category_name || unit.layout_type || "",
        bed_type: unit.attributes?.bed_type || "King",
        features: unit.attributes?.features || ["WiFi", "TV"],
        smoking: !!unit.attributes?.smoking
      }
    });
    setModalType("unit");
  }

  function openBulkModal() {
    const firstBuilding = buildings.length > 0 ? buildings[0].id : "";
    const firstFloor = floors.length > 0 ? floors[0].id : "";
    const firstCat = roomCategories.length > 0 ? roomCategories[0] : null;

    setBulkForm({
      building_id: firstBuilding,
      floor_id: firstFloor,
      prefix: "1",
      start_num: 1,
      end_num: 10,
      unit_type: "room",
      layout_type: firstCat ? firstCat.name : "Deluxe Room",
      sq_ft: 350,
      max_occupancy: 2,
      base_rate: firstCat ? firstCat.base_price || 4500 : 4500,
      attributes: {
        ac: firstCat?.name?.toLowerCase().includes("non-ac") ? false : true,
        category_name: firstCat ? firstCat.name : "Deluxe Room",
        bed_type: "King",
        features: ["WiFi", "TV", "Air Conditioning", "Room Service"],
        smoking: false
      }
    });
    setModalType("bulk_units");
  }

  function toggleFeatureCheckbox(formState: any, setFormState: any, featureName: string) {
    const current = formState.attributes?.features || [];
    const exists = current.includes(featureName);
    const updated = exists ? current.filter((f: string) => f !== featureName) : [...current, featureName];
    setFormState({
      ...formState,
      attributes: { ...formState.attributes, features: updated }
    });
  }

  function handleCategoryChange(catName: string, isBulk: boolean) {
    const cat = roomCategories.find(c => c.name === catName);
    const isNonAc = catName.toLowerCase().includes("non-ac") || catName.toLowerCase().includes("non ac");
    const isAc = !isNonAc;
    const price = cat?.base_price || (isBulk ? bulkForm.base_rate : unitForm.base_rate);

    if (isBulk) {
      setBulkForm(prev => ({
        ...prev,
        layout_type: catName,
        base_rate: price,
        attributes: {
          ...prev.attributes,
          ac: isAc,
          category_name: catName,
          features: isAc 
            ? Array.from(new Set([...(prev.attributes.features || []), "Air Conditioning"]))
            : (prev.attributes.features || []).filter((f: string) => f !== "Air Conditioning")
        }
      }));
    } else {
      setUnitForm((prev: any) => ({
        ...prev,
        layout_type: catName,
        base_rate: price,
        attributes: {
          ...prev.attributes,
          ac: isAc,
          category_name: catName,
          features: isAc 
            ? Array.from(new Set([...(prev.attributes?.features || []), "Air Conditioning"]))
            : (prev.attributes?.features || []).filter((f: string) => f !== "Air Conditioning")
        }
      }));
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A3C5E]" />
        <p className="text-sm text-slate-500 font-medium">Loading property inventory & room specifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2.5 shadow-sm transition-all"
          style={{
            background: feedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
            color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E",
            border: `1px solid ${feedback.type === "success" ? "rgba(42,157,143,0.25)" : "rgba(229,62,62,0.25)"}`
          }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Quick Stats Header */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 text-white shadow-sm flex items-center justify-between" style={{ background: "#1A3C5E" }}>
          <div>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <div className="text-xs opacity-80 mt-0.5">Total Rooms / Units</div>
          </div>
          <DoorOpen className="w-8 h-8 opacity-30" />
        </div>
        <div className="rounded-xl p-4 text-white shadow-sm flex items-center justify-between" style={{ background: "#2BAE8E" }}>
          <div>
            <div className="text-2xl font-bold">{acUnitsCount}</div>
            <div className="text-xs opacity-80 mt-0.5 flex items-center gap-1"><Wind className="w-3 h-3" /> AC Rooms</div>
          </div>
          <Badge variant="teal" className="bg-white/20 text-white border-0">Air Conditioned</Badge>
        </div>
        <div className="rounded-xl p-4 shadow-sm flex items-center justify-between" style={{ background: "#F5A623", color: "#1A2E44" }}>
          <div>
            <div className="text-2xl font-bold">{nonAcUnitsCount}</div>
            <div className="text-xs opacity-80 mt-0.5 font-medium">Non-AC / Standard</div>
          </div>
          <Badge variant="amber" className="bg-white/40 text-slate-900 border-0">Non-AC</Badge>
        </div>
        <div className="rounded-xl p-4 shadow-sm border bg-white flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
          <div>
            <div className="text-2xl font-bold text-slate-800">{totalBuildings}</div>
            <div className="text-xs text-slate-500 mt-0.5">Buildings ({floors.length} Floors)</div>
          </div>
          <Building2 className="w-8 h-8 text-slate-300" />
        </div>
      </div>

      {/* Action Bar & Filter Controls */}
      <Card>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-1">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 text-xs font-medium">
              <button
                onClick={() => setSelectedBuildingId("all")}
                className={`px-3 py-1.5 rounded-md transition-all ${selectedBuildingId === "all" ? "bg-white text-[#1A3C5E] shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"}`}>
                All Buildings ({totalBuildings})
              </button>
              {buildings.map(b => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBuildingId(b.id); setSelectedFloorId("all"); }}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${selectedBuildingId === b.id ? "bg-white text-[#1A3C5E] shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"}`}>
                  <Building2 className="w-3 h-3" /> {b.name}
                </button>
              ))}
            </div>

            {/* Spec Filter (AC / Non-AC) */}
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 text-xs font-medium">
              <button
                onClick={() => setFilterSpec("all")}
                className={`px-2.5 py-1.5 rounded-md transition-all ${filterSpec === "all" ? "bg-white text-[#1A3C5E] shadow-sm" : "text-slate-600"}`}>
                All Specs
              </button>
              <button
                onClick={() => setFilterSpec("ac")}
                className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${filterSpec === "ac" ? "bg-white text-[#2BAE8E] shadow-sm font-semibold" : "text-slate-600"}`}>
                <Wind className="w-3 h-3 text-[#2BAE8E]" /> AC Only
              </button>
              <button
                onClick={() => setFilterSpec("non-ac")}
                className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${filterSpec === "non-ac" ? "bg-white text-[#F5A623] shadow-sm font-semibold" : "text-slate-600"}`}>
                Non-AC Only
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search room #, category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 outline-none focus:border-[#1A3C5E] bg-white w-48"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalType("building")}>
              <Building2 className="w-3.5 h-3.5 mr-1 text-slate-600" /> + Building
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openBulkModal()}>
              <Sparkles className="w-3.5 h-3.5 mr-1" /> + Bulk Add Rooms
            </Button>
            <Button variant="primary" size="sm" onClick={() => openAddUnitModal()}>
              <Plus className="w-3.5 h-3.5 mr-1" /> + Single Room
            </Button>
          </div>
        </div>
      </Card>

      {/* Buildings & Floors View */}
      {buildings.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Buildings or Rooms Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Start by creating a building (e.g. "Main Tower" or "Block A") with the required number of floors, then add rooms with specifications like AC / Non-AC.
          </p>
          <Button variant="primary" size="sm" onClick={() => setModalType("building")}>
            <Plus className="w-4 h-4 mr-1.5" /> Create First Building
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {buildings
            .filter(b => selectedBuildingId === "all" || b.id === selectedBuildingId)
            .map(b => {
              const bldFloors = floors.filter(f => f.building_id === b.id);
              const bldUnits = units.filter(u => bldFloors.some(f => f.id === u.floor_id));

              return (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Building Header */}
                  <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#1A3C5E]/10 flex items-center justify-center text-[#1A3C5E] font-bold text-sm">
                        {b.code}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#1A3C5E] flex items-center gap-2">
                          {b.name}
                          <Badge variant="gray">{b.floors} {b.floors === 1 ? "Floor" : "Floors"}</Badge>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {bldUnits.length} Total Rooms &middot; {bldUnits.filter(u => u.attributes?.ac !== false).length} AC / {bldUnits.filter(u => u.attributes?.ac === false).length} Non-AC
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openAddUnitModal(bldFloors[0]?.id)}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Room
                      </Button>
                      <button
                        onClick={() => handleDeleteBuilding(b.id, b.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Delete Building">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Floors inside Building */}
                  {bldFloors.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No floors defined for this building.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {bldFloors.map(flr => {
                        const flrUnits = displayedUnits.filter(u => u.floor_id === flr.id);

                        return (
                          <div key={flr.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-200/80 text-slate-700">
                                  {flr.name}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">({flrUnits.length} {flrUnits.length === 1 ? "room" : "rooms"})</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => openAddUnitModal(flr.id)}
                                  className="text-xs text-[#1A3C5E] font-medium hover:underline flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100">
                                  <Plus className="w-3 h-3" /> Add Room Here
                                </button>
                                {flrUnits.length === 0 && (
                                  <button
                                    onClick={() => handleDeleteFloor(flr.id, flr.name)}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                                    title="Delete empty floor">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Rooms Grid for this floor */}
                            {flrUnits.length === 0 ? (
                              <div className="py-4 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                                No rooms match current filters on this floor.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {flrUnits.map(unit => {
                                  const isAc = unit.attributes?.ac !== false;
                                  const catName = unit.attributes?.category_name || unit.layout_type || "Deluxe Room";
                                  const rate = unit.base_rate || 0;
                                  const maxPax = unit.max_occupancy || 2;
                                  const sqFt = unit.sq_ft || 350;
                                  const features = unit.attributes?.features || [];

                                  return (
                                    <div
                                      key={unit.id}
                                      className="border rounded-xl p-3.5 bg-white shadow-sm hover:shadow-md transition-all relative group flex flex-col justify-between"
                                      style={{ borderColor: isAc ? "rgba(43,174,142,0.3)" : "rgba(245,166,35,0.3)" }}>
                                      <div>
                                        {/* Top row: Number & AC badge */}
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-base font-extrabold text-[#1A3C5E] tracking-tight">
                                              Room {unit.unit_label}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Badge variant={isAc ? "teal" : "amber"}>
                                              {isAc ? (
                                                <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> AC</span>
                                              ) : (
                                                <span className="flex items-center gap-1">Non-AC</span>
                                              )}
                                            </Badge>
                                          </div>
                                        </div>

                                        {/* Category & Specs */}
                                        <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                                          <Tag className="w-3 h-3 text-slate-400" />
                                          {catName}
                                        </div>

                                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2.5">
                                          <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-400" /> {maxPax} Pax</span>
                                          <span>&middot;</span>
                                          <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3 text-slate-400" /> {sqFt} sq.ft</span>
                                        </div>

                                        {/* Amenities chips */}
                                        {features.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mb-3">
                                            {features.slice(0, 3).map((f: string, idx: number) => (
                                              <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                                {f}
                                              </span>
                                            ))}
                                            {features.length > 3 && (
                                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                +{features.length - 3}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Bottom row: Rate & Actions */}
                                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                        <div>
                                          <span className="text-xs font-bold text-[#1A3C5E]">₹{rate.toLocaleString()}</span>
                                          <span className="text-[10px] text-slate-400"> / night</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => openEditUnitModal(unit)}
                                            className="p-1.5 text-slate-500 hover:text-[#1A3C5E] hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Edit Specifications">
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteUnit(unit.id, unit.unit_label)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Delete Room">
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* ── MODAL 1: ADD BUILDING ── */}
      {modalType === "building" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-[#1A3C5E] text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Add New Building / Tower
              </h3>
              <button onClick={() => setModalType(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBuilding} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Building Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower A - Executive Wing"
                  value={buildingForm.name}
                  onChange={e => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A3C5E] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TWR-A"
                    value={buildingForm.code}
                    onChange={e => setBuildingForm({ ...buildingForm, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:ring-2 focus:ring-[#1A3C5E] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total Floors <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={buildingForm.floors}
                    onChange={e => setBuildingForm({ ...buildingForm, floors: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A3C5E] outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Auto-creates Floor 1 to {buildingForm.floors}</p>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />} Save Building
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD / EDIT SINGLE ROOM & SPECIFICATIONS ── */}
      {modalType === "unit" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-[#1A3C5E] text-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <DoorOpen className="w-5 h-5" /> {unitForm.id ? `Edit Room ${unitForm.unit_label} Specifications` : "Add Single Room / Unit"}
              </h3>
              <button onClick={() => setModalType(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Floor & Label Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Building <span className="text-red-500">*</span></label>
                  <select
                    value={unitForm.building_id}
                    onChange={e => {
                      const bId = e.target.value;
                      const bldFloors = floors.filter(f => f.building_id === bId);
                      setUnitForm({ ...unitForm, building_id: bId, floor_id: bldFloors[0]?.id || "" });
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A3C5E] outline-none bg-white">
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Floor <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={unitForm.floor_id}
                    onChange={e => setUnitForm({ ...unitForm, floor_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A3C5E] outline-none bg-white">
                    {floors
                      .filter(f => !unitForm.building_id || f.building_id === unitForm.building_id)
                      .map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Room Number <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101 or A-201"
                    value={unitForm.unit_label}
                    onChange={e => setUnitForm({ ...unitForm, unit_label: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-[#1A3C5E] outline-none"
                  />
                </div>
              </div>

              {/* Category & Air Conditioning Specification */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Room Category & AC Specification</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Select Room Category</label>
                    <select
                      value={unitForm.layout_type}
                      onChange={e => handleCategoryChange(e.target.value, false)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A3C5E] outline-none bg-white font-medium">
                      {roomCategories.length === 0 ? (
                        <option value="Deluxe Room">Deluxe Room</option>
                      ) : (
                        roomCategories.map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name} {cat.base_price ? `(₹${cat.base_price}/night)` : ""}
                          </option>
                        ))
                      )}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">Selecting a category auto-fills base price & AC specification</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Air Conditioning (AC) Status</label>
                    <div className="flex items-center gap-3 pt-1">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer font-semibold text-xs transition-all ${
                        unitForm.attributes?.ac ? "bg-[#2BAE8E]/15 border-[#2BAE8E] text-[#2BAE8E]" : "bg-white border-slate-200 text-slate-600"
                      }`}>
                        <input
                          type="radio"
                          name="ac_spec"
                          checked={unitForm.attributes?.ac === true}
                          onChange={() => setUnitForm({ ...unitForm, attributes: { ...unitForm.attributes, ac: true } })}
                          className="hidden"
                        />
                        <Wind className="w-4 h-4" /> Air Conditioned (AC)
                      </label>

                      <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer font-semibold text-xs transition-all ${
                        unitForm.attributes?.ac === false ? "bg-[#F5A623]/20 border-[#F5A623] text-slate-900" : "bg-white border-slate-200 text-slate-600"
                      }`}>
                        <input
                          type="radio"
                          name="ac_spec"
                          checked={unitForm.attributes?.ac === false}
                          onChange={() => setUnitForm({ ...unitForm, attributes: { ...unitForm.attributes, ac: false } })}
                          className="hidden"
                        />
                        Non-AC / Standard
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Base Rate (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={unitForm.base_rate}
                    onChange={e => setUnitForm({ ...unitForm, base_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-[#2BAE8E] focus:ring-2 focus:ring-[#1A3C5E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Max Occupancy</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={unitForm.max_occupancy}
                    onChange={e => setUnitForm({ ...unitForm, max_occupancy: parseInt(e.target.value) || 2 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A3C5E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Area (Sq.Ft)</label>
                  <input
                    type="number"
                    min={50}
                    value={unitForm.sq_ft}
                    onChange={e => setUnitForm({ ...unitForm, sq_ft: parseFloat(e.target.value) || 350 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A3C5E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bed Type</label>
                  <select
                    value={unitForm.attributes?.bed_type || "King"}
                    onChange={e => setUnitForm({ ...unitForm, attributes: { ...unitForm.attributes, bed_type: e.target.value } })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A3C5E] outline-none bg-white">
                    <option value="King">King Bed</option>
                    <option value="Queen">Queen Bed</option>
                    <option value="Twin">Twin Beds</option>
                    <option value="Single">Single Bed</option>
                    <option value="Bunk">Bunk Beds</option>
                  </select>
                </div>
              </div>

              {/* Amenities & Facilities Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Included Facilities & Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {facilities.length === 0 ? (
                    ["WiFi", "TV", "Ensuite Bathroom", "Balcony", "Work Desk", "Mini Bar", "Geyser", "Room Safe", "Room Service"].map(fName => {
                      const checked = (unitForm.attributes?.features || []).includes(fName);
                      return (
                        <label key={fName} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer bg-white p-1.5 rounded border border-slate-200 hover:border-slate-300">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFeatureCheckbox(unitForm, setUnitForm, fName)}
                            className="rounded text-[#1A3C5E] focus:ring-[#1A3C5E]"
                          />
                          <span>{fName}</span>
                        </label>
                      );
                    })
                  ) : (
                    facilities.map(fac => {
                      const checked = (unitForm.attributes?.features || []).includes(fac.name);
                      return (
                        <label key={fac.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer bg-white p-1.5 rounded border border-slate-200 hover:border-slate-300">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFeatureCheckbox(unitForm, setUnitForm, fac.name)}
                            className="rounded text-[#1A3C5E] focus:ring-[#1A3C5E]"
                          />
                          <span>{fac.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 flex-shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />} Save Room Specifications
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: BULK CREATE ROOMS ── */}
      {modalType === "bulk_units" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-[#2BAE8E] text-white flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Bulk Create Rooms & Assign Specifications
              </h3>
              <button onClick={() => setModalType(null)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkCreate} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 font-medium">
                Create multiple consecutive room numbers on a floor in one click with identical AC / Non-AC specifications and pricing.
              </div>

              {/* Floor Selection & Range */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Floor <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={bulkForm.floor_id}
                    onChange={e => setBulkForm({ ...bulkForm, floor_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] outline-none bg-white font-medium">
                    {floors.map(f => {
                      const bName = buildings.find(b => b.id === f.building_id)?.name || "";
                      return <option key={f.id} value={f.id}>{bName ? `${bName} — ` : ""}{f.name}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Prefix</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 -> 101"
                    value={bulkForm.prefix}
                    onChange={e => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-[#2BAE8E] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Start #</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={bulkForm.start_num}
                      onChange={e => setBulkForm({ ...bulkForm, start_num: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">End #</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={bulkForm.end_num}
                      onChange={e => setBulkForm({ ...bulkForm, end_num: parseInt(e.target.value) || 10 })}
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-100 p-2.5 rounded-lg flex items-center justify-between">
                <span>Will generate: <strong>Room {bulkForm.prefix}{String(bulkForm.start_num).padStart(2, '0')}</strong> through <strong>Room {bulkForm.prefix}{String(bulkForm.end_num).padStart(2, '0')}</strong></span>
                <Badge variant="teal">{Math.max(0, bulkForm.end_num - bulkForm.start_num + 1)} Rooms</Badge>
              </div>

              {/* Category & Air Conditioning Specification */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Specifications for all generated rooms</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Select Room Category</label>
                    <select
                      value={bulkForm.layout_type}
                      onChange={e => handleCategoryChange(e.target.value, true)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] outline-none bg-white font-medium">
                      {roomCategories.length === 0 ? (
                        <option value="Deluxe Room">Deluxe Room</option>
                      ) : (
                        roomCategories.map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name} {cat.base_price ? `(₹${cat.base_price}/night)` : ""}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Air Conditioning (AC) Status</label>
                    <div className="flex items-center gap-3 pt-1">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer font-semibold text-xs transition-all ${
                        bulkForm.attributes?.ac ? "bg-[#2BAE8E]/15 border-[#2BAE8E] text-[#2BAE8E]" : "bg-white border-slate-200 text-slate-600"
                      }`}>
                        <input
                          type="radio"
                          name="bulk_ac_spec"
                          checked={bulkForm.attributes?.ac === true}
                          onChange={() => setBulkForm({ ...bulkForm, attributes: { ...bulkForm.attributes, ac: true } })}
                          className="hidden"
                        />
                        <Wind className="w-4 h-4" /> Air Conditioned (AC)
                      </label>

                      <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer font-semibold text-xs transition-all ${
                        bulkForm.attributes?.ac === false ? "bg-[#F5A623]/20 border-[#F5A623] text-slate-900" : "bg-white border-slate-200 text-slate-600"
                      }`}>
                        <input
                          type="radio"
                          name="bulk_ac_spec"
                          checked={bulkForm.attributes?.ac === false}
                          onChange={() => setBulkForm({ ...bulkForm, attributes: { ...bulkForm.attributes, ac: false } })}
                          className="hidden"
                        />
                        Non-AC / Standard
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Base Rate (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={bulkForm.base_rate}
                    onChange={e => setBulkForm({ ...bulkForm, base_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-[#2BAE8E] focus:ring-2 focus:ring-[#2BAE8E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Max Occupancy</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={bulkForm.max_occupancy}
                    onChange={e => setBulkForm({ ...bulkForm, max_occupancy: parseInt(e.target.value) || 2 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Area (Sq.Ft)</label>
                  <input
                    type="number"
                    min={50}
                    value={bulkForm.sq_ft}
                    onChange={e => setBulkForm({ ...bulkForm, sq_ft: parseFloat(e.target.value) || 350 })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Bed Type</label>
                  <select
                    value={bulkForm.attributes?.bed_type || "King"}
                    onChange={e => setBulkForm({ ...bulkForm, attributes: { ...bulkForm.attributes, bed_type: e.target.value } })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2BAE8E] outline-none bg-white">
                    <option value="King">King Bed</option>
                    <option value="Queen">Queen Bed</option>
                    <option value="Twin">Twin Beds</option>
                    <option value="Single">Single Bed</option>
                  </select>
                </div>
              </div>

              {/* Amenities checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Included Amenities for all generated rooms</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {facilities.length === 0 ? (
                    ["WiFi", "TV", "Ensuite Bathroom", "Balcony", "Work Desk", "Mini Bar", "Geyser", "Room Safe", "Room Service"].map(fName => {
                      const checked = (bulkForm.attributes?.features || []).includes(fName);
                      return (
                        <label key={fName} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer bg-white p-1.5 rounded border border-slate-200 hover:border-slate-300">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFeatureCheckbox(bulkForm, setBulkForm, fName)}
                            className="rounded text-[#2BAE8E] focus:ring-[#2BAE8E]"
                          />
                          <span>{fName}</span>
                        </label>
                      );
                    })
                  ) : (
                    facilities.map(fac => {
                      const checked = (bulkForm.attributes?.features || []).includes(fac.name);
                      return (
                        <label key={fac.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer bg-white p-1.5 rounded border border-slate-200 hover:border-slate-300">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFeatureCheckbox(bulkForm, setBulkForm, fac.name)}
                            className="rounded text-[#2BAE8E] focus:ring-[#2BAE8E]"
                          />
                          <span>{fac.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 flex-shrink-0">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />} Generate Rooms
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
