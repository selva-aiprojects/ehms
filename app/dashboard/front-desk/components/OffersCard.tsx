"use client";

import { useEffect, useState } from "react";
import { Tag, Loader2, Sparkles } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";

interface OffersCardProps {
  propertyId?: string;
}

export default function OffersCard({ propertyId }: OffersCardProps) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = propertyId
      ? `/api/dashboard/front-desk/offers?property_id=${propertyId}`
      : "/api/dashboard/front-desk/offers";
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.data) setOffers(data.data);
      })
      .finally(() => setLoading(false));
  }, [propertyId]);

  return (
    <Card>
      <CardHeader title="Active Promotions" subtitle="Upsell Opportunities" />
      {loading ? (
        <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-[#64748B]" /></div>
      ) : offers.length === 0 ? (
        <div className="text-center py-6">
          <Tag className="w-5 h-5 mx-auto mb-2 text-[#64748B]" />
          <p className="text-sm text-[#64748B]">No active offers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.slice(0, 4).map(offer => (
            <div key={offer.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-gradient-to-br from-white to-[#F5F7FA]">
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm text-[#1A3C5E] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" /> {offer.title}
                </p>
                <Badge variant="amber" className="text-[10px] uppercase font-bold">{offer.offer_code}</Badge>
              </div>
              <div className="text-[10px] font-medium text-[#2BAE8E]">
                {offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
              </div>
              {offer.valid_from && offer.valid_until && (
                <p className="text-[10px] text-[#64748B] mt-1">Valid: {new Date(offer.valid_from).toLocaleDateString()} – {new Date(offer.valid_until).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
