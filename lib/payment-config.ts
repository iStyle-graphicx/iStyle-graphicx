export const PAYPAL_CONFIG = {
  CLIENT_ID: "AaiO_cz3R4i_0DpSy2V-70vQHa1Y8vhRc3VFipea8ewjC4BBFu7IU6zzqJOZ-HO1cOekVzavalHl3wPL",
  CLIENT_SECRET: "ECZFPWNocGf_k7fWe0vLvC5R9k2ocuV-GbjE78lkoGbobBVGpnbhpd3euOGZll85JXMQDqfXhVND289W",
  IDENTITY_TOKEN: "qg8mcxFiMMQw3UJ601HIvEjuZtaexoFYHewQue4C7C1VTxrhyU8ZHkybfn0",
  PAYPAL_ME_URL: "https://paypal.me/istylegraphicx",
  SANDBOX: false, // Set to true for testing
}

export const SA_BANKS = [
  { code: "ABSA", name: "ABSA Bank", color: "#E31E24" },
  { code: "STD", name: "Standard Bank", color: "#0066CC" },
  { code: "FNB", name: "First National Bank", color: "#F7941E" },
  { code: "NED", name: "Nedbank", color: "#00A651" },
  { code: "CAP", name: "Capitec Bank", color: "#0066CC" },
  { code: "DIS", name: "Discovery Bank", color: "#E31E24" },
]

export interface PaymentMethod {
  id: string
  type: "paypal" | "eft" | "card"
  name: string
  details: string
  isDefault: boolean
}

export interface PaymentRequest {
  amount: number
  currency: string
  description: string
  deliveryId: string
  customerId: string
  driverId?: string
  driverPayout?: number // 60% of total amount
}
