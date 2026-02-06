"use client";

import { useState } from "react";
import { useUsers, useCreateUser } from "@/lib/hooks/use-users";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Mock data for charts
const eventStatsData = [
  { name: "Jan", events: 4, avgAttendance: 82 },
  { name: "Feb", events: 3, avgAttendance: 78 },
  { name: "Mar", events: 5, avgAttendance: 85 },
  { name: "Apr", events: 4, avgAttendance: 88 },
  { name: "May", events: 6, avgAttendance: 90 },
  { name: "Jun", events: 4, avgAttendance: 87 },
];

const voicePartData = [
  { name: "Soprano", value: 24, color: "#3b82f6" },
  { name: "Alto", value: 18, color: "#8b5cf6" },
  { name: "Tenor", value: 16, color: "#ec4899" },
  { name: "Bass", value: 22, color: "#f59e0b" },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

export default function AdminPage() {
  const router = useRouter();
  const { data: authUserData } = useAuth();
  const { data: usersData } = useUsers();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
const authUser = authUserData?.data?.data || [];
const users = usersData?.data?.data || [];
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER" as const,
    voicePart: "SOPRANO" as const,
  });

  // Check authorization
  if (!authUser || !["ADMIN", "DISTRICT_LEADER"].includes(authUser.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">You do not have permission to access this page.</p>
            <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle user creation
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(formData, {
      onSuccess: () => {
        toast.success("User created successfully!");
        setFormData({ name: "", email: "", password: "", role: "MEMBER", voicePart: "SOPRANO" });
      },
      onError: (error) => {
        toast.error("Failed to create user");
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Manage users, view analytics, and configure your choir</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        {/* Tabs Navigation */}
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-slate-800 border border-slate-700 p-1 rounded-lg mb-8">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
            Users
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stats Cards */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{users.length}</div>
                <p className="text-xs text-slate-500 mt-2">Across all voice parts</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Avg Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">87%</div>
                <p className="text-xs text-slate-500 mt-2">Last 30 days</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Active Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-400">8</div>
                <p className="text-xs text-slate-500 mt-2">This month</p>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Pass Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">92%</div>
                <p className="text-xs text-slate-500 mt-2">Members at pass mark</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                      Add New Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Create New User</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Add a new choir member to the system
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <Label className="text-slate-200">Full Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                          className="bg-slate-700 border-slate-600 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-slate-200">Email</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                          className="bg-slate-700 border-slate-600 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-slate-200">Temporary Password</Label>
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className="bg-slate-700 border-slate-600 text-white"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-200">Role</Label>
                          <Select
                            value={formData.role}
                            onValueChange={(value) =>
                              setFormData({ ...formData, role: value as any })
                            }
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="PART_LEADER">Part Leader</SelectItem>
                              <SelectItem value="DISTRICT_LEADER">District Leader</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-slate-200">Voice Part</Label>
                          <Select
                            value={formData.voicePart}
                            onValueChange={(value) =>
                              setFormData({ ...formData, voicePart: value as any })
                            }
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="SOPRANO">Soprano</SelectItem>
                              <SelectItem value="ALTO">Alto</SelectItem>
                              <SelectItem value="TENOR">Tenor</SelectItem>
                              <SelectItem value="BASS">Bass</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isCreating}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isCreating ? "Creating..." : "Create User"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="border-slate-600 text-slate-200">
                  Bulk Import
                </Button>

                <Button variant="outline" className="border-slate-600 text-slate-200">
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Choir Members</CardTitle>
              <CardDescription className="text-slate-400">
                {users.length} members in total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Voice Part</TableHead>
                      <TableHead className="text-slate-300">Role</TableHead>
                      <TableHead className="text-slate-300">Attendance</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-slate-200">{user.name}</TableCell>
                        <TableCell className="text-slate-400">{user.email}</TableCell>
                        <TableCell className="text-slate-200">
                          <span className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-sm">
                            {user.voicePart || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-200">
                          <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full w-3/4 bg-green-500 rounded-full"></div>
                            </div>
                            <span className="text-sm">75%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-slate-700">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Attendance Trend</CardTitle>
                <CardDescription className="text-slate-400">Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={eventStatsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgAttendance"
                      stroke="#3b82f6"
                      name="Avg Attendance %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Voice Part Distribution */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Voice Part Distribution</CardTitle>
                <CardDescription className="text-slate-400">Current members by voice</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={voicePartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {voicePartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Events & Sessions */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Events & Sessions</CardTitle>
                <CardDescription className="text-slate-400">Monthly activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={eventStatsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="events" fill="#8b5cf6" name="Events" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
                <CardDescription className="text-slate-400">Key indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300">On-time Arrival Rate</span>
                    <span className="text-blue-400 font-semibold">89%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[89%] bg-blue-500 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300">Submission Compliance</span>
                    <span className="text-purple-400 font-semibold">94%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[94%] bg-purple-500 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-300">Monthly Pass Rate</span>
                    <span className="text-green-400 font-semibold">91%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[91%] bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Admin Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure your choir system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-white font-semibold">Pass Mark Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Default Pass Mark (%)</Label>
                    <Input
                      type="number"
                      defaultValue={80}
                      min={0}
                      max={100}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Late Threshold (minutes)</Label>
                    <Input
                      type="number"
                      defaultValue={5}
                      min={1}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-white font-semibold">Attendance Window</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300">Submission Window (days)</Label>
                    <Input
                      type="number"
                      defaultValue={3}
                      min={1}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
