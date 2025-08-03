import { Submission } from "@shared/gameConfig";
import {
  supabase,
  initializeDatabase,
  type SupabaseSubmission,
} from "./supabase";

class RealtimeDataStore {
  private listeners: Set<() => void> = new Set();
  private submissions: Submission[] = [];
  private isInitialized = false;
  private fallbackStore: Storage | null = null;

  constructor() {
    // Use localStorage as fallback
    if (typeof window !== "undefined") {
      this.fallbackStore = window.localStorage;
    }
    this.initialize();
  }

  private async initialize() {
    try {
      const isDbReady = await initializeDatabase();
      if (!isDbReady) {
        console.warn("Database not ready, using localStorage fallback");
        this.loadFromFallback();
        this.isInitialized = true;
        return;
      }

      // Load existing data
      await this.loadSubmissions();

      // Set up real-time subscription
      this.setupRealtimeSubscription();

      this.isInitialized = true;
      console.log("Real-time data store initialized successfully");
    } catch (error) {
      console.error(
        "Failed to initialize real-time store, using fallback:",
        error,
      );
      this.loadFromFallback();
      this.isInitialized = true;
    }
  }

  private async loadSubmissions() {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) throw error;

      this.submissions = (data || []).map(this.mapFromSupabase);
      this.notifyListeners();
    } catch (error) {
      console.error("Error loading submissions:", error);
      this.loadFromFallback();
    }
  }

  private setupRealtimeSubscription() {
    supabase
      .channel("submissions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
        },
        (payload) => {
          console.log("Real-time update received:", payload);
          this.handleRealtimeUpdate(payload);
        },
      )
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
      });
  }

  private handleRealtimeUpdate(payload: any) {
    switch (payload.eventType) {
      case "INSERT":
        const newSubmission = this.mapFromSupabase(payload.new);
        this.submissions = [
          newSubmission,
          ...this.submissions.filter((s) => s.id !== newSubmission.id),
        ];
        break;
      case "DELETE":
        this.submissions = this.submissions.filter(
          (s) => s.id !== payload.old.id,
        );
        break;
      case "UPDATE":
        const updatedSubmission = this.mapFromSupabase(payload.new);
        this.submissions = this.submissions.map((s) =>
          s.id === updatedSubmission.id ? updatedSubmission : s,
        );
        break;
    }

    this.submissions.sort(
      (a, b) => b.level - a.level || a.timestamp - b.timestamp,
    );
    this.saveToFallback();
    this.notifyListeners();
  }

  private mapFromSupabase(data: SupabaseSubmission): Submission {
    return {
      id: data.id,
      teamName: data.teamName,
      level: data.level,
      difficulty: data.difficulty,
      timestamp: data.timestamp,
      completedLevels: data.completedLevels,
    };
  }

  private mapToSupabase(
    submission: Submission,
  ): Omit<SupabaseSubmission, "created_at" | "updated_at"> {
    return {
      id: submission.id,
      teamName: submission.teamName,
      level: submission.level,
      difficulty: submission.difficulty,
      timestamp: submission.timestamp,
      completedLevels: submission.completedLevels,
    };
  }

  async addSubmission(submission: Submission): Promise<void> {
    // Validate submission data
    if (!submission.teamName || submission.teamName.trim().length === 0) {
      throw new Error("Team name is required");
    }

    if (submission.teamName.trim().length > 50) {
      throw new Error("Team name must be 50 characters or less");
    }

    if (
      !Number.isInteger(submission.level) ||
      submission.level < 1 ||
      submission.level > 10
    ) {
      throw new Error("Invalid level number");
    }

    if (
      !Number.isInteger(submission.difficulty) ||
      submission.difficulty < 1 ||
      submission.difficulty > 5
    ) {
      throw new Error("Difficulty must be between 1 and 5 stars");
    }

    // Check for duplicate team submissions for the same level
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

    // Sanitize team name
    const sanitizedTeamName = submission.teamName
      .trim()
      .replace(/[<>\"'&]/g, "");
    if (sanitizedTeamName.length !== submission.teamName.trim().length) {
      throw new Error("Team name contains invalid characters");
    }

    const cleanSubmission: Submission = {
      ...submission,
      teamName: sanitizedTeamName,
      timestamp: submission.timestamp || Date.now(),
    };

    try {
      // Try to save to Supabase first
      const { error } = await supabase
        .from("submissions")
        .insert([this.mapToSupabase(cleanSubmission)]);

      if (error) throw error;

      // If successful, the real-time subscription will handle the UI update
      console.log("Submission saved to database successfully");
    } catch (error) {
      console.error("Error saving to database, using fallback:", error);

      // Fallback to localStorage
      this.submissions.unshift(cleanSubmission);
      this.submissions.sort(
        (a, b) => b.level - a.level || a.timestamp - b.timestamp,
      );
      this.saveToFallback();
      this.notifyListeners();
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

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  async clearAllData(): Promise<void> {
    try {
      // Clear from Supabase
      const { error } = await supabase
        .from("submissions")
        .delete()
        .neq("id", "impossible-id"); // This will delete all rows

      if (error) throw error;

      console.log("All data cleared from database");
    } catch (error) {
      console.error("Error clearing database:", error);

      // Fallback: clear local data
      this.submissions = [];
      this.saveToFallback();
      this.notifyListeners();
    }
  }

  exportData(): string {
    return JSON.stringify(
      {
        version: "1.0",
        submissions: this.submissions,
        lastUpdated: Date.now(),
      },
      null,
      2,
    );
  }

  private loadFromFallback(): void {
    if (!this.fallbackStore) return;

    try {
      const data = this.fallbackStore.getItem("treasure_shell_submissions");
      if (data) {
        const parsed = JSON.parse(data);
        this.submissions = parsed.submissions || [];
      }
    } catch (error) {
      console.error("Error loading from fallback storage:", error);
      this.submissions = [];
    }
  }

  private saveToFallback(): void {
    if (!this.fallbackStore) return;

    try {
      const data = {
        version: "1.0",
        submissions: this.submissions,
        lastUpdated: Date.now(),
      };
      this.fallbackStore.setItem(
        "treasure_shell_submissions",
        JSON.stringify(data),
      );
    } catch (error) {
      console.error("Error saving to fallback storage:", error);
    }
  }

  // Wait for initialization
  async waitForInitialization(): Promise<void> {
    while (!this.isInitialized) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

export const realtimeDataStore = new RealtimeDataStore();
