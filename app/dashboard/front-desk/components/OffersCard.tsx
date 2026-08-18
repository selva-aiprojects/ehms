"use client";

import { useEffect, useState } from "react";
import { Tag, Loader2, Sparkles } from "lucide-react";
import Card from "@/components/ui/card";
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
      <Card className="h-full border border-[var(--color-border)]" padding={false}>
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          <h3 className="text-base font-semibold" style={{ color: "var(--text)" }}>Active Promotions</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-light)" }}>Sell more from every stay</p>
        </div>
      {loading ? (
        <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" /></div>
      ) : offers.length === 0 ? (
        <div className="text-center py-6">
          <Tag className="w-5 h-5 mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-sm text-[var(--color-text-muted)]">No active offers.</p>
        </div>
      ) : (
        <div className="p-3 space-y-2.5">
          {offers.slice(0, 4).map(offer => (
            <div key={offer.id} className="p-3 rounded-lg border border-[var(--color-border)] bg-white hover:bg-[var(--color-light)] transition-colors">
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold text-sm text-[var(--color-navy)] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-warning)]" /> {offer.title}
                </p>
                <Badge variant="amber" className="text-[10px] uppercase font-bold">{offer.offer_code}</Badge>
              </div>
              <div className="text-[10px] font-medium text-[var(--color-primary)]">
                {offer.discount_type === 'percentage' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
              </div>
              {offer.valid_from && offer.valid_until && (
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Valid: {new Date(offer.valid_from).toLocaleDateString()} – {new Date(offer.valid_until).toLocaleDateString()}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
