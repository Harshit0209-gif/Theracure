"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { RichTextEditor } from "@/components/rich-text-editor";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function NotificationsDashboard() {
	const [activeTab, setActiveTab] = useState("overview");
	const [notificationContent, setNotificationContent] = useState("");

	const [notificationsCurrentPage, setNotificationsCurrentPage] = useState(1);
	const [notificationsItemsPerPage, setNotificationsItemsPerPage] = useState(5);

	const notificationSampleData = Array.from({ length: 15 }, (_, i) => ({
		id: i + 1,
		title: `System Update Notification ${i + 1}`,
		dateRange: `May ${i + 1} - May ${i + 15}, 2024`,
		status: i % 4 === 0 ? "Inactive" : "Active",
	}));

	// Helper functions for pagination

	const getNotificationsForCurrentPage = () => {
		const startIndex =
			(notificationsCurrentPage - 1) * notificationsItemsPerPage;
		const endIndex = startIndex + notificationsItemsPerPage;
		return notificationSampleData.slice(startIndex, endIndex);
	};

	const totalNotificationsPages = Math.ceil(
		notificationSampleData.length / notificationsItemsPerPage
	);
	return (
		<DashboardLayout>
			<div>
				{/* Popup Notifications Management Section */}
				<div className="bg-gray-200 rounded-lg p-6 mb-8">
					<h2 className="text-xl font-semibold text-gray-800 mb-4">
						Popup Notifications Management
					</h2>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="notification-title">
								Enter Notification Title
							</Label>
							<Input
								id="notification-title"
								placeholder="Enter notification title..."
								className="bg-white"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="notification-content">
								Write or paste your notification content here
							</Label>
							<RichTextEditor
								placeholder="Enter notification content..."
								content={notificationContent}
								onChange={setNotificationContent}
								minHeight="150px"
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
											{Array.from({ length: 31 }, (_, i) => i + 1).map(
												(day) => (
													<SelectItem key={day} value={day.toString()}>
														{day}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
									<Select>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Month" />
										</SelectTrigger>
										<SelectContent>
											{[
												"Jan",
												"Feb",
												"Mar",
												"Apr",
												"May",
												"Jun",
												"Jul",
												"Aug",
												"Sep",
												"Oct",
												"Nov",
												"Dec",
											].map((month) => (
												<SelectItem key={month} value={month}>
													{month}
												</SelectItem>
											))}
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
											{Array.from({ length: 31 }, (_, i) => i + 1).map(
												(day) => (
													<SelectItem key={day} value={day.toString()}>
														{day}
													</SelectItem>
												)
											)}
										</SelectContent>
									</Select>
									<Select>
										<SelectTrigger className="bg-white">
											<SelectValue placeholder="Month" />
										</SelectTrigger>
										<SelectContent>
											{[
												"Jan",
												"Feb",
												"Mar",
												"Apr",
												"May",
												"Jun",
												"Jul",
												"Aug",
												"Sep",
												"Oct",
												"Nov",
												"Dec",
											].map((month) => (
												<SelectItem key={month} value={month}>
													{month}
												</SelectItem>
											))}
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
								<Input
									id="notification-image"
									type="file"
									className="w-auto bg-white"
								/>
								<Button variant="outline" size="sm">
									Upload
								</Button>
							</div>
						</div>

						<div className="flex justify-end space-x-2 pt-4">
							<Button variant="outline">Preview notification</Button>
							<Button variant="outline">Save as Draft</Button>
							<Button className="bg-indigo-700 hover:bg-indigo-800">
								Publish
							</Button>
						</div>
					</div>
				</div>

				{/* Manage Existing Notifications Section */}
				<div className="bg-gray-200 rounded-lg p-6 mb-8">
					<div className="flex flex-row mb-4 justify-between items-center">
						<h2 className="text-xl font-semibold text-gray-800 mb-4">
							Manage Existing Notifications
						</h2>
						<div className="flex items-center justify-between space-x-2">
							<div className="relative flex-1 md:w-[400px]">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder="Search notifications by title or date"
									className="bg-white pl-10 border border-indigo-300 rounded-lg text-sm placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition w-full"
								/>
							</div>
							<div className="flex items-center space-x-2">
								<Label
									htmlFor="notifications-per-page"
									className="text-sm whitespace-nowrap">
									Rows per page:
								</Label>
								<Select
									value={notificationsItemsPerPage.toString()}
									onValueChange={(value) => {
										setNotificationsItemsPerPage(Number.parseInt(value));
										setNotificationsCurrentPage(1); // Reset to first page when changing items per page
									}}>
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
					</div>
					<div className="space-y-4">
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
										<TableRow
											key={notification.id}
											className="hover:bg-transparent">
											<TableCell>
												<div className="h-12 w-20 bg-gray-200 rounded overflow-hidden">
													<img
														src={`/placeholder.svg?height=48&width=80`}
														alt="Notification thumbnail"
														className="h-full w-full object-cover"
													/>
												</div>
											</TableCell>
											<TableCell className="font-medium">
												{notification.title}
											</TableCell>
											<TableCell>{notification.dateRange}</TableCell>
											<TableCell>
												<span
													className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
														notification.status === "Active"
															? "bg-green-100 text-green-800"
															: "bg-red-100 text-red-800"
													}`}>
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
														<DropdownMenuItem className="text-red-600">
															Delete
														</DropdownMenuItem>
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
										{(notificationsCurrentPage - 1) *
											notificationsItemsPerPage +
											1}
									</span>{" "}
									to{" "}
									<span className="font-medium">
										{Math.min(
											notificationsCurrentPage * notificationsItemsPerPage,
											notificationSampleData.length
										)}
									</span>{" "}
									of{" "}
									<span className="font-medium">
										{notificationSampleData.length}
									</span>{" "}
									notifications
								</div>
								<div className="flex items-center space-x-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setNotificationsCurrentPage((prev) =>
												Math.max(prev - 1, 1)
											)
										}
										disabled={notificationsCurrentPage === 1}>
										<ChevronLeft className="h-4 w-4 mr-1" />
										Previous
									</Button>
									<div className="flex items-center space-x-1">
										{Array.from(
											{ length: totalNotificationsPages },
											(_, i) => i + 1
										).map((page) => (
											<Button
												key={page}
												variant={
													page === notificationsCurrentPage
														? "default"
														: "outline"
												}
												size="sm"
												className="w-8 h-8 p-0"
												onClick={() => setNotificationsCurrentPage(page)}>
												{page}
											</Button>
										))}
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setNotificationsCurrentPage((prev) =>
												Math.min(prev + 1, totalNotificationsPages)
											)
										}
										disabled={
											notificationsCurrentPage === totalNotificationsPages
										}>
										Next
										<ChevronRight className="h-4 w-4 ml-1" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
