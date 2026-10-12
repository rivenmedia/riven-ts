export function formatCurrency(amount: number, currency: string) {
  return Intl.NumberFormat(navigator.language, {
    style: "currency",
    currency,
  }).format(amount);
}
