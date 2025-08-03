import { Submission } from "@shared/gameConfig";

const STORAGE_KEY = "treasure_shell_submissions";
const STORAGE_VERSION = "1.0";

export interface StorageData {
  version: string;
  submissions: Submission[];
  lastUpdated: number;
}

class DataStore {
  private listeners: Set<() => void> = new Set();

  private getStorageData(): StorageData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return {
          version: STORAGE_VERSION,
          submissions: [],
          lastUpdated: Date.now(),
        };
      }
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return {
        version: STORAGE_VERSION,
        submissions: [],
        lastUpdated: Date.now(),
      };
    }
  }

  private saveStorageData(data: StorageData): void {
    try {
      data.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notifyListeners();
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      throw new Error("Failed to save data. Storage might be full.");
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  addSubmission(submission: Submission): void {
    // Validate submission data
    if (!submission.teamName || submission.teamName.trim().length === 0) {
      throw new Error("Team name is required");
    }

    if (submission.teamName.trim().length > 50) {
      throw new Error("Team name must be 50 characters or less");
    }

    if (!Number.isInteger(submission.level) || submission.level < 1 || submission.level > 10) {
      throw new Error("Invalid level number");
    }

    if (!Number.isInteger(submission.difficulty) || submission.difficulty < 1 || submission.difficulty > 5) {
      throw new Error("Difficulty must be between 1 and 5 stars");
    }

    if (!submission.id || submission.id.trim().length === 0) {
      throw new Error("Submission ID is required");
    }

    const data = this.getStorageData();

    // Check for duplicate submission ID
    if (data.submissions.find(s => s.id === submission.id)) {
      throw new Error("Duplicate submission ID");
    }

    // Check for duplicate team submissions for the same level
    const existingSubmission = data.submissions.find(
      s => s.teamName.toLowerCase() === submission.teamName.toLowerCase() && s.level === submission.level
    );

    if (existingSubmission) {
      throw new Error(`Team "${submission.teamName}" has already submitted for Level ${submission.level}`);
    }

    // Validate team name doesn't contain inappropriate characters
    const sanitizedTeamName = submission.teamName.trim().replace(/[<>\"'&]/g, '');
    if (sanitizedTeamName.length !== submission.teamName.trim().length) {
      throw new Error("Team name contains invalid characters");
    }

    // Create clean submission object
    const cleanSubmission: Submission = {
      ...submission,
      teamName: sanitizedTeamName,
      timestamp: submission.timestamp || Date.now(),
    };

    data.submissions.push(cleanSubmission);
    data.submissions.sort((a, b) => b.level - a.level || a.timestamp - b.timestamp);
    this.saveStorageData(data);
  }

  getSubmissions(): Submission[] {
    return this.getStorageData().submissions;
  }

  getSubmissionsByLevel(level: number): Submission[] {
    return this.getSubmissions().filter(s => s.level === level);
  }

  getTeamSubmissions(teamName: string): Submission[] {
    return this.getSubmissions().filter(
      s => s.teamName.toLowerCase() === teamName.toLowerCase()
    );
  }

  getLeaderboard(): { teamName: string; highestLevel: number; totalSubmissions: number; lastActivity: number }[] {
    const teams = new Map<string, { highestLevel: number; totalSubmissions: number; lastActivity: number }>();
    
    this.getSubmissions().forEach(submission => {
      const teamKey = submission.teamName.toLowerCase();
      const existing = teams.get(teamKey);
      
      if (!existing || submission.level > existing.highestLevel) {
        teams.set(teamKey, {
          highestLevel: submission.level,
          totalSubmissions: (existing?.totalSubmissions || 0) + 1,
          lastActivity: Math.max(existing?.lastActivity || 0, submission.timestamp),
        });
      } else {
        existing.totalSubmissions += 1;
        existing.lastActivity = Math.max(existing.lastActivity, submission.timestamp);
      }
    });
    
    return Array.from(teams.entries())
      .map(([teamName, data]) => ({ teamName, ...data }))
      .sort((a, b) => b.highestLevel - a.highestLevel || b.lastActivity - a.lastActivity);
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  exportData(): string {
    return JSON.stringify(this.getStorageData(), null, 2);
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData) as StorageData;
      this.saveStorageData(data);
    } catch (error) {
      throw new Error("Invalid data format");
    }
  }

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }
}

export const dataStore = new DataStore();
