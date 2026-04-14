export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any;
}

export interface Pothole {
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
}

export interface DetectionResult {
  id?: string;
  userId: string;
  imageUrl: string;
  timestamp: any;
  potholes: Pothole[];
  summary: string;
  overallSeverity: string;
}

export interface RouteHistory {
  id?: string;
  userId: string;
  startLocation: string;
  endLocation: string;
  timestamp: any;
  steps: string[];
  safetyReason: string;
}
