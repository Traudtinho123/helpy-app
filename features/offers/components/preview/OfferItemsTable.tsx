import {
  formatCurrency,
  type Offer,
} from "@/features/offers/mock/mock-offers";

type OfferItemsTableProps = {
  offer: Offer;
};

export function OfferItemsTable({ offer }: OfferItemsTableProps) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--border)]">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
            <th className="w-16 px-4 py-3 text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
              Pos.
            </th>
            <th className="w-20 px-4 py-3 text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
              Menge
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
              Beschreibung
            </th>
            <th className="w-28 px-4 py-3 text-right text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
              Einzelpreis
            </th>
            <th className="w-28 px-4 py-3 text-right text-[10px] font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
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
              <td className="px-4 py-3.5 text-[12px] font-medium text-[var(--text-muted)]">
                {index + 1}
              </td>
              <td className="px-4 py-3.5 text-[12px] font-medium text-[var(--text-primary)]">
                {item.quantity}
              </td>
              <td className="px-4 py-3.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {item.description}
              </td>
              <td className="px-4 py-3.5 text-right text-[12px] text-[var(--text-secondary)]">
                {formatCurrency(item.unitPrice)}
              </td>
              <td className="px-4 py-3.5 text-right text-[12px] font-semibold text-[var(--text-primary)]">
                {formatCurrency(item.quantity * item.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
