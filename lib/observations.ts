export type Observation = {
  id: string;
  targetId: string;
  targetType: 'department' | 'country';
  observedAt: string;
  note: string | null;
  sessionId?: string | null;
};
