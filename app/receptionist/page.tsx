"use client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsSection } from "@/components/stats/stats-section";
import { InvoicesSection } from "@/components/invoices/invoices-section";
import { PatientManagementSection } from "@/components/patient/patient-management-section";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
	const { user } = useAuth();

	return (
		<DashboardLayout>
			<div className="p-6 space-y-6">
				<h1 className="text-2xl font-semibold text-gray-800 mb-6">
					Good Morning, {user?.name || "User"}
				</h1>

				{/* Stats Section */}
				<StatsSection />

				{/* Appointments Today */}
				{/* <Card className="bg-blue-50">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Appointments Today</CardTitle>
						<div className="bg-gray-200 p-4 rounded-md">
							<div className="text-3xl font-bold text-center">46</div>
							<div className="text-sm text-center">patients</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex justify-between items-center">
								<h3 className="text-lg font-semibold">Details</h3>
								<div className="w-64">
									<Input
										placeholder="Search by patient name"
										className="bg-blue-900 text-white placeholder:text-gray-300"
									/>
								</div>
							</div>

							<Table>
								<TableHeader className="bg-blue-900 text-white">
									<TableRow>
										<TableHead className="text-white">Patient Name</TableHead>
										<TableHead className="text-white">
											Assigned Doctor
										</TableHead>
										<TableHead className="text-white">Time</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{[1, 2, 3].map((i) => (
										<TableRow key={i} className="bg-gray-200">
											<TableCell>Mr. Rohan Mondal</TableCell>
											<TableCell>Dr. Mainak Sur</TableCell>
											<TableCell>4.00 pm</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card> */}

				<Card className="bg-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-lg font-semibold">
							Appointments Today
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
											Patient's Name
										</TableHead>
										<TableHead className="font-semibold text-white">
											Assigned Therapist
										</TableHead>
										<TableHead className="font-semibold text-white">
											Time
										</TableHead>
										<TableHead className="font-semibold text-white">
											Tentative Exit Time
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
										<TableCell>10:00 AM</TableCell>
										<TableCell>
											<span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
												Completed
											</span>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium">Jane Smith</TableCell>
										<TableCell>Dr. Mike Johnson</TableCell>
										<TableCell>10:30 AM</TableCell>
										<TableCell>11:30 AM</TableCell>
										<TableCell>
											<span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
												Pending
											</span>
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium">Robert Brown</TableCell>
										<TableCell>Dr. Emily Davis</TableCell>
										<TableCell>02:00 PM</TableCell>
										<TableCell>03:00 PM</TableCell>
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

				{/* Invoices Section */}
				{/* <InvoicesSection /> */}

				{/* Client Management Section */}
				{/* <PatientManagementSection /> */}
			</div>
		</DashboardLayout>
	);
}
