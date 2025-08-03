import { Submission } from "@shared/gameConfig";

class NetlifyDataStore {
  private listeners: Set<() => void> = new Set();
  private submissions: Submission[] = [];
  private isInitialized = false;
  private fallbackStore: Storage | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastUpdate = 0;

  constructor() {
    // Use localStorage as fallback
    if (typeof window !== "undefined") {
      this.fallbackStore = window.localStorage;
    }
    this.initialize();
  }

  private async initialize() {
    try {
      // Load existing data
      await this.loadSubmissions();
      
      // Set up polling for real-time updates
      this.setupPolling();
      
      this.isInitialized = true;
      console.log("Netlify data store initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Netlify store, using fallback:", error);
      this.loadFromFallback();
      this.isInitialized = true;
    }
  }

  private async loadSubmissions() {
    try {
      const response = await fetch('/api/submissions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.submissions = result.data || [];
        this.lastUpdate = result.lastUpdate || Date.now();
        this.notifyListeners();
        this.saveToFallback();
      } else {
        throw new Error(result.error || 'Failed to load submissions');
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      this.loadFromFallback();
    }
  }

  private setupPolling() {
    // Poll every 3 seconds for real-time updates
    this.pollInterval = setInterval(async () => {
      try {
        await this.loadSubmissions();
      } catch (error) {
        console.error('Error polling for updates:', error);
      }
    }, 3000);
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  async addSubmission(submission: Submission): Promise<void> {
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add submission');
      }

      // Immediately update local state
      this.submissions = [result.data, ...this.submissions.filter(s => s.id !== result.data.id)];
      this.submissions.sort((a, b) => b.level - a.level || a.timestamp - b.timestamp);
      this.saveToFallback();
      this.notifyListeners();

      console.log('Submission saved successfully');
    } catch (error) {
      console.error('Error saving submission:', error);
      
      // Fallback to localStorage
      const existingSubmission = this.submissions.find(
        s => s.teamName.toLowerCase() === submission.teamName.toLowerCase() && s.level === submission.level
      );
      
      if (existingSubmission) {
        throw new Error(`Team "${submission.teamName}" has already submitted for Level ${submission.level}`);
      }

      this.submissions.unshift(submission);
      this.submissions.sort((a, b) => b.level - a.level || a.timestamp - b.timestamp);
      this.saveToFallback();
      this.notifyListeners();
      
      throw error; // Re-throw to show user there was an issue, but data is saved locally
    }
  }

  getSubmissions(): Submission[] {
    return this.submissions;
  }

  getSubmissionsByLevel(level: number): Submission[] {
    return this.submissions.filter(s => s.level === level);
  }

  getTeamSubmissions(teamName: string): Submission[] {
    return this.submissions.filter(
      s => s.teamName.toLowerCase() === teamName.toLowerCase()
    );
  }

  getLeaderboard(): { teamName: string; highestLevel: number; totalSubmissions: number; lastActivity: number }[] {
    const teams = new Map<string, { highestLevel: number; totalSubmissions: number; lastActivity: number }>();
    
    this.submissions.forEach(submission => {
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

  async clearAllData(): Promise<void> {
    try {
      const response = await fetch('/api/submissions?password=GDG-IET', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to clear data');
      }

      this.submissions = [];
      this.saveToFallback();
      this.notifyListeners();

      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      
      // Fallback: clear local data
      this.submissions = [];
      this.saveToFallback();
      this.notifyListeners();
      
      throw error;
    }
  }

  exportData(): string {
    return JSON.stringify({
      version: "2.0",
      submissions: this.submissions,
      lastUpdated: Date.now(),
      source: "netlify-functions",
    }, null, 2);
  }

  private loadFromFallback(): void {
    if (!this.fallbackStore) return;
    
    try {
      const data = this.fallbackStore.getItem('treasure_shell_submissions');
      if (data) {
        const parsed = JSON.parse(data);
        this.submissions = parsed.submissions || [];
      }
    } catch (error) {
      console.error('Error loading from fallback storage:', error);
      this.submissions = [];
    }
  }

  private saveToFallback(): void {
    if (!this.fallbackStore) return;
    
    try {
      const data = {
        version: "2.0",
        submissions: this.submissions,
        lastUpdated: Date.now(),
        source: "netlify-functions",
      };
      this.fallbackStore.setItem('treasure_shell_submissions', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to fallback storage:', error);
    }
  }

  // Wait for initialization
  async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Cleanup
  destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
  }
}

export const netlifyDataStore = new NetlifyDataStore();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    netlifyDataStore.destroy();
  });
}
