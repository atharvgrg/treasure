// This is a test utility to verify the application works end-to-end
// Run this in the browser console to create test data

import { dataStore } from "./dataStore";
import { generateSubmissionId } from "@shared/gameConfig";
import type { Submission } from "@shared/gameConfig";

export function createTestSubmissions() {
  try {
    // Test submissions for different levels
    const testSubmissions: Partial<Submission>[] = [
      {
        teamName: "Alpha Hackers",
        level: 3,
        difficulty: 4,
      },
      {
        teamName: "Beta Breakers",
        level: 1,
        difficulty: 2,
      },
      {
        teamName: "Gamma Guards",
        level: 5,
        difficulty: 5,
      },
      {
        teamName: "Delta Defenders",
        level: 2,
        difficulty: 3,
      },
    ];

    testSubmissions.forEach((sub, index) => {
      const submission: Submission = {
        id: generateSubmissionId(),
        teamName: sub.teamName!,
        level: sub.level!,
        difficulty: sub.difficulty!,
        timestamp: Date.now() - index * 60000, // Stagger timestamps
        completedLevels: Array.from({ length: sub.level! }, (_, i) => i + 1),
      };

      try {
        dataStore.addSubmission(submission);
        console.log(`✅ Added test submission for ${submission.teamName}`);
      } catch (error) {
        console.error(
          `❌ Failed to add submission for ${submission.teamName}:`,
          error,
        );
      }
    });

    console.log("✨ Test submissions created successfully!");
    console.log("📊 Current submissions:", dataStore.getSubmissions());
    console.log("🏆 Current leaderboard:", dataStore.getLeaderboard());
  } catch (error) {
    console.error("❌ Error creating test submissions:", error);
  }
}

// Make it available globally for testing in development only
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).createTestSubmissions = createTestSubmissions;
  (window as any).treasureShellData = {
    dataStore,
    createTestSubmissions,
    getSubmissions: () => dataStore.getSubmissions(),
    getLeaderboard: () => dataStore.getLeaderboard(),
    clearData: () => dataStore.clearAllData(),
  };

  console.log(
    "🧪 Test utilities loaded. Use window.createTestSubmissions() to create test data.",
  );
}
