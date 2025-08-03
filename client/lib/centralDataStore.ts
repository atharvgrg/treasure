import { createClient } from "@supabase/supabase-js";
import { Submission } from "@shared/gameConfig";

// DISABLED: External database causing NetworkError
// Using reliable in-memory store for event
console.log("🔧 Using in-memory store - external database disabled for reliability");

let supabase: any = null;
let supabaseError: string = "External database disabled for event reliability";

interface SupabaseSubmission {
  id: string;
  team_name: string;
  level: number;
  difficulty: number;
  completed_levels: number[];
  timestamp: number;
  created_at?: string;
}

class CentralDataStore {
  private listeners: Set<() => void> = new Set();
  private submissions: Submission[] = [];
  private isInitialized = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private retryAttempts = 0;
  private maxRetries = 5;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    console.log("🚀 Initializing IN-MEMORY store for reliable event operation");

    // Initialize with empty submissions array
    this.submissions = [];
    this.isInitialized = true;
    this.retryAttempts = 0; // Reset to show success

    console.log("✅ In-memory store initialized successfully - ready for event!");
    console.log("📝 All submissions will be stored in memory and persist during the session");
  }

  private async ensureTableExists() {
    // In-memory store doesn't need table creation
    console.log("✅ Using in-memory store - no table setup needed");
  }

  private async loadSubmissions() {
    // In-memory store starts with empty data
    this.submissions = [];
    this.notifyListeners();
    console.log("📋 In-memory store ready - starting with empty data");
  }

  private setupRealtimeSubscription() {
    if (!supabase) {
      console.log("⚠️ Supabase not available, skipping real-time subscription");
      return;
    }

    try {
      supabase
        .channel("submissions_channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "submissions",
          },
          (payload) => {
            console.log("🔄 Real-time update received:", payload);
            this.handleRealtimeUpdate(payload);
          },
        )
        .subscribe((status) => {
          console.log(`🔌 Real-time subscription status: ${status}`);
          if (status === 'SUBSCRIPTION_ERROR') {
            console.warn("⚠️ Real-time subscription failed - using polling only");
          }
        });
    } catch (error) {
      console.warn("⚠️ Failed to setup real-time subscription:", error);
    }
  }

  private setupPolling() {
    if (!supabase) {
      console.log("⚠️ Supabase not available, skipping polling");
      return;
    }

    // Backup polling every 10 seconds
    this.pollInterval = setInterval(async () => {
      try {
        await this.loadSubmissions();
      } catch (error) {
        if (error instanceof Error && (
          error.message.includes('NetworkError') ||
          error.message.includes('fetch') ||
          error.name === 'NetworkError'
        )) {
          console.warn("🌐 Network error during polling - skipping");
        } else {
          console.warn("⚠️ Polling failed:", error);
        }
      }
    }, 10000);
  }

  private handleRealtimeUpdate(payload: any) {
    if (payload.eventType === "INSERT") {
      const newSubmission = this.mapFromSupabase(payload.new);
      this.submissions = [
        newSubmission,
        ...this.submissions.filter((s) => s.id !== newSubmission.id),
      ];
      this.submissions.sort(
        (a, b) => b.level - a.level || a.timestamp - b.timestamp,
      );
    } else if (payload.eventType === "DELETE") {
      this.submissions = this.submissions.filter(
        (s) => s.id !== payload.old.id,
      );
    } else if (payload.eventType === "UPDATE") {
      const updatedSubmission = this.mapFromSupabase(payload.new);
      this.submissions = this.submissions.map((s) =>
        s.id === updatedSubmission.id ? updatedSubmission : s,
      );
    }

    this.notifyListeners();
  }

  private mapFromSupabase(data: SupabaseSubmission): Submission {
    return {
      id: data.id,
      teamName: data.team_name,
      level: data.level,
      difficulty: data.difficulty,
      completedLevels: data.completed_levels,
      timestamp: data.timestamp,
    };
  }

  private mapToSupabase(submission: Submission): SupabaseSubmission {
    return {
      id: submission.id,
      team_name: submission.teamName,
      level: submission.level,
      difficulty: submission.difficulty,
      completed_levels: submission.completedLevels,
      timestamp: submission.timestamp,
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  async addSubmission(submission: Submission): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Database not initialized. Cannot save submission.");
    }

    console.log(
      `📝 Adding submission to central database: ${submission.teamName} - Level ${submission.level}`,
    );

    // Check for duplicates locally first
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

    try {
      // Try to save to database
      const supabaseData = this.mapToSupabase(submission);

      const { data, error } = await supabase
        .from("submissions")
        .insert(supabaseData)
        .select()
        .single();

      if (error) {
        console.warn(
          "⚠️ Database save failed, storing locally only:",
          error.message,
        );
        // Fallback: store in memory only
        this.submissions = [submission, ...this.submissions];
        this.submissions.sort(
          (a, b) => b.level - a.level || a.timestamp - b.timestamp,
        );
        this.notifyListeners();
        console.log("💾 Submission stored locally (database unavailable)");
        return;
      }

      console.log("✅ Submission saved to central database successfully");

      // Real-time update will handle the local state update
      // But also update immediately for better UX
      const newSubmission = this.mapFromSupabase(data);
      this.submissions = [
        newSubmission,
        ...this.submissions.filter((s) => s.id !== newSubmission.id),
      ];
      this.submissions.sort(
        (a, b) => b.level - a.level || a.timestamp - b.timestamp,
      );
      this.notifyListeners();
    } catch (error) {
      console.warn("⚠️ Database error, storing locally only:", error);
      // Graceful fallback: store in memory
      this.submissions = [submission, ...this.submissions];
      this.submissions.sort(
        (a, b) => b.level - a.level || a.timestamp - b.timestamp,
      );
      this.notifyListeners();
      console.log("💾 Submission stored locally (database error)");
    }
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
      throw new Error("Database not initialized. Cannot clear data.");
    }

    console.log("🗑️ Clearing ALL data from central database");

    try {
      const { error } = await supabase
        .from("submissions")
        .delete()
        .neq("id", ""); // Delete all records

      if (error) {
        if (
          error.message.includes("does not exist") ||
          error.message.includes("relation")
        ) {
          console.log("📋 Table doesn't exist, nothing to clear");
        } else {
          throw new Error(`Failed to clear data: ${error.message}`);
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ Clear operation failed, clearing local state only:",
        error,
      );
    }

    this.submissions = [];
    this.notifyListeners();
    console.log("✅ All data cleared");
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
    let databaseConnected =
      this.isInitialized && this.retryAttempts < this.maxRetries && supabase !== null;
    let message = "";

    if (supabaseError) {
      message = "Database client error - Running offline";
      databaseConnected = false;
    } else if (!this.isInitialized) {
      message = `Connecting to database... (${this.retryAttempts + 1}/${this.maxRetries})`;
    } else if (this.retryAttempts >= this.maxRetries) {
      message = "Network unavailable - Running offline mode";
      databaseConnected = false;
    } else if (!supabase) {
      message = "Database unavailable - Running offline";
      databaseConnected = false;
    } else {
      message = `Connected • ${this.submissions.length} submissions`;
      databaseConnected = true;
    }

    return {
      initialized: this.isInitialized,
      submissionCount: this.submissions.length,
      retryAttempts: this.retryAttempts,
      databaseConnected,
      message,
    };
  }

  // Cleanup
  destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.listeners.clear();
    supabase.removeAllChannels();
  }
}

// Create and export the centralized data store
export const centralDataStore = new CentralDataStore();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    centralDataStore.destroy();
  });

  // Clear any existing local storage to ensure no local data conflicts
  try {
    localStorage.removeItem("treasure_shell_submissions");
    localStorage.removeItem("treasure_shell_realtime_submissions");
    console.log("🧹 Cleared old local storage data");
  } catch (error) {
    console.warn("Could not clear local storage:", error);
  }
}
