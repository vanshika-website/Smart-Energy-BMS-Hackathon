export type PhaseId = 'phase2' | 'phase3';

export type LoadCategory = 'heavy' | 'moderate' | 'light';

export interface DeviceRecord {
  id: string;
  name: string;
  phaseId: PhaseId;
  sensorAttached: boolean;
  manualControl: boolean;
  loadCategory: LoadCategory;
  zoneLabel: string;
  isOn: boolean;
  currentKw: number | null;
  lastUpdated?: string;
}

export type PhaseStatus =
  | 'normal'
  | 'overload'
  | 'moderate_warn'
  | 'no_sensor';

export interface PhaseView {
  id: PhaseId;
  title: string;
  subtitle: string;
  appliances: string[];
  liveKw: number;
  totalLoadKw: number;
  manualControlNotice?: string;
  status: PhaseStatus;
}

export interface EnergyAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  currentKw: number;
  normalHighKw: number;
  timestamp: string;
  channel: 'in_app' | 'mqtt' | 'sms_email';
}

export interface CompareRow {
  id: string;
  deviceId: string;
  deviceName: string;
  previousKw: number;
  currentKw: number;
  percentIncrease: number;
}

export interface RecommendationItem {
  id: string;
  deviceId?: string;
  phaseId: PhaseId;
  title: string;
  reason: string;
  suggestedModel: string;
  purchaseLink?: string;
  estimatedPriceInr?: number;
  energyRatingComparison: string;
  estimatedAnnualSavingsInr: number;
}

export interface HistoryPoint {
  t: number;
  kw: number;
}
