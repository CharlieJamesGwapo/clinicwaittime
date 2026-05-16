import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clinic Wait-Time Tracker",
    short_name: "Clinic Wait",
    description:
      "Real-time queuing and wait-time monitoring for Philippine clinics.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1e40af",
    orientation: "portrait-primary",
    categories: ["health", "medical", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Patient check-in",
        short_name: "Check in",
        url: "/checkin",
        description: "Walk-in registration",
      },
      {
        name: "Lobby display",
        short_name: "Display",
        url: "/display",
        description: "Now-serving TV view",
      },
    ],
  };
}
