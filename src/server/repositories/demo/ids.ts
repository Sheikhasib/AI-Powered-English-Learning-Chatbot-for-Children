/** Fixed id of the seeded demo device, so the seed, the demo route, the badge and the metrics filter agree. */
export const DEMO_DEVICE_ID = "00000000-0000-4000-8000-00000000d3a0";

/** True for the demo device; its timings are made up and must never count as measured latency. */
export function isDemoDevice(deviceId: string | undefined): boolean {
  return deviceId === DEMO_DEVICE_ID;
}
