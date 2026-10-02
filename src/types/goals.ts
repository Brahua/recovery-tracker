export interface RecoveryGoal {
  id: string;
  title: string;
  /** Set once the patient marks the goal as achieved. */
  achievedAt?: string;
  createdAt: string;
}
