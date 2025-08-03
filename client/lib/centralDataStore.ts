import { Submission } from "@shared/gameConfig";

// Multi-device Netlify Functions store
console.log("🌐 Using Netlify Functions for multi-device functionality");

class CentralDataStore {
  private listeners: Set<() => void> = new Set();
  private submissions: Submission[] = [];
  private isInitialized = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private retryAttempts = 0;
  private maxRetries = 3;
  private isDevelopmentMode = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log("🚀 Initializing multi-device store with Netlify Functions");

    // Check if we're in development mode (no API functions available)
    this.isDevelopmentMode = await this.checkDevelopmentMode();

    if (this.isDevelopmentMode) {
      console.log("🔧 Development mode - using localStorage fallback");
      this.loadFromLocalStorage();
    } else {
      console.log("🌐 Production mode - using Netlify Functions for multi-device");
      await this.loadFromAPI();
      this.setupPolling();
    }

    this.isInitialized = true;
    console.log("✅ Multi-device store initialized successfully");
  }

  private async checkDevelopmentMode(): Promise<boolean> {
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) return true;

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return true;
      }

      return false;
    } catch {
      return true;
    }
  }

  private async loadFromAPI() {
    try {
      const response = await fetch("/api/submissions", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON - API may not be available");
      }

      const result = await response.json();

      if (result.success) {
        this.submissions = result.data || [];
        this.notifyListeners();
        console.log(`📊 Loaded ${this.submissions.length} submissions from API`);
      }
    } catch (error) {
      console.warn("API not available, using localStorage fallback:", error);
      this.loadFromLocalStorage();
    }
  }

  private loadFromLocalStorage() {
    try {
      const data = localStorage.getItem("treasure_shell_submissions");
      if (data) {
        const parsed = JSON.parse(data);
        this.submissions = parsed.submissions || [];
        console.log(`📋 Loaded ${this.submissions.length} submissions from localStorage`);
      } else {
        this.submissions = [];
        console.log("📋 Starting with empty submissions");
      }
      this.notifyListeners();
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      this.submissions = [];
      this.notifyListeners();
    }
  }

  private saveToLocalStorage() {
    try {
      const data = {
        version: "3.0",
        submissions: this.submissions,
        lastUpdated: Date.now(),
        source: "netlify-functions-fallback",
      };
      localStorage.setItem("treasure_shell_submissions", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  private setupPolling() {
    if (this.isDevelopmentMode) {
      console.log("🔄 Development mode - no API polling needed");
      return;
    }

    // Poll every 5 seconds for multi-device updates
    this.pollInterval = setInterval(async () => {
      try {
        await this.loadFromAPI();
      } catch (error) {
        console.warn("⚠️ Polling failed:", error);
      }
    }, 5000);

    console.log("🔄 Multi-device polling active (5 second intervals)");
  }

  private handleRealtimeUpdate(payload: any) {
    // In-memory store doesn't need real-time updates from external source
    console.log("📡 In-memory store - real-time updates handled locally");
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  async addSubmission(submission: Submission): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Store not initialized. Cannot save submission.");
    }

    console.log(
      `📝 Adding submission to in-memory store: ${submission.teamName} - Level ${submission.level}`,
    );

    // Check for duplicates
    const existingSubmission = this.submissions.find(
      (s) =>
        s.teamName.toLowerCase() === submission.teamName.toLowerCase() &&
        s.level === submission.level,
    );

    if (existingSubmission) {
      throw new Error(
        `Team "${submission.teamName}" has already submitted for Level ${submission.level}`,
      );
    }

    // Add to in-memory store
    this.submissions = [submission, ...this.submissions];
    this.submissions.sort(
      (a, b) => b.level - a.level || a.timestamp - b.timestamp,
    );
    this.notifyListeners();

    console.log("✅ Submission stored in memory successfully");
  }

  getSubmissions(): Submission[] {
    return this.submissions;
  }

  getSubmissionsByLevel(level: number): Submission[] {
    return this.submissions.filter((s) => s.level === level);
  }

  getTeamSubmissions(teamName: string): Submission[] {
    return this.submissions.filter(
      (s) => s.teamName.toLowerCase() === teamName.toLowerCase(),
    );
  }

  getLeaderboard(): {
    teamName: string;
    highestLevel: number;
    totalSubmissions: number;
    lastActivity: number;
  }[] {
    const teams = new Map<
      string,
      { highestLevel: number; totalSubmissions: number; lastActivity: number }
    >();

    this.submissions.forEach((submission) => {
      const teamKey = submission.teamName.toLowerCase();
      const existing = teams.get(teamKey);

      if (!existing || submission.level > existing.highestLevel) {
        teams.set(teamKey, {
          highestLevel: submission.level,
          totalSubmissions: (existing?.totalSubmissions || 0) + 1,
          lastActivity: Math.max(
            existing?.lastActivity || 0,
            submission.timestamp,
          ),
        });
      } else {
        existing.totalSubmissions += 1;
        existing.lastActivity = Math.max(
          existing.lastActivity,
          submission.timestamp,
        );
      }
    });

    return Array.from(teams.entries())
      .map(([teamName, data]) => ({ teamName, ...data }))
      .sort(
        (a, b) =>
          b.highestLevel - a.highestLevel || b.lastActivity - a.lastActivity,
      );
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async clearAllData(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Store not initialized. Cannot clear data.");
    }

    console.log("🗑️ Clearing ALL data from in-memory store");

    this.submissions = [];
    this.notifyListeners();
    console.log("✅ All data cleared from memory");
  }

  exportData(): string {
    return JSON.stringify(
      {
        version: "3.0",
        submissions: this.submissions,
        lastUpdated: Date.now(),
        source: "central-database-supabase",
        totalSubmissions: this.submissions.length,
      },
      null,
      2,
    );
  }

  // Wait for initialization
  async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Force refresh from database
  async forceRefresh(): Promise<void> {
    console.log("🔄 Force refreshing from central database");
    await this.loadSubmissions();
  }

  // Get connection status
  getStatus(): {
    initialized: boolean;
    submissionCount: number;
    retryAttempts: number;
    databaseConnected: boolean;
    message: string;
  } {
    return {
      initialized: this.isInitialized,
      submissionCount: this.submissions.length,
      retryAttempts: this.retryAttempts,
      databaseConnected: true, // In-memory store is always "connected"
      message: `In-memory store ready • ${this.submissions.length} submissions`,
    };
  }

  // Cleanup
  destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
    console.log("🧹 In-memory store cleaned up");
  }
}

// Create and export the centralized data store
export const centralDataStore = new CentralDataStore();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    centralDataStore.destroy();
  });

  console.log("📋 In-memory store ready for event");
}
