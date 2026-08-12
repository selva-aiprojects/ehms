/**
 * Cross-module shared state captured during the workflow.
 */
export const state = {
  tenantCode: "",
  tenantName: "",
  role: "front_desk",
  propertyId: "",
  propertyName: "",

  guestId: "",
  guestName: "",
  guestEmail: "",
  phone: "",

  bookingId: "",
  unitId: "",
  unitLabel: "",
  totalAmount: 0,

  orderId: "",
  orderTotal: 0,

  taskId: "",
  ticketId: "",
  ticketTitle: "",

  employeeId: "",
  employeeName: "",
  employeeEmail: "",
  payrollRunId: "",

  itemId: "",
  itemName: "",

  poNumber: "",
  invoiceId: "",

  warnings: [] as string[],
};

export function addWarning(message: string): void {
  state.warnings.push(message);
  console.warn(`[workflow-warning] ${message}`);
}
