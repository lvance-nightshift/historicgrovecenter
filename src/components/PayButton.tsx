import type { VendorState } from "@/app/actions/vendor-state";

/**
 * Post-registration "Pay booth fee" button linking to a hosted checkout
 * (Square, etc.). Shown on the confirmation screen when the event has both a
 * booth fee and a payment link. The linked page charges one space per checkout,
 * so multi-space registrations get a note to run it once per space.
 */
export default function PayButton({
  payment,
}: {
  payment: NonNullable<VendorState["payment"]>;
}) {
  return (
    <div className="mt-5 border-t border-grove/20 pt-5">
      <a
        href={payment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-full bg-grove px-6 py-3 font-semibold text-background transition-colors hover:bg-grove-dark"
      >
        Pay booth fee — {payment.amountLabel} ↗
      </a>
      <p className="mt-3 text-xs text-muted">
        {payment.spaces > 1 && !payment.exactAmount
          ? `The payment page charges ${payment.perSpaceLabel} per space — please complete it once for each of your ${payment.spaces} spaces.`
          : "Secure payment is handled by Square. Your space is confirmed once the fee is received."}
      </p>
    </div>
  );
}
