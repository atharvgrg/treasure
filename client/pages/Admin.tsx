import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRealtimeStore } from "@/hooks/useRealtimeStore";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { postgresDataStore } from "@/lib/postgresDataStore";
import { LEVELS, type Submission } from "@shared/gameConfig";
import {
  Trophy,
  Users,
  Star,
  Clock,
  Download,
  Trash2,
  RefreshCw,
  Home,
  Monitor,
  BarChart3,
  Shield,
  Lock,
  AlertTriangle,
} from "lucide-react";

export default function Admin() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { isInitialized } = useRealtimeStore();

  const refreshData = () => {
    setSubmissions(productionDataStore.getSubmissions());
    setLeaderboard(productionDataStore.getLeaderboard());
    setLastUpdate(new Date());
  };

  useEffect(() => {
    refreshData();

    // Set up real-time updates from Firebase
    const unsubscribe = productionDataStore.subscribe(refreshData);

    // Auto-refresh every 5 seconds
    const interval = setInterval(refreshData, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getLevelName = (level: number) => {
    return LEVELS.find((l) => l.level === level)?.name || `Level ${level}`;
  };

  const exportData = () => {
    const data = productionDataStore.exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treasure-shell-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearData = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This cannot be undone!",
      )
    ) {
      await productionDataStore.clearAllData();
    }
  };

  const handleSecureReset = async () => {
    setResetError("");

    if (resetPassword.trim() === "GDG-IET") {
      await productionDataStore.clearAllData();
      setResetPassword("");
      setIsResetDialogOpen(false);
      // Show success message
      alert(
        "🔥 All data has been securely wiped! Production database reset complete.",
      );
    } else {
      setResetError("Incorrect password. Access denied.");
    }
  };

  const getStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < difficulty ? "text-cyber-green fill-current" : "text-muted-foreground"}`}
      />
    ));
  };

  const getLevelColor = (level: number) => {
    if (level >= 9) return "text-cyber-purple";
    if (level >= 7) return "text-cyber-blue";
    if (level >= 5) return "text-cyber-green";
    if (level >= 3) return "text-yellow-400";
    return "text-foreground";
  };

  return (
    <div className="min-h-screen terminal-bg cyber-grid">
      {/* Header */}
      <div className="bg-gradient-to-r from-terminal-bg via-terminal-bg/95 to-terminal-bg border-b border-terminal-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-cyber-green glow-text" />
              <div>
                <h1 className="text-3xl font-bold text-cyber-green matrix-text glow-text">
                  Admin Panel
                </h1>
                <p className="text-cyber-blue matrix-text">
                  Treasure in the Shell - Live Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="glow-border matrix-text"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Game
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="glow-border matrix-text"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <Badge variant="outline" className="glow-border text-cyber-green">
              <Users className="w-4 h-4 mr-1" />
              {submissions.length} Total Submissions
            </Badge>
            <Badge variant="outline" className="glow-border text-cyber-blue">
              <Trophy className="w-4 h-4 mr-1" />
              {leaderboard.length} Teams
            </Badge>
            <Badge variant="outline" className="glow-border text-cyber-purple">
              <Clock className="w-4 h-4 mr-1" />
              Last Update: {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glow-border bg-card/50">
            <TabsTrigger value="leaderboard" className="matrix-text">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="submissions" className="matrix-text">
              <BarChart3 className="w-4 h-4 mr-2" />
              All Submissions
            </TabsTrigger>
            <TabsTrigger value="levels" className="matrix-text">
              <Shield className="w-4 h-4 mr-2" />
              By Level
            </TabsTrigger>
            <TabsTrigger value="admin" className="matrix-text">
              <Monitor className="w-4 h-4 mr-2" />
              Admin Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Card className="glow-border bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-cyber-green matrix-text">
                  🏆 Team Leaderboard
                </CardTitle>
                <CardDescription>
                  Teams ranked by highest level completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No submissions yet. Teams will appear here once they start
                      submitting passwords.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((team, index) => (
                      <div
                        key={team.teamName}
                        className="flex items-center justify-between p-4 rounded-lg border glow-border bg-card/50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`text-2xl font-bold ${
                              index === 0
                                ? "text-cyber-green"
                                : index === 1
                                  ? "text-cyber-blue"
                                  : index === 2
                                    ? "text-cyber-purple"
                                    : "text-foreground"
                            }`}
                          >
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-lg matrix-text">
                              {team.teamName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {team.totalSubmissions} submission
                              {team.totalSubmissions !== 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-xl font-bold ${getLevelColor(team.highestLevel)}`}
                          >
                            Level {team.highestLevel}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(team.lastActivity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions">
            <Card className="glow-border bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-cyber-green matrix-text">
                  📊 All Submissions
                </CardTitle>
                <CardDescription>Real-time submission feed</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No submissions yet. This will update automatically as
                      teams submit passwords.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="matrix-text">Team</TableHead>
                        <TableHead className="matrix-text">Level</TableHead>
                        <TableHead className="matrix-text">
                          Difficulty
                        </TableHead>
                        <TableHead className="matrix-text">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium matrix-text">
                            {submission.teamName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getLevelColor(submission.level)} border-current`}
                            >
                              Level {submission.level}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {getStars(submission.difficulty)}
                            </div>
                          </TableCell>
                          <TableCell className="matrix-text text-sm">
                            {formatTime(submission.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="levels">
            <div className="grid gap-4">
              {LEVELS.map((level) => {
                const levelSubmissions = submissions.filter(
                  (s) => s.level === level.level,
                );
                return (
                  <Card
                    key={level.level}
                    className="glow-border bg-card/90 backdrop-blur"
                  >
                    <CardHeader>
                      <CardTitle
                        className={`${getLevelColor(level.level)} matrix-text`}
                      >
                        {level.name}
                      </CardTitle>
                      <CardDescription>
                        {levelSubmissions.length} team
                        {levelSubmissions.length !== 1 ? "s" : ""} completed
                      </CardDescription>
                    </CardHeader>
                    {levelSubmissions.length > 0 && (
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {levelSubmissions.map((submission) => (
                            <Badge
                              key={submission.id}
                              variant="outline"
                              className="glow-border matrix-text"
                            >
                              {submission.teamName} -{" "}
                              {formatTime(submission.timestamp)}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="glow-border bg-card/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-cyber-red matrix-text flex items-center gap-2">
                  <Lock className="w-6 h-6" />
                  ⚠️ Admin Tools
                </CardTitle>
                <CardDescription>
                  Use these tools carefully. All actions are permanent.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    onClick={exportData}
                    className="glow-border matrix-text bg-cyber-blue/10 border-cyber-blue hover:bg-cyber-blue/20"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </Button>

                  <Dialog
                    open={isResetDialogOpen}
                    onOpenChange={setIsResetDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="glow-border matrix-text border-cyber-red text-cyber-red hover:bg-cyber-red/20 bg-cyber-red/10"
                        variant="outline"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Secure Reset
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glow-border bg-card/95 backdrop-blur-xl border-2 border-cyber-red/50">
                      <DialogHeader>
                        <DialogTitle className="text-cyber-red matrix-text flex items-center gap-2">
                          <Shield className="w-6 h-6" />
                          🔐 Secure Database Reset
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground matrix-text">
                          This will permanently delete all submission data.
                          Enter the admin password to continue.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 pt-4">
                        {resetError && (
                          <Alert className="border-cyber-red/50 bg-cyber-red/10">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription className="text-cyber-red">
                              {resetError}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="space-y-2">
                          <Label
                            htmlFor="resetPassword"
                            className="text-foreground matrix-text"
                          >
                            Admin Password
                          </Label>
                          <Input
                            id="resetPassword"
                            type="password"
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                            placeholder="Enter admin password"
                            className="glow-border matrix-text bg-input/50 border-cyber-red/30"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSecureReset()
                            }
                          />
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={handleSecureReset}
                            className="flex-1 glow-border matrix-text bg-cyber-red hover:bg-cyber-red/90 text-white"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Reset Database
                          </Button>
                          <Button
                            onClick={() => {
                              setIsResetDialogOpen(false);
                              setResetPassword("");
                              setResetError("");
                            }}
                            variant="outline"
                            className="flex-1 glow-border matrix-text"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Alert className="border-cyber-blue/50 bg-cyber-blue/10">
                  <Monitor className="w-4 h-4" />
                  <AlertDescription className="text-cyber-blue matrix-text">
                    This panel updates automatically every 5 seconds. Keep this
                    open on the projector for live updates during the event.
                  </AlertDescription>
                </Alert>

                <Alert className="border-cyber-red/50 bg-cyber-red/10">
                  <Lock className="w-4 h-4" />
                  <AlertDescription className="text-cyber-red matrix-text">
                    <strong>Secure Reset:</strong> Requires admin password
                    "GDG-IET" to permanently wipe all submission data. Use with
                    extreme caution during the event.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
