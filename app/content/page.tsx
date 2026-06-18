"use client"

import { useState } from "react"
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  MoreVertical,
  Search,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function ContentDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [blogContent, setBlogContent] = useState("")
  const [notificationContent, setNotificationContent] = useState("")
  const [blogsCurrentPage, setBlogsCurrentPage] = useState(1)
  const [blogsItemsPerPage, setBlogsItemsPerPage] = useState(5)
  const [notificationsCurrentPage, setNotificationsCurrentPage] = useState(1)
  const [notificationsItemsPerPage, setNotificationsItemsPerPage] = useState(5)

  // Sample data for charts
  const viewsData = [
    { name: "Jan", blogs: 400, notifications: 240 },
    { name: "Feb", blogs: 300, notifications: 139 },
    { name: "Mar", blogs: 500, notifications: 380 },
    { name: "Apr", blogs: 780, notifications: 390 },
    { name: "May", blogs: 590, notifications: 430 },
    { name: "Jun", blogs: 800, notifications: 500 },
    { name: "Jul", blogs: 950, notifications: 580 },
  ]

  const contentPerformanceData = [
    { name: "Health Tips", views: 4000, engagement: 2400 },
    { name: "Exercise Guide", views: 3000, engagement: 1398 },
    { name: "Nutrition", views: 2000, engagement: 9800 },
    { name: "Recovery", views: 2780, engagement: 3908 },
    { name: "Wellness", views: 1890, engagement: 4800 },
  ]

  const engagementByTypeData = [
    { name: "Blogs", value: 65 },
    { name: "Notifications", value: 35 },
  ]

  const COLORS = ["#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6"]

  const deviceData = [
    { name: "Mobile", value: 58 },
    { name: "Desktop", value: 32 },
    { name: "Tablet", value: 10 },
  ]

  const DEVICE_COLORS = ["#6366f1", "#10b981", "#f59e0b"]

  const topPerformingContent = [
    {
      id: 1,
      title: "10 Essential Stretches for Office Workers",
      type: "Blog",
      views: 12540,
      engagement: 8.7,
      trend: "up",
    },
    {
      id: 2,
      title: "New Physiotherapy Services Available",
      type: "Notification",
      views: 9870,
      engagement: 7.2,
      trend: "up",
    },
    {
      id: 3,
      title: "How to Prevent Back Pain",
      type: "Blog",
      views: 8650,
      engagement: 9.1,
      trend: "up",
    },
    {
      id: 4,
      title: "Nutrition Tips for Recovery",
      type: "Blog",
      views: 7320,
      engagement: 6.8,
      trend: "down",
    },
    {
      id: 5,
      title: "Holiday Schedule Changes",
      type: "Notification",
      views: 6980,
      engagement: 5.4,
      trend: "down",
    },
  ]

  // Sample data for blogs and notifications
  const blogSampleData = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    title: `Content Management Blog ${i + 1}`,
    date: new Date(2024, 4, i + 1).toLocaleDateString(),
    status: i % 3 === 0 ? "Draft" : "Published",
  }))

  const notificationSampleData = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    title: `System Update Notification ${i + 1}`,
    dateRange: `May ${i + 1} - May ${i + 15}, 2024`,
    status: i % 4 === 0 ? "Inactive" : "Active",
  }))

  // Helper functions for pagination
  const getBlogsForCurrentPage = () => {
    const startIndex = (blogsCurrentPage - 1) * blogsItemsPerPage
    const endIndex = startIndex + blogsItemsPerPage
    return blogSampleData.slice(startIndex, endIndex)
  }

  const getNotificationsForCurrentPage = () => {
    const startIndex = (notificationsCurrentPage - 1) * notificationsItemsPerPage
    const endIndex = startIndex + notificationsItemsPerPage
    return notificationSampleData.slice(startIndex, endIndex)
  }

  const totalBlogsPages = Math.ceil(blogSampleData.length / blogsItemsPerPage)
  const totalNotificationsPages = Math.ceil(notificationSampleData.length / notificationsItemsPerPage)

  return (
    <DashboardLayout>
      <div className="flex min-h-screen flex-col bg-gray-100">
      <div className="flex flex-1">

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-800 mb-6">Good Morning Sir,</h1>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-700">Posted Blogs</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">5</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FileEdit className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-700">Posted Notification</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">5</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Bell className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-700">Blogs in Draft</h3>
                        <p className="text-4xl font-bold text-red-600 mt-2">2</p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <FileEdit className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-700">Notification in Draft</h3>
                        <p className="text-4xl font-bold text-red-600 mt-2">2</p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Bell className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Content Analytics Section */}
              <div className="bg-white rounded-lg border p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Content Performance Analytics</h2>

                <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 mb-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="blogs">Blogs Performance</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications Performance</TabsTrigger>
                    <TabsTrigger value="audience">Audience Insights</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-500">Total Views</p>
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold mt-2">45,281</p>
                            <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-500">Avg. Engagement Rate</p>
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold mt-2">7.8%</p>
                            <p className="text-xs text-green-600 mt-1">+2.1% from last month</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-500">Avg. Time on Page</p>
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold mt-2">3:24</p>
                            <p className="text-xs text-green-600 mt-1">+0:18 from last month</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            </div>
                            <p className="text-2xl font-bold mt-2">18,492</p>
                            <p className="text-xs text-green-600 mt-1">+8.3% from last month</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Content Views Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Views Over Time</CardTitle>
                        <CardDescription>Monthly view trends for blogs and notifications</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={viewsData}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Area
                                type="monotone"
                                dataKey="blogs"
                                stackId="1"
                                stroke="#6366f1"
                                fill="#6366f1"
                                fillOpacity={0.6}
                              />
                              <Area
                                type="monotone"
                                dataKey="notifications"
                                stackId="1"
                                stroke="#f43f5e"
                                fill="#f43f5e"
                                fillOpacity={0.6}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Top Performing Content */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Performing Content</CardTitle>
                        <CardDescription>Content with highest engagement and views</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-indigo-700">
                              <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                                Title
                              </TableHead>
                              <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                                Type
                              </TableHead>
                              <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                                Views
                              </TableHead>
                              <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                                Engagement Rate
                              </TableHead>
                              <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                                Trend
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topPerformingContent.map((content) => (
                              <TableRow key={content.id}>
                                <TableCell className="font-medium">{content.title}</TableCell>
                                <TableCell>{content.type}</TableCell>
                                <TableCell>{content.views.toLocaleString()}</TableCell>
                                <TableCell>{content.engagement}%</TableCell>
                                <TableCell>
                                  {content.trend === "up" ? (
                                    <span className="text-green-600 flex items-center">
                                      <TrendingUp className="h-4 w-4 mr-1" /> Up
                                    </span>
                                  ) : (
                                    <span className="text-red-600 flex items-center">
                                      <TrendingUp className="h-4 w-4 mr-1 transform rotate-180" /> Down
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Content Distribution Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Content Engagement by Type</CardTitle>
                          <CardDescription>Distribution of engagement across content types</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={engagementByTypeData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                  {engagementByTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Device Distribution</CardTitle>
                          <CardDescription>Content views by device type</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={deviceData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                  {deviceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Blogs Performance Tab */}
                  <TabsContent value="blogs" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Blog Performance Comparison</CardTitle>
                        <CardDescription>Views and engagement metrics for top blogs</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={contentPerformanceData}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="views" fill="#6366f1" name="Views" />
                              <Bar dataKey="engagement" fill="#10b981" name="Engagement" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional blog-specific metrics would go here */}
                  </TabsContent>

                  {/* Notifications Performance Tab */}
                  <TabsContent value="notifications" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notification Open Rates</CardTitle>
                        <CardDescription>Open and click-through rates for notifications</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsLineChart
                              data={[
                                { name: "Week 1", openRate: 65, clickRate: 42 },
                                { name: "Week 2", openRate: 59, clickRate: 38 },
                                { name: "Week 3", openRate: 80, clickRate: 55 },
                                { name: "Week 4", openRate: 81, clickRate: 60 },
                                { name: "Week 5", openRate: 76, clickRate: 48 },
                                { name: "Week 6", openRate: 85, clickRate: 62 },
                              ]}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="openRate"
                                stroke="#6366f1"
                                name="Open Rate %"
                                activeDot={{ r: 8 }}
                              />
                              <Line type="monotone" dataKey="clickRate" stroke="#f43f5e" name="Click Rate %" />
                            </RechartsLineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional notification-specific metrics would go here */}
                  </TabsContent>

                  {/* Audience Insights Tab */}
                  <TabsContent value="audience" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center">
                            <Users className="h-8 w-8 text-indigo-600 mb-2" />
                            <p className="text-sm font-medium text-gray-500">Total Audience</p>
                            <p className="text-3xl font-bold mt-1">24,892</p>
                            <p className="text-xs text-green-600 mt-1">+15.3% from last month</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center">
                            <Users className="h-8 w-8 text-indigo-600 mb-2" />
                            <p className="text-sm font-medium text-gray-500">New Subscribers</p>
                            <p className="text-3xl font-bold mt-1">1,247</p>
                            <p className="text-xs text-green-600 mt-1">+8.7% from last month</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center">
                            <Users className="h-8 w-8 text-indigo-600 mb-2" />
                            <p className="text-sm font-medium text-gray-500">Retention Rate</p>
                            <p className="text-3xl font-bold mt-1">92.4%</p>
                            <p className="text-xs text-green-600 mt-1">+1.2% from last month</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Audience Demographics</CardTitle>
                        <CardDescription>Age and gender distribution of your audience</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { age: "18-24", male: 20, female: 25 },
                                { age: "25-34", male: 30, female: 35 },
                                { age: "35-44", male: 25, female: 30 },
                                { age: "45-54", male: 15, female: 20 },
                                { age: "55-64", male: 10, female: 15 },
                                { age: "65+", male: 5, female: 10 },
                              ]}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="age" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="male" stackId="a" fill="#6366f1" name="Male %" />
                              <Bar dataKey="female" stackId="a" fill="#f43f5e" name="Female %" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional audience-specific metrics would go here */}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Upload New Blog Section */}
              <div className="bg-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload New Blog</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="blog-title">Enter Blog Title</Label>
                    <Input id="blog-title" placeholder="Enter a compelling title..." className="bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blog-content">Write or paste your blog content here</Label>
                    <textarea
                      placeholder="Start writing your blog content..."
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      className="w-full min-h-[250px] p-3 bg-white border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blog-tags">Add tags separated by commas</Label>
                    <Input id="blog-tags" placeholder="content, management, blog..." className="bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label>Upload blog cover image</Label>
                    <div className="flex items-center space-x-4">
                      <Input id="blog-image" type="file" className="w-auto bg-white" />
                      <Button variant="outline" size="sm">
                        Upload
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline">Save as Draft</Button>
                    <Button className="bg-indigo-700 hover:bg-indigo-800">Publish</Button>
                  </div>
                </div>
              </div>

              {/* Manage Existing Blogs Section */}
              <div className="bg-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Existing Blogs</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input placeholder="Search blogs by title or date" className="pl-10 bg-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="blogs-per-page" className="text-sm whitespace-nowrap">
                        Rows per page:
                      </Label>
                      <Select
                        value={blogsItemsPerPage.toString()}
                        onValueChange={(value) => {
                          setBlogsItemsPerPage(Number.parseInt(value))
                          setBlogsCurrentPage(1) // Reset to first page when changing items per page
                        }}
                      >
                        <SelectTrigger className="w-[80px] bg-white">
                          <SelectValue placeholder="5" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-white rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-indigo-700">
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Thumbnail
                          </TableHead>
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Name
                          </TableHead>
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Date
                          </TableHead>
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-white text-right [&:hover]:text-white hover:bg-transparent">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getBlogsForCurrentPage().map((blog) => (
                          <TableRow key={blog.id} className="hover:bg-transparent">
                            <TableCell>
                              <div className="h-12 w-20 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={`/placeholder.svg?height=48&width=80`}
                                  alt="Blog thumbnail"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{blog.title}</TableCell>
                            <TableCell>{blog.date}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  blog.status === "Published"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {blog.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>View</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <div className="text-sm text-gray-500">
                        Showing <span className="font-medium">{(blogsCurrentPage - 1) * blogsItemsPerPage + 1}</span> to{" "}
                        <span className="font-medium">
                          {Math.min(blogsCurrentPage * blogsItemsPerPage, blogSampleData.length)}
                        </span>{" "}
                        of <span className="font-medium">{blogSampleData.length}</span> blogs
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBlogsCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={blogsCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalBlogsPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={page === blogsCurrentPage ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setBlogsCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBlogsCurrentPage((prev) => Math.min(prev + 1, totalBlogsPages))}
                          disabled={blogsCurrentPage === totalBlogsPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popup Notifications Management Section */}
              <div className="bg-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Popup Notifications Management</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-title">Enter Notification Title</Label>
                    <Input id="notification-title" placeholder="Enter notification title..." className="bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-content">Write or paste your notification content here</Label>
                    <textarea
                      placeholder="Enter notification content..."
                      value={notificationContent}
                      onChange={(e) => setNotificationContent(e.target.value)}
                      className="w-full min-h-[150px] p-3 bg-white border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <div className="flex space-x-2">
                        <Select>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                              (month) => (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {[2023, 2024, 2025].map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <div className="flex space-x-2">
                        <Select>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                              (month) => (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {[2023, 2024, 2025].map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority Level</Label>
                      <Select>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload notification cover image</Label>
                    <div className="flex items-center space-x-4">
                      <Input id="notification-image" type="file" className="w-auto bg-white" />
                      <Button variant="outline" size="sm">
                        Upload
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline">Preview notification</Button>
                    <Button variant="outline">Save as Draft</Button>
                    <Button className="bg-indigo-700 hover:bg-indigo-800">Publish</Button>
                  </div>
                </div>
              </div>

              {/* Manage Existing Notifications Section */}
              <div className="bg-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Manage Existing Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input placeholder="Search notifications by title or date" className="pl-10 bg-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="notifications-per-page" className="text-sm whitespace-nowrap">
                        Rows per page:
                      </Label>
                      <Select
                        value={notificationsItemsPerPage.toString()}
                        onValueChange={(value) => {
                          setNotificationsItemsPerPage(Number.parseInt(value))
                          setNotificationsCurrentPage(1) // Reset to first page when changing items per page
                        }}
                      >
                        <SelectTrigger className="w-[80px] bg-white">
                          <SelectValue placeholder="5" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-white rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-indigo-700">
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Thumbnail
                          </TableHead>
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Name
                          </TableHead>
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Date
                          </TableHead>
                          <TableHead className="font-semibold text-white [&:hover]:text-white hover:bg-transparent">
                            Status
                          </TableHead>
                          <TableHead className="font-semibold text-white text-right [&:hover]:text-white hover:bg-transparent">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getNotificationsForCurrentPage().map((notification) => (
                          <TableRow key={notification.id} className="hover:bg-transparent">
                            <TableCell>
                              <div className="h-12 w-20 bg-gray-200 rounded overflow-hidden">
                                <img
                                  src={`/placeholder.svg?height=48&width=80`}
                                  alt="Notification thumbnail"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{notification.title}</TableCell>
                            <TableCell>{notification.dateRange}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  notification.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {notification.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>View</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <div className="text-sm text-gray-500">
                        Showing{" "}
                        <span className="font-medium">
                          {(notificationsCurrentPage - 1) * notificationsItemsPerPage + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(
                            notificationsCurrentPage * notificationsItemsPerPage,
                            notificationSampleData.length,
                          )}
                        </span>{" "}
                        of <span className="font-medium">{notificationSampleData.length}</span> notifications
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNotificationsCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={notificationsCurrentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalNotificationsPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={page === notificationsCurrentPage ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setNotificationsCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setNotificationsCurrentPage((prev) => Math.min(prev + 1, totalNotificationsPages))
                          }
                          disabled={notificationsCurrentPage === totalNotificationsPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>

    </DashboardLayout>
  )
}
