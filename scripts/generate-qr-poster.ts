import QRCode from "qrcode";
import path from "node:path";

const host = process.argv[2] ?? "http://localhost:3000";
const url = `${host.replace(/\/$/, "")}/checkin`;
const out = path.resolve(__dirname, "..", "public", "checkin-qr.png");

QRCode.toFile(out, url, { width: 600, margin: 2 }).then(() => {
  console.log(`Wrote ${out}`);
  console.log(`Target URL: ${url}`);
});
