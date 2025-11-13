export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: Source[];
  mode?: 'user' | 'sandbox' | 'insights';
}

export interface Source {
  id: string;
  title: string;
  level: 'org-core' | 'unit-core' | 'L1' | 'L2' | 'L3' | 'draft' | 'flagged';
  unit?: string;
  status: 'approved' | 'draft' | 'pending' | 'flagged';
  flagType?: 'pii' | 'duplicate' | 'conflict' | 'stale';
}

export interface AnalyticsData {
  topMissingTopics: Array<{topic: string; count: number; hasL1: boolean}>;
  levelMix: {l1Rate: number; l2Rate: number; l3Rate: number};
  staleDocuments: Array<{id: string; title: string; level: string; lastAccess: string}>;
  flaggedContent: Array<{id: string; title: string; flagType: string; severity: 'high' | 'medium' | 'low'}>;
}

export type ChatMode = 'insights';