import {
  formatCurrency,
  type Offer,
} from "@/features/offers/mock/mock-offers";

type OfferItemsTableProps = {
  offer: Offer;
};

export function OfferItemsTable({ offer }: OfferItemsTableProps) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E2E8F0]">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <th className="w-16 px-4 py-3 text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
              Pos.
            </th>
            <th className="w-20 px-4 py-3 text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
              Menge
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
              Beschreibung
            </th>
            <th className="w-28 px-4 py-3 text-right text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
              Einzelpreis
            </th>
            <th className="w-28 px-4 py-3 text-right text-[10px] font-semibold tracking-wide text-[#64748B] uppercase">
              Gesamt
            </th>
          </tr>
        </thead>
        <tbody>
          {offer.lineItems.map((item, index) => (
            <tr
              key={item.id}
              className="border-b border-[#F1F5F9] last:border-0"
            >
              <td className="px-4 py-3.5 text-[12px] font-medium text-[#94A3B8]">
                {index + 1}
              </td>
              <td className="px-4 py-3.5 text-[12px] font-medium text-[#0F172A]">
                {item.quantity}
              </td>
              <td className="px-4 py-3.5 text-[12px] leading-relaxed text-[#334155]">
                {item.description}
              </td>
              <td className="px-4 py-3.5 text-right text-[12px] text-[#64748B]">
                {formatCurrency(item.unitPrice)}
              </td>
              <td className="px-4 py-3.5 text-right text-[12px] font-semibold text-[#0F172A]">
                {formatCurrency(item.quantity * item.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
