"use client";

import { useState } from "react";
import { Settings, BedDouble, Tag, Truck, Users } from "lucide-react";
import MasterDataTable from "./components/MasterDataTable";

export default function MastersHubPage() {
  const [activeTab, setActiveTab] = useState("hospitality");

  const TABS = [
    { key: "hospitality", label: "Hospitality & Property", icon: BedDouble },
    { key: "business", label: "Business & Sales", icon: Tag },
    { key: "procurement", label: "Procurement & Inventory", icon: Truck },
    { key: "hr", label: "HR & Staffing", icon: Users },
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
      </div>
    </div>
  );
}
