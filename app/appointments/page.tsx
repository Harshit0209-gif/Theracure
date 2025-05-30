"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "@/components/ui/use-toast";

import { AppointmentHeader } from "@/components/appointment-header";
import { AppointmentTable } from "@/components/appointment-table";
import { ScheduleNewDialog } from "@/components/schedule-new-dialog";
import { ManageAppointmentsDialog } from "@/components/manage-appointments-dialog";
import { CalendarViewDialog } from "@/components/calendar-view-dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
export interface Appointment {
	id: string;
	therapistId: string;
	patientId: string;
	appointmentStartTime: string;
	appointmentEndTime: string;
	therapyType: string;
	status: "confirmed" | "cancelled" | "completed";
	createdById: string;
	createdAt: string;

	// Populated fields
	patient?: {
		id: string;
		patientName: string;
	};
	therapist?: {
		id: string;
		name: string;
	};
	createdBy?: {
		name: string;
	};
}

export interface TherapistAvailability {
	id: string;
	therapistId: string;
	slotDate: string;
	startTime: string;
	endTime: string;
	isAvailable: boolean;
}

export interface PaginationInfo {
	total: number;
	pages: number;
	page: number;
	limit: number;
}

const AppointmentPage = () => {
	// State management
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [pagination, setPagination] = useState<PaginationInfo>({
		total: 0,
		pages: 0,
		page: 1,
		limit: 5,
	});

	// Dialog states
	const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
	const [manageDialogOpen, setManageDialogOpen] = useState(false);
	const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);

	// Fetch appointments from API
	const fetchAppointments = async (page: number = 1, search: string = "") => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: page.toString(),
				limit: pagination.limit.toString(),
				...(search && { search }),
			});

			const response = await fetch(`/api/appointments?${params}`);

			if (!response.ok) {
				throw new Error("Failed to fetch appointments");
			}

			const data = await response.json();

			if (data.success) {
				setAppointments(data.appointments);
				setPagination(data.pagination);
			}
		} catch (error) {
			console.error("Error fetching appointments:", error);
			toast({
				title: "Error",
				description: "Failed to fetch appointments. Please try again.",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	// Initial load
	useEffect(() => {
		fetchAppointments();
	}, []);

	// Handle search with debounce
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			fetchAppointments(1, searchQuery);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [searchQuery]);

	// Handle page change
	const handlePageChange = (newPage: number) => {
		fetchAppointments(newPage, searchQuery);
	};

	// Handle successful appointment creation/update
	const handleAppointmentUpdated = () => {
		fetchAppointments(pagination.page, searchQuery);
	};

	return (
		<DashboardLayout>
			<div className="bg-gray-200 rounded-lg p-6 mb-8">
				{/* Header with action buttons */}
				<AppointmentHeader
					onScheduleNew={() => setScheduleDialogOpen(true)}
					onManageAppointments={() => setManageDialogOpen(true)}
					onViewCalendar={() => setCalendarDialogOpen(true)}
				/>

				{/* Appointments Table */}
				<AppointmentTable
					appointments={appointments}
					loading={loading}
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					pagination={pagination}
					onPageChange={handlePageChange}
					onAppointmentUpdated={handleAppointmentUpdated}
				/>

				{/* Schedule New Appointment Dialog */}
				<ScheduleNewDialog
					open={scheduleDialogOpen}
					onOpenChange={setScheduleDialogOpen}
					onAppointmentCreated={handleAppointmentUpdated}
				/>

				{/* Manage Appointments Dialog */}
				<ManageAppointmentsDialog
					open={manageDialogOpen}
					onOpenChange={setManageDialogOpen}
					onAppointmentUpdated={handleAppointmentUpdated}
				/>

				{/* Calendar View Dialog */}
				<CalendarViewDialog
					open={calendarDialogOpen}
					onOpenChange={setCalendarDialogOpen}
				/>
			</div>
		</DashboardLayout>
	);
};

export default AppointmentPage;
