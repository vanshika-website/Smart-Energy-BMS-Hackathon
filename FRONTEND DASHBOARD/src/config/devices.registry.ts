import type { DeviceRecord, PhaseId } from '@/types/energy';

/**
 * Canonical device registry: IDs, phases, sensor/manual flags.
 * Backend should return compatible payloads; these values seed the UI when API is empty.
 */

export const deviceRegistrySeed: DeviceRecord[] = [
  {
    id: 'ac',
    name: 'AC',
    phaseId: 'phase3',
    sensorAttached: true,
    manualControl: true,
    loadCategory: 'heavy',
    zoneLabel: 'Phase 3',
    isOn: true,
    currentKw: 3.8,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'microwave',
    name: 'Microwave',
    phaseId: 'phase3',
    sensorAttached: true,
    manualControl: true,
    loadCategory: 'heavy',
    zoneLabel: 'Phase 3',
    isOn: false,
    currentKw: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'heater',
    name: 'Heater',
    phaseId: 'phase3',
    sensorAttached: true,
    manualControl: true,
    loadCategory: 'heavy',
    zoneLabel: 'Phase 3',
    isOn: true,
    currentKw: 2.0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'tv',
    name: 'TV',
    phaseId: 'phase2',
    sensorAttached: false,
    manualControl: true,
    loadCategory: 'light',
    zoneLabel: 'Phase 2',
    isOn: true,
    currentKw: null,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'lights',
    name: 'Lights',
    phaseId: 'phase2',
    sensorAttached: false,
    manualControl: true,
    loadCategory: 'light',
    zoneLabel: 'Phase 2',
    isOn: true,
    currentKw: null,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'charger',
    name: 'Charger',
    phaseId: 'phase2',
    sensorAttached: false,
    manualControl: true,
    loadCategory: 'light',
    zoneLabel: 'Phase 2',
    isOn: true,
    currentKw: null,
    lastUpdated: new Date().toISOString(),
  }
];

export function devicesByPhase(phaseId: PhaseId): DeviceRecord[] {
  return deviceRegistrySeed.filter((d) => d.phaseId === phaseId);
}
