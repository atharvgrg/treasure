export interface Level {
  level: number;
  password: string;
  name: string;
}

export interface Submission {
  id: string;
  teamName: string;
  level: number;
  difficulty: number; // 1-5 stars
  timestamp: number;
  completedLevels: number[]; // All levels completed (since they're sequential)
}

export const LEVELS: Level[] = [
  { level: 1, password: "ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If", name: "Level 1: First Shell" },
  { level: 2, password: "263JGJPfgU6LtdEvgfWU1XP5yac29mFx", name: "Level 2: Deeper Access" },
  { level: 3, password: "MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx", name: "Level 3: System Breach" },
  { level: 4, password: "2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ", name: "Level 4: Root Discovery" },
  { level: 5, password: "4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw", name: "Level 5: Core Penetration" },
  { level: 6, password: "HWasnPhtq9AVKe0dmk45nxy20cvUa6EG", name: "Level 6: Deep Shell" },
  { level: 7, password: "morbNTDkSW6jIlUc0ymOdMaLnOlFVAaj", name: "Level 7: Admin Override" },
  { level: 8, password: "dfwvzFQi4mU0wfNbFOe9RoWskMLg7eEc", name: "Level 8: Master Access" },
  { level: 9, password: "4CKMh1JI91bUIZZPXDqGanal4xvAg0JM", name: "Level 9: Ultimate Control" },
  { level: 10, password: "FGUW5ilLVJrxX9kMYMmlN4MgbpfMiqey", name: "Level 10: Treasure Found" },
];

export const PASSWORD_TO_LEVEL = new Map(LEVELS.map(level => [level.password, level]));

export function validatePassword(password: string): Level | null {
  return PASSWORD_TO_LEVEL.get(password) || null;
}

export function getCompletedLevels(currentLevel: number): number[] {
  return Array.from({ length: currentLevel }, (_, i) => i + 1);
}

export function generateSubmissionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
