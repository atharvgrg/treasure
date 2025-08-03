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
      
      if (!password.trim()) {
        throw new Error("Password is required");
      }

      // Validate password and get level
      const level = validatePassword(password);
      if (!level) {
        throw new Error("Invalid password. Check your spelling and try again.");
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
    <div className="min-h-screen terminal-bg cyber-grid">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-terminal-bg via-terminal-bg/95 to-terminal-bg">
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-green/5 via-transparent to-cyber-blue/5" />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Terminal className="w-12 h-12 text-cyber-green glow-text" />
              <Shield className="w-8 h-8 text-cyber-blue" />
            </div>
            <h1 className={`text-4xl md:text-6xl font-bold text-cyber-green mb-4 ${
              !isTypingComplete ? 'typing-animation' : 'glow-text'
            }`}>
              TREASURE IN THE SHELL
            </h1>
            <p className="text-xl md:text-2xl text-cyber-blue matrix-text mb-2">
              💻 Crack the Clues • Break the Shell • Claim the Root 💎
            </p>
            <p className="text-lg text-muted-foreground matrix-text">
              🧑‍💻 A Terminal Puzzle Challenge 🧠
            </p>
          </div>

          {/* Event Details */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="outline" className="glow-border text-cyber-green">
              🕐 02:00 PM
            </Badge>
            <Badge variant="outline" className="glow-border text-cyber-blue">
              📅 06 August 2025
            </Badge>
            <Badge variant="outline" className="glow-border text-cyber-purple">
              📍 301 M Block
            </Badge>
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
