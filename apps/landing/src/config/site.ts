const whatsappMessage =
  "Hola, vi Multiservicios 24/7 y quiero conocer el sistema para administrar mi taller. Me gustaría solicitar una demostración.";

export const site = {
  name: "Multiservicios 24/7",
  shortName: "MS 24/7",
  url: "https://www.multiservicios247.com",
  appUrl: "https://app.multiservicios247.com",
  whatsappNumber: "526675787701",
  whatsappDisplay: "+52 667 578 7701",
  whatsappUrl: `https://wa.me/526675787701?text=${encodeURIComponent(whatsappMessage)}`,
  title: "Software para talleres mecánicos | Multiservicios 24/7",
  description:
    "Administra clientes, vehículos, órdenes, inventario, compras y gastos. Conoce la utilidad de tu taller. Solicita una demostración por WhatsApp.",
} as const;
