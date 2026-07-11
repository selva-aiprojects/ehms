"use client";

import { useState } from "react";
import { Settings, BedDouble, Tag, Truck, Users, DollarSign, CreditCard, Package, Plus, Edit2, Trash2, Check, AlertCircle, Loader2, Save, X } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import { useTaxSlabs, usePaymentModes, useBookingSources, useRatePlans, useIdProofTypes, useAssetCategories, useUOM, useProperties } from "@/lib/hooks";
import { useJourney } from "@/components/providers/JourneyProvider";
import MasterDataTable from "./components/MasterDataTable";

export default function MastersHubPage() {
  const [activeTab, setActiveTab] = useState("hospitality");

  const TABS = [
    { key: "hospitality", label: "Hospitality & Property", icon: BedDouble },
    { key: "business", label: "Business & Sales", icon: Tag },
    { key: "procurement", label: "Procurement & Inventory", icon: Truck },
    { key: "hr", label: "HR & Staffing", icon: Users },
    { key: "finance", label: "Finance & Tax", icon: DollarSign },
    { key: "payments", label: "Payments & Bookings", icon: CreditCard },
    { key: "assets", label: "Assets & Inventory", icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#1A3C5E]" />
            Master Data Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all system dictionaries, configurations, and core setup data.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                isActive ? "border-[#1A3C5E] text-[#1A3C5E]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        {activeTab === "hospitality" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <MasterDataTable 
              category="room-categories" 
              title="Room Categories" 
              columns={[
                { key: "name", label: "Category Name", type: "text" },
                { key: "code", label: "Code", type: "text" },
                { key: "base_price", label: "Base Price", type: "number" },
                { key: "description", label: "Description", type: "textarea" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
            <MasterDataTable 
              category="facilities" 
              title="Facilities" 
              columns={[
                { key: "name", label: "Facility Name", type: "text" },
                { key: "code", label: "Code", type: "text" },
                { key: "description", label: "Description", type: "textarea" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
            <MasterDataTable 
              category="services" 
              title="Add-on Services" 
              columns={[
                { key: "name", label: "Service Name", type: "text" },
                { key: "code", label: "Code", type: "text" },
                { key: "price", label: "Standard Price", type: "number" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
          </div>
        )}

        {activeTab === "business" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <MasterDataTable 
              category="channel-partners" 
              title="Channel Partners (OTAs)" 
              columns={[
                { key: "name", label: "Partner Name", type: "text" },
                { key: "code", label: "Code", type: "text" },
                { key: "commission_rate", label: "Commission %", type: "number" },
                { key: "contact_email", label: "Contact Email", type: "text" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
            <MasterDataTable 
              category="promotions" 
              title="Promotions & Offers" 
              columns={[
                { key: "name", label: "Offer Name", type: "text" },
                { key: "code", label: "Promo Code", type: "text" },
                { key: "discount_pct", label: "Discount %", type: "number" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
          </div>
        )}

        {activeTab === "procurement" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <MasterDataTable 
              category="material-types" 
              title="Material Types" 
              columns={[
                { key: "name", label: "Type Name", type: "text" },
                { key: "code", label: "Code", type: "text" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
            <MasterDataTable 
              category="materials" 
              title="Materials Catalog" 
              columns={[
                { key: "name", label: "Material Name", type: "text" },
                { key: "code", label: "SKU/Code", type: "text" },
                { key: "unit_of_measure", label: "UOM", type: "text" },
                { key: "reorder_level", label: "Reorder Level", type: "number" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
            <MasterDataTable 
              category="vendors" 
              title="Vendors & Suppliers" 
              columns={[
                { key: "company_name", label: "Company Name", type: "text" },
                { key: "contact_person", label: "Contact Person", type: "text" },
                { key: "email", label: "Email", type: "text" },
                { key: "phone", label: "Phone", type: "text" },
                { key: "is_compliant", label: "Compliant", type: "boolean" },
              ]}
            />
          </div>
        )}

        {activeTab === "hr" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <MasterDataTable 
              category="departments" 
              title="Departments" 
              columns={[
                { key: "name", label: "Department Name", type: "text" },
                { key: "code", label: "Code", type: "text" },
              ]}
            />
            <MasterDataTable 
              category="designations" 
              title="Designations" 
              columns={[
                { key: "name", label: "Designation Title", type: "text" },
                { key: "code", label: "Code", type: "text" },
                { key: "level", label: "Level/Hierarchy", type: "number" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
            <MasterDataTable 
              category="employee-bands" 
              title="Employee Bands" 
              columns={[
                { key: "name", label: "Band Name", type: "text" },
                { key: "code", label: "Band Code", type: "text" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
            <MasterDataTable 
              category="salary-structures" 
              title="Salary Structures" 
              columns={[
                { key: "name", label: "Structure Name", type: "text" },
                { key: "base_percentage", label: "Basic Pay %", type: "number" },
                { key: "hra_percentage", label: "HRA %", type: "number" },
                { key: "pf_applicable", label: "PF Applicable", type: "boolean" },
                { key: "is_active", label: "Active", type: "boolean" },
              ]}
            />
          </div>
        )}

        {activeTab === "finance" && <FinanceTab />}
        {activeTab === "payments" && <PaymentsTab />}
        {activeTab === "assets" && <AssetsTab />}
      </div>
    </div>
  );
}

function FinanceTab() {
  const { taxSlabs: gstSlabs, isLoading: gstLoading } = useTaxSlabs("gst");
  const { taxSlabs: tdsSlabs, isLoading: tdsLoading } = useTaxSlabs("tds");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <Card>
        <CardHeader title="GST Tax Slabs" subtitle="Goods & Services Tax slabs" />
        <InlineTable
          columns={[
            { key: "name", label: "Slab Name" },
            { key: "rate_pct", label: "Rate (%)" },
            { key: "applicable_from", label: "Effective From" },
          ]}
          data={gstSlabs}
          loading={gstLoading}
        />
      </Card>
      <Card>
        <CardHeader title="TDS Tax Slabs" subtitle="Tax Deducted at Source slabs" />
        <InlineTable
          columns={[
            { key: "name", label: "Slab Name" },
            { key: "rate_pct", label: "Rate (%)" },
            { key: "threshold_amount", label: "Threshold (₹)" },
          ]}
          data={tdsSlabs}
          loading={tdsLoading}
        />
      </Card>
    </div>
  );
}

function PaymentsTab() {
  const { selectedPropertyId } = useJourney();
  const { properties = [] } = useProperties();
  const { paymentModes, isLoading: pmLoading } = usePaymentModes();
  const { bookingSources, isLoading: bsLoading } = useBookingSources();
  const { ratePlans, isLoading: rpLoading, mutate: mutateRatePlans } = useRatePlans();

  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    unit_type: "room",
    base_rate: 2500,
    currency: "INR",
    is_dynamic: false,
    effective_from: new Date().toISOString().split("T")[0],
    effective_to: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const openAdd = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      unit_type: "room",
      base_rate: 2500,
      currency: "INR",
      is_dynamic: false,
      effective_from: new Date().toISOString().split("T")[0],
      effective_to: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      is_active: true,
    });
    setShowForm(true);
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || "",
      unit_type: plan.unit_type || "room",
      base_rate: Number(plan.base_rate || plan.base_price || 2500),
      currency: plan.currency || "INR",
      is_dynamic: !!plan.is_dynamic,
      effective_from: plan.effective_from ? plan.effective_from.slice(0, 10) : new Date().toISOString().split("T")[0],
      effective_to: plan.effective_to ? plan.effective_to.slice(0, 10) : new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      is_active: plan.is_active !== false,
    });
    setShowForm(true);
  };

  const handleSaveRatePlan = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      const url = editingPlan ? `/api/rate-plans` : `/api/rate-plans`;
      const method = editingPlan ? "PUT" : "POST";
      const validPropId = (selectedPropertyId && selectedPropertyId !== "all") ? selectedPropertyId : (properties[0]?.id || "2579f5fb-bbfa-42c0-b19b-61fec874ea48");
      const payload: any = { ...formData, property_id: validPropId };
      if (editingPlan) payload.id = editingPlan.id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: editingPlan ? "Rate plan updated" : "Rate plan created" });
      setShowForm(false);
      mutateRatePlans();
    } catch {
      setFeedback({ type: "error", message: "Failed to save rate plan" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRatePlan = async (id: string) => {
    try {
      const res = await fetch(`/api/rate-plans`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: false }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Rate plan deactivated" });
      mutateRatePlans();
    } catch {
      setFeedback({ type: "error", message: "Failed to deactivate rate plan" });
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <Card>
        <CardHeader title="Payment Modes" subtitle="Accepted payment methods" />
        <InlineTable
          columns={[
            { key: "name", label: "Mode Name" },
            { key: "code", label: "Code" },
            { key: "is_active", label: "Active" },
          ]}
          data={paymentModes}
          loading={pmLoading}
        />
      </Card>
      <Card>
        <CardHeader title="Booking Sources" subtitle="Channels & OTA sources" />
        <InlineTable
          columns={[
            { key: "name", label: "Source Name" },
            { key: "code", label: "Code" },
            { key: "commission_rate", label: "Commission %" },
          ]}
          data={bookingSources}
          loading={bsLoading}
        />
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader
          title="Rate Plans (Full CRUD)"
          subtitle="Manage seasonal pricing cards, dynamic rules, and base rates"
          action={
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
              style={{ background: "#2BAE8E" }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Rate Plan
            </button>
          }
        />

        {feedback && (
          <div className="mx-4 my-2 p-2.5 rounded-lg text-xs flex items-center gap-2" style={{
            background: feedback.type === "success" ? "rgba(43,174,142,0.1)" : "rgba(229,62,62,0.1)",
            color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E",
          }}>
            {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {feedback.message}
          </div>
        )}

        {rpLoading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading Rate Plans...</div>
        ) : !ratePlans || ratePlans.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No active rate plans. Click &apos;Add Rate Plan&apos; above to configure seasonal or base rates.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 text-xs uppercase">Plan Name</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 text-xs uppercase">Unit Type</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 text-xs uppercase">Base Rate</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 text-xs uppercase">Dynamic</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 text-xs uppercase">Effective Period</th>
                  <th className="text-left py-2.5 px-3 font-medium text-slate-500 text-xs uppercase">Status</th>
                  <th className="text-right py-2.5 px-3 font-medium text-slate-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ratePlans.map((rp: any) => (
                  <tr key={rp.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{rp.name}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-xs">{rp.unit_type || "Standard Room"}</td>
                    <td className="py-2.5 px-3 font-semibold text-[#1A3C5E]">{rp.currency || "INR"} {Number(rp.base_rate || rp.base_price || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${rp.is_dynamic ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                        {rp.is_dynamic ? "Yes (Dynamic)" : "Fixed"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-500">
                      {rp.effective_from ? rp.effective_from.slice(0, 10) : "Now"} → {rp.effective_to ? rp.effective_to.slice(0, 10) : "Ongoing"}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${rp.is_active !== false ? "bg-teal-100 text-teal-800" : "bg-red-100 text-red-800"}`}>
                        {rp.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(rp)} className="p-1.5 rounded hover:bg-gray-200 text-blue-600" title="Edit Rate Plan">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {rp.is_active !== false && (
                          <button onClick={() => handleDeleteRatePlan(rp.id)} className="p-1.5 rounded hover:bg-gray-200 text-red-600" title="Deactivate">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for Add / Edit Rate Plan */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md border overflow-hidden">
              <div className="px-5 py-3.5 border-b flex items-center justify-between bg-slate-50">
                <h3 className="font-semibold text-sm text-[#1A3C5E]">{editingPlan ? "Edit Rate Plan" : "Create Rate Plan"}</h3>
                <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-200 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Plan Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Summer Weekend Best Available"
                    className="w-full px-3 py-1.5 rounded border outline-none focus:border-teal-600 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Unit Type</label>
                    <select
                      value={formData.unit_type}
                      onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border outline-none focus:border-teal-600 text-sm bg-white"
                    >
                      <option value="room">Room</option>
                      <option value="suite">Suite</option>
                      <option value="apartment">Apartment</option>
                      <option value="desk">Desk</option>
                      <option value="seat">Seat</option>
                      <option value="meeting_room">Meeting Room</option>
                      <option value="cabin">Cabin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Base Rate ({formData.currency}) *</label>
                    <input
                      type="number"
                      value={formData.base_rate}
                      onChange={(e) => setFormData({ ...formData, base_rate: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded border outline-none focus:border-teal-600 text-sm font-semibold text-[#1A3C5E]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Effective From</label>
                    <input
                      type="date"
                      value={formData.effective_from}
                      onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Effective To</label>
                    <input
                      type="date"
                      value={formData.effective_to}
                      onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border outline-none text-xs"
                    />
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_dynamic}
                      onChange={(e) => setFormData({ ...formData, is_dynamic: e.target.checked })}
                      className="w-4 h-4 accent-teal-600 rounded"
                    />
                    <span>Dynamic Pricing Rules (Occupancy/Seasonal Surge)</span>
                  </label>
                </div>
              </div>
              <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-3.5 py-1.5 rounded border text-slate-600 bg-white text-xs font-medium hover:bg-slate-100">Cancel</button>
                <button
                  onClick={handleSaveRatePlan}
                  disabled={saving || !formData.name}
                  className="px-4 py-1.5 rounded bg-[#2BAE8E] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#239075] transition-colors"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {saving ? "Saving..." : "Save Rate Plan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function AssetsTab() {
  const { assetCategories, isLoading: acLoading } = useAssetCategories();
  const { uom, isLoading: uomLoading } = useUOM();
  const { idProofTypes, isLoading: idpLoading } = useIdProofTypes();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <Card>
        <CardHeader title="Asset Categories" subtitle="Fixed asset classification" />
        <InlineTable
          columns={[
            { key: "name", label: "Category Name" },
            { key: "code", label: "Code" },
            { key: "description", label: "Description" },
          ]}
          data={assetCategories}
          loading={acLoading}
        />
      </Card>
      <Card>
        <CardHeader title="Units of Measure (UOM)" subtitle="Measurement units" />
        <InlineTable
          columns={[
            { key: "name", label: "Unit Name" },
            { key: "code", label: "Code" },
          ]}
          data={uom}
          loading={uomLoading}
        />
      </Card>
      <Card>
        <CardHeader title="ID Proof Types" subtitle="Accepted identification documents" />
        <InlineTable
          columns={[
            { key: "name", label: "Proof Type" },
            { key: "code", label: "Code" },
          ]}
          data={idProofTypes}
          loading={idpLoading}
        />
      </Card>
    </div>
  );
}

function InlineTable({
  columns,
  data,
  loading,
}: {
  columns: { key: string; label: string }[];
  data: any[] | undefined;
  loading: boolean;
}) {
  if (loading) {
    return <div className="text-sm text-slate-400 text-center py-8">Loading...</div>;
  }
  if (!data || data.length === 0) {
    return <div className="text-sm text-slate-400 text-center py-8">No records found.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-2.5 px-3 font-medium text-slate-500 text-xs uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item: any, i: number) => (
            <tr key={item.id || i} className="border-b border-slate-100 hover:bg-slate-50">
              {columns.map((col) => {
                const val = item[col.key];
                const display =
                  col.key === "is_active"
                    ? val
                      ? "Yes"
                      : "No"
                    : val ?? "-";
                return (
                  <td key={col.key} className="py-2.5 px-3 text-slate-700">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
