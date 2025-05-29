"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Users,
	Activity,
	Calendar,
	Clock,
	DollarSign,
	TrendingUp,
	UserCheck,
	UserX,
	AlertCircle,
	CheckCircle2,
	Clock4,
	Handshake,
} from "lucide-react";

export default function AdminDashboard() {
	return (
		<DashboardLayout>
			<div className="p-6 space-y-6">
				{/* Stats Overview */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card className="bg-white shadow-sm">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-500">
										Total Patients
									</p>
									<h3 className="text-2xl font-bold mt-1">1,234</h3>
									<p className="text-xs text-green-500 mt-1">
										↑ 12% from last month
									</p>
								</div>
								<div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
									<Users className="h-6 w-6 text-blue-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white shadow-sm">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-500">
										Monthly Revenue
									</p>
									<h3 className="text-2xl font-bold mt-1">$24,500</h3>
									<p className="text-xs text-green-500 mt-1">
										↑ 8% from last month
									</p>
								</div>
								<div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
									<DollarSign className="h-6 w-6 text-orange-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white shadow-sm">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-500">
										Today's Consultaions
									</p>
									<h3 className="text-2xl font-bold mt-1">12</h3>
									<p className="text-xs text-green-500 mt-1">
										↑ 2 new this week
									</p>
								</div>
								<div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
									<Handshake className="h-6 w-6 text-green-600" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white shadow-sm">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-gray-500">
										Today's Sessions
									</p>
									<h3 className="text-2xl font-bold mt-1">46</h3>
									<p className="text-xs text-blue-500 mt-1">8 pending</p>
								</div>
								<div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
									<Calendar className="h-6 w-6 text-purple-600" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Patient Status and Appointments */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card className="bg-white shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-lg font-semibold">
								Patient Status
							</CardTitle>
							<Button variant="ghost" size="sm">
								View All
							</Button>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div className="flex items-center space-x-3">
										<div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
											<CheckCircle2 className="h-5 w-5 text-green-600" />
										</div>
										<div>
											<p className="font-medium">Active Patients</p>
											<p className="text-sm text-gray-500">
												Currently in treatment
											</p>
										</div>
									</div>
									<span className="text-lg font-semibold">156</span>
								</div>

								<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div className="flex items-center space-x-3">
										<div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
											<Clock4 className="h-5 w-5 text-blue-600" />
										</div>
										<div>
											<p className="font-medium">Pending Follow-ups</p>
											<p className="text-sm text-gray-500">
												Scheduled for next week
											</p>
										</div>
									</div>
									<span className="text-lg font-semibold">23</span>
								</div>

								{/* <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
									<div className="flex items-center space-x-3">
										<div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
											<AlertCircle className="h-5 w-5 text-red-600" />
										</div>
										<div>
											<p className="font-medium">Critical Cases</p>
											<p className="text-sm text-gray-500">
												Requires immediate attention
											</p>
										</div>
									</div>
									<span className="text-lg font-semibold">5</span>
								</div> */}
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-lg font-semibold">
								Today's Consultations
							</CardTitle>
							<Button variant="ghost" size="sm">
								View All
							</Button>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{/* <div className="flex items-center justify-between">
									<Input
										placeholder="Search appointments..."
										className="max-w-sm"
									/>
								</div> */}
								<Table>
									<TableHeader>
										<TableRow className="bg-indigo-700">
											<TableHead className="font-semibold text-white">
												Patient
											</TableHead>
											<TableHead className="font-semibold text-white">
												Therapist
											</TableHead>
											<TableHead className="font-semibold text-white">
												Time
											</TableHead>
											<TableHead className="font-semibold text-white">
												Status
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										<TableRow>
											<TableCell className="font-medium">John Doe</TableCell>
											<TableCell>Dr. Sarah Smith</TableCell>
											<TableCell>09:00 AM</TableCell>
											<TableCell>
												<span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
													Confirmed
												</span>
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell className="font-medium">Jane Smith</TableCell>
											<TableCell>Dr. Mike Johnson</TableCell>
											<TableCell>10:30 AM</TableCell>
											<TableCell>
												<span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
													Pending
												</span>
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell className="font-medium">
												Robert Brown
											</TableCell>
											<TableCell>Dr. Emily Davis</TableCell>
											<TableCell>02:00 PM</TableCell>
											<TableCell>
												<span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
													In Progress
												</span>
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Therapist Status */}
				<Card className="bg-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-lg font-semibold">
							Therapist Status
						</CardTitle>
						<Button variant="ghost" size="sm">
							View All
						</Button>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="p-4 bg-gray-50 rounded-lg">
								<div className="flex items-center space-x-3">
									<div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
										<Users className="h-5 w-5 text-blue-600" />
									</div>
									<div>
										<p className="font-medium">Total Therapist</p>
										<p className="text-2xl font-bold mt-1">10</p>
									</div>
								</div>
							</div>
							<div className="p-4 bg-gray-50 rounded-lg">
								<div className="flex items-center space-x-3">
									<div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
										<UserCheck className="h-5 w-5 text-green-600" />
									</div>
									<div>
										<p className="font-medium">Active</p>
										<p className="text-2xl font-bold mt-1">8</p>
									</div>
								</div>
							</div>
							{/* <div className="p-4 bg-gray-50 rounded-lg">
								<div className="flex items-center space-x-3">
									<div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
										<Clock className="h-5 w-5 text-yellow-600" />
									</div>
									<div>
										<p className="font-medium">On Break</p>
										<p className="text-2xl font-bold mt-1">2</p>
									</div>
								</div>
							</div> */}
							<div className="p-4 bg-gray-50 rounded-lg">
								<div className="flex items-center space-x-3">
									<div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
										<UserX className="h-5 w-5 text-red-600" />
									</div>
									<div>
										<p className="font-medium">Off Duty</p>
										<p className="text-2xl font-bold mt-1">2</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
}
