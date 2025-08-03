import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { validatePassword, generateSubmissionId, getCompletedLevels, type Submission } from "@shared/gameConfig";
import { dataStore } from "@/lib/dataStore";
import { Terminal, Star, Shield, Users, AlertTriangle, CheckCircle } from "lucide-react";

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
        throw new Error("Team name can only contain letters, numbers, spaces, hyphens, and underscores");
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
        throw new Error("Invalid password. Double-check the password from your completed level.");
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

      // Save to data store
      dataStore.addSubmission(submission);

      setSuccess(`Success! ${level.name} completed. ${level.level === 10 ? 'TREASURE FOUND! 🏆' : 'Keep going!'}`);
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
        className={`transition-colors ${
          i < difficulty
            ? "text-cyber-green hover:text-cyber-green"
            : "text-muted-foreground hover:text-cyber-green/60"
        }`}
      >
        <Star className={`w-6 h-6 ${i < difficulty ? "fill-current" : ""}`} />
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
              <Shield className="w-12 h-12 text-cyber-blue glow-text animate-pulse delay-500" />
            </div>

            {/* Main Title */}
            <div className="relative mb-8">
              <h1 className={`text-5xl md:text-7xl lg:text-8xl font-bold text-cyber-green mb-6 ${
                !isTypingComplete ? 'typing-animation' : 'glow-text'
              }`}>
                TREASURE IN THE SHELL
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-purple opacity-20 blur-xl rounded-lg"></div>
            </div>

            {/* Subtitle */}
            <div className="relative mb-6">
              <p className="text-2xl md:text-3xl text-cyber-blue matrix-text mb-4 font-semibold">
                💻 Crack the Clues • Break the Shell • Claim the Root 💎
              </p>
              <p className="text-xl text-cyber-green matrix-text font-medium">
                🧑‍💻 A Terminal Puzzle Challenge 🧠
              </p>
            </div>

            {/* Event Details */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <Badge variant="outline" className="glow-border text-cyber-green px-4 py-2 text-lg bg-cyber-green/10">
                <span className="text-2xl mr-2">🕐</span>
                02:00 PM
              </Badge>
              <Badge variant="outline" className="glow-border text-cyber-blue px-4 py-2 text-lg bg-cyber-blue/10">
                <span className="text-2xl mr-2">📅</span>
                06 August 2025
              </Badge>
              <Badge variant="outline" className="glow-border text-cyber-purple px-4 py-2 text-lg bg-cyber-purple/10">
                <span className="text-2xl mr-2">📍</span>
                301 M Block
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="glow-border bg-card/90 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-cyber-green matrix-text flex items-center justify-center gap-2">
                <Users className="w-6 h-6" />
                Submit Your Progress
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your team name and level password to track your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-destructive">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-cyber-green/50 bg-cyber-green/10">
                  <CheckCircle className="w-4 h-4 text-cyber-green" />
                  <AlertDescription className="text-cyber-green">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teamName" className="text-foreground matrix-text">
                    Team Name
                  </Label>
                  <Input
                    id="teamName"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name"
                    className="glow-border matrix-text bg-input/50"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground matrix-text">
                    Level Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter the password you found"
                    className="glow-border matrix-text bg-input/50 font-mono"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground matrix-text">
                    Difficulty Rating (1-5 stars)
                  </Label>
                  <div className="flex justify-center gap-1">
                    {renderStars()}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    How difficult was this level?
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full glow-border matrix-text bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit Progress"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="w-full glow-border matrix-text"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-6 glow-border bg-card/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-cyber-green matrix-text">
                  💡 How It Works
                </h3>
                <p className="text-sm text-muted-foreground">
                  Levels are sequential - completing Level 4 means you've also completed Levels 1-3.
                  Each password unlocks a specific level and tracks your team's progress.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
