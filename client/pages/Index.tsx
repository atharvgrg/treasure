import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  validatePassword,
  generateSubmissionId,
  getCompletedLevels,
  type Submission,
} from "@shared/gameConfig";
import { realtimeDataStore } from "@/lib/realtimeDataStore";
import {
  Terminal,
  Star,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Lock,
} from "lucide-react";

export default function Index() {
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [difficulty, setDifficulty] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsTypingComplete(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!teamName.trim()) {
        throw new Error("Team name is required");
      }

      if (teamName.trim().length < 2) {
        throw new Error("Team name must be at least 2 characters long");
      }

      if (teamName.trim().length > 50) {
        throw new Error("Team name must be 50 characters or less");
      }

      if (!/^[a-zA-Z0-9\s\-_]+$/.test(teamName.trim())) {
        throw new Error(
          "Team name can only contain letters, numbers, spaces, hyphens, and underscores",
        );
      }

      if (!password.trim()) {
        throw new Error("Password is required");
      }

      if (password.trim().length !== 32) {
        throw new Error("Password must be exactly 32 characters long");
      }

      // Validate password and get level
      const level = validatePassword(password.trim());
      if (!level) {
        throw new Error(
          "Invalid password. Double-check the password from your completed level.",
        );
      }

      // Create submission
      const submission: Submission = {
        id: generateSubmissionId(),
        teamName: teamName.trim(),
        level: level.level,
        difficulty,
        timestamp: Date.now(),
        completedLevels: getCompletedLevels(level.level),
      };

      // Save to real-time data store
      await realtimeDataStore.addSubmission(submission);

      setSuccess(
        `Success! ${level.name} completed. ${level.level === 10 ? "TREASURE FOUND! 🏆" : "Keep going!"}`,
      );
      setTeamName("");
      setPassword("");
      setDifficulty(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setDifficulty(i + 1)}
        className={`transition-all duration-200 hover:scale-110 ${
          i < difficulty
            ? "text-cyber-green drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]"
            : "text-muted-foreground hover:text-cyber-green/60"
        }`}
      >
        <Star className={`w-7 h-7 ${i < difficulty ? "fill-current" : ""}`} />
      </button>
    ));
  };

  return (
    <div className="min-h-screen terminal-bg cyber-grid relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-cyber-green rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyber-blue rounded-full animate-ping"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-cyber-purple rounded-full animate-pulse"></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-cyber-green rounded-full animate-ping delay-1000"></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-cyber-blue rounded-full animate-pulse delay-700"></div>
        <div className="absolute bottom-1/3 right-1/6 w-1 h-1 bg-cyber-purple rounded-full animate-ping delay-300"></div>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-green/10 via-transparent to-cyber-blue/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-terminal-bg/50 to-transparent" />

        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center mb-12">
            {/* Logo/Icon Section */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="relative">
                <Terminal className="w-16 h-16 text-cyber-green glow-text animate-pulse" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyber-green rounded-full opacity-20 animate-ping"></div>
              </div>
              <div className="h-12 w-0.5 bg-gradient-to-b from-cyber-green via-cyber-blue to-cyber-purple"></div>
              <div className="relative">
                <Shield className="w-12 h-12 text-cyber-blue glow-text animate-pulse delay-500" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-cyber-blue rounded-full opacity-30 animate-ping delay-700"></div>
              </div>
            </div>

            {/* Main Title */}
            <div className="relative mb-8">
              <h1
                className={`text-5xl md:text-7xl lg:text-8xl font-bold text-cyber-green mb-6 ${
                  !isTypingComplete ? "typing-animation" : "glow-text"
                }`}
              >
                TREASURE IN THE SHELL
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-purple opacity-20 blur-xl rounded-lg"></div>
            </div>

            {/* Subtitle */}
            <div className="relative mb-6">
              <p className="text-2xl md:text-3xl text-cyber-blue matrix-text mb-4 font-semibold">
                💻 Crack the Clues • Break the Shell • Claim the Root ����
              </p>
              <p className="text-xl text-cyber-green matrix-text font-medium">
                🧑‍💻 A Terminal Puzzle Challenge 🧠
              </p>
            </div>

            {/* Event Details */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <Badge
                variant="outline"
                className="glow-border text-cyber-green px-4 py-2 text-lg bg-cyber-green/10 hover:bg-cyber-green/20 transition-colors"
              >
                <span className="text-2xl mr-2">🕐</span>
                02:00 PM
              </Badge>
              <Badge
                variant="outline"
                className="glow-border text-cyber-blue px-4 py-2 text-lg bg-cyber-blue/10 hover:bg-cyber-blue/20 transition-colors"
              >
                <span className="text-2xl mr-2">📅</span>
                06 August 2025
              </Badge>
              <Badge
                variant="outline"
                className="glow-border text-cyber-purple px-4 py-2 text-lg bg-cyber-purple/10 hover:bg-cyber-purple/20 transition-colors"
              >
                <span className="text-2xl mr-2">📍</span>
                301 M Block
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="relative">
            {/* Glowing background effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-cyber-green/20 via-cyber-blue/20 to-cyber-purple/20 rounded-3xl blur-2xl animate-pulse"></div>

            <Card className="relative glow-border bg-card/95 backdrop-blur-xl border-2 border-cyber-green/30 shadow-2xl shadow-cyber-green/20">
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="relative">
                    <Users className="w-8 h-8 text-cyber-green glow-text" />
                    <div className="absolute -inset-1 bg-cyber-green/20 rounded-full blur-sm"></div>
                  </div>
                  <div className="h-8 w-0.5 bg-gradient-to-b from-cyber-green to-cyber-blue"></div>
                  <div className="text-cyber-blue font-mono text-sm tracking-wider">
                    [SUBMIT_PROGRESS]
                  </div>
                </div>

                <CardTitle className="text-3xl text-cyber-green matrix-text glow-text mb-2">
                  Submit Your Progress
                </CardTitle>
                <CardDescription className="text-lg text-cyber-blue/80 matrix-text">
                  Enter your team name and level password to track your progress
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8 pb-8">
                {error && (
                  <Alert className="mb-6 border-destructive/50 bg-destructive/10 border-2">
                    <AlertTriangle className="w-5 h-5" />
                    <AlertDescription className="text-destructive font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-6 border-cyber-green/50 bg-cyber-green/10 border-2">
                    <CheckCircle className="w-5 h-5 text-cyber-green" />
                    <AlertDescription className="text-cyber-green font-medium">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-3">
                    <Label
                      htmlFor="teamName"
                      className="text-foreground matrix-text text-lg flex items-center gap-2"
                    >
                      <Cpu className="w-5 h-5 text-cyber-blue" />
                      Team Name
                    </Label>
                    <Input
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter your team name"
                      className="glow-border matrix-text bg-input/50 text-lg py-3 border-2 border-cyber-green/30 focus:border-cyber-green transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="password"
                      className="text-foreground matrix-text text-lg flex items-center gap-2"
                    >
                      <Lock className="w-5 h-5 text-cyber-green" />
                      Level Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter the password you found"
                      className="glow-border matrix-text bg-input/50 font-mono text-lg py-3 border-2 border-cyber-green/30 focus:border-cyber-green transition-all"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-foreground matrix-text text-lg flex items-center justify-center gap-2">
                      <Star className="w-5 h-5 text-cyber-purple" />
                      Difficulty Rating (1-5 stars)
                    </Label>
                    <div className="flex justify-center gap-2 py-4">
                      {renderStars()}
                    </div>
                    <p className="text-sm text-muted-foreground text-center font-mono">
                      How difficult was this level?
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full glow-border matrix-text bg-gradient-to-r from-cyber-green to-cyber-blue hover:from-cyber-blue hover:to-cyber-green text-black font-bold text-lg py-4 transition-all duration-300 transform hover:scale-105"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </div>
                    ) : (
                      "Submit Progress"
                    )}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/admin")}
                    className="w-full glow-border matrix-text border-2 border-cyber-blue/30 hover:border-cyber-blue hover:bg-cyber-blue/10 transition-all"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Card */}
          <Card className="mt-8 glow-border bg-card/80 backdrop-blur border-2 border-cyber-purple/30">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <h3 className="text-xl font-semibold text-cyber-green matrix-text glow-text flex items-center justify-center gap-2">
                  <Terminal className="w-6 h-6" />
                  💡 How It Works
                </h3>
                <p className="text-sm text-muted-foreground matrix-text leading-relaxed">
                  Levels are sequential - completing Level 4 means you've also
                  completed Levels 1-3. Each password unlocks a specific level
                  and tracks your team's progress in real-time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
