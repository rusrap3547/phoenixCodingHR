/**
 * MeetingManager - Handles calendar and meeting management
 * Manages meeting creation, editing, deletion, and calendar rendering
 */

import { ModalComponent } from "./components/ModalComponent.js";
import { NotificationComponent } from "./components/NotificationComponent.js";

export class MeetingManager {
	/**
	 * Initialize the MeetingManager
	 * @param {Object} dependencies - Required dependencies
	 * @param {Object} dependencies.authSystem - Authentication system
	 */
	constructor(dependencies = {}) {
		this.authSystem = dependencies.authSystem;
		this.meetings = this.loadMeetings();
		this.meetingIdCounter = this.getNextMeetingId();
	}

	/**
	 * Load meetings from localStorage
	 * @returns {Array} Array of meeting objects
	 */
	loadMeetings() {
		try {
			const saved = localStorage.getItem("study-hall-meetings");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.error("Error loading meetings:", error);
		}

		// Return default meetings if none exist
		return [
			{
				id: 1,
				title: "Team Standup",
				date: "2025-11-05",
				time: "09:00",
				duration: 30,
				attendees: ["Admin User", "Sarah Johnson", "Mike Chen"],
				type: "recurring",
				location: "Conference Room A",
				description: "Daily team sync-up meeting",
				createdBy: "admin@studyhall.com",
				createdAt: new Date().toISOString(),
			},
			{
				id: 2,
				title: "Interview: Software Engineer",
				date: "2025-11-06",
				time: "14:00",
				duration: 60,
				attendees: ["Sarah Johnson", "Mike Chen"],
				type: "interview",
				location: "Video Call",
				description: "Technical interview for senior developer position",
				createdBy: "hr@studyhall.com",
				createdAt: new Date().toISOString(),
			},
			{
				id: 3,
				title: "HR Department Review",
				date: "2025-11-07",
				time: "10:30",
				duration: 90,
				attendees: ["Admin User", "Sarah Johnson"],
				type: "meeting",
				location: "Conference Room B",
				description: "Quarterly HR department performance review",
				createdBy: "admin@studyhall.com",
				createdAt: new Date().toISOString(),
			},
			{
				id: 4,
				title: "Quarterly Planning",
				date: "2025-11-08",
				time: "13:00",
				duration: 120,
				attendees: ["Admin User", "Sarah Johnson", "Mike Chen"],
				type: "planning",
				location: "Main Conference Room",
				description: "Strategic planning session for Q1 2026",
				createdBy: "admin@studyhall.com",
				createdAt: new Date().toISOString(),
			},
		];
	}

	/**
	 * Save meetings to localStorage
	 */
	saveMeetings() {
		try {
			localStorage.setItem(
				"study-hall-meetings",
				JSON.stringify(this.meetings)
			);
		} catch (error) {
			console.error("Error saving meetings:", error);
			NotificationComponent.show("Failed to save meetings", "error");
		}
	}

	/**
	 * Get next meeting ID
	 * @returns {number} Next available meeting ID
	 */
	getNextMeetingId() {
		if (this.meetings.length === 0) return 1;
		return Math.max(...this.meetings.map((m) => m.id)) + 1;
	}

	/**
	 * Get all meetings
	 * @returns {Array} Array of all meetings
	 */
	getAllMeetings() {
		return this.meetings;
	}

	/**
	 * Get a specific meeting by ID
	 * @param {number} meetingId - Meeting ID
	 * @returns {Object|null} Meeting object or null if not found
	 */
	getMeeting(meetingId) {
		return this.meetings.find((m) => m.id === meetingId) || null;
	}

	/**
	 * Get meetings for a specific date
	 * @param {string} date - Date in YYYY-MM-DD format
	 * @returns {Array} Array of meetings on that date
	 */
	getMeetingsByDate(date) {
		return this.meetings.filter((m) => m.date === date);
	}

	/**
	 * Get upcoming meetings
	 * @param {number} days - Number of days to look ahead (default: 7)
	 * @returns {Array} Array of upcoming meetings
	 */
	getUpcomingMeetings(days = 7) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const futureDate = new Date(today);
		futureDate.setDate(futureDate.getDate() + days);

		return this.meetings
			.filter((meeting) => {
				const meetingDate = new Date(meeting.date);
				return meetingDate >= today && meetingDate <= futureDate;
			})
			.sort((a, b) => {
				const dateCompare = new Date(a.date) - new Date(b.date);
				if (dateCompare !== 0) return dateCompare;
				return a.time.localeCompare(b.time);
			});
	}

	/**
	 * Get today's meetings
	 * @returns {Array} Array of today's meetings
	 */
	getTodaysMeetings() {
		const today = new Date().toISOString().split("T")[0];
		return this.getMeetingsByDate(today);
	}

	/**
	 * Create a new meeting
	 * @param {Object} meetingData - Meeting data
	 * @returns {Object} Created meeting object
	 */
	createMeeting(meetingData) {
		const user = this.authSystem.getCurrentUser();
		const meeting = {
			id: this.meetingIdCounter++,
			title: meetingData.title,
			date: meetingData.date,
			time: meetingData.time,
			duration: parseInt(meetingData.duration) || 60,
			attendees: meetingData.attendees || [],
			type: meetingData.type || "meeting",
			location: meetingData.location || "",
			description: meetingData.description || "",
			createdBy: user ? user.email : "unknown",
			createdAt: new Date().toISOString(),
		};

		this.meetings.push(meeting);
		this.saveMeetings();

		return meeting;
	}

	/**
	 * Update an existing meeting
	 * @param {number} meetingId - Meeting ID
	 * @param {Object} updates - Updated meeting properties
	 * @returns {boolean} Success status
	 */
	updateMeeting(meetingId, updates) {
		const meetingIndex = this.meetings.findIndex((m) => m.id === meetingId);
		if (meetingIndex === -1) {
			NotificationComponent.show("Meeting not found", "error");
			return false;
		}

		this.meetings[meetingIndex] = {
			...this.meetings[meetingIndex],
			...updates,
			id: meetingId, // Prevent ID changes
			updatedAt: new Date().toISOString(),
		};

		this.saveMeetings();
		return true;
	}

	/**
	 * Delete a meeting
	 * @param {number} meetingId - Meeting ID
	 * @returns {boolean} Success status
	 */
	deleteMeeting(meetingId) {
		const meeting = this.getMeeting(meetingId);
		if (!meeting) {
			NotificationComponent.show("Meeting not found", "error");
			return false;
		}

		this.meetings = this.meetings.filter((m) => m.id !== meetingId);
		this.saveMeetings();

		return true;
	}

	/**
	 * Show modal to create a new meeting
	 */
	showCreateMeetingModal() {
		ModalComponent.form({
			title: "Schedule New Meeting",
			fields: [
				{
					name: "title",
					label: "Meeting Title",
					type: "text",
					required: true,
				},
				{
					name: "date",
					label: "Date",
					type: "date",
					required: true,
					value: new Date().toISOString().split("T")[0],
				},
				{
					name: "time",
					label: "Time",
					type: "time",
					required: true,
					value: "09:00",
				},
				{
					name: "duration",
					label: "Duration (minutes)",
					type: "number",
					value: "60",
				},
				{
					name: "location",
					label: "Location",
					type: "text",
					placeholder: "Conference Room A",
				},
				{
					name: "type",
					label: "Meeting Type",
					type: "select",
					options: [
						{ value: "meeting", label: "Meeting" },
						{ value: "interview", label: "Interview" },
						{ value: "planning", label: "Planning" },
						{ value: "recurring", label: "Recurring" },
						{ value: "training", label: "Training" },
					],
					value: "meeting",
				},
				{
					name: "description",
					label: "Description",
					type: "textarea",
				},
			],
			onSubmit: (data) => {
				this.handleMeetingCreation(data);
			},
		});
	}

	/**
	 * Handle meeting creation from modal
	 * @param {Object} data - Form data from modal
	 */
	handleMeetingCreation(data) {
		const meeting = this.createMeeting(data);
		NotificationComponent.show(
			`Meeting "${meeting.title}" scheduled successfully`,
			"success"
		);
		ModalComponent.close();
	}

	/**
	 * Show modal to edit a meeting
	 * @param {number} meetingId - Meeting ID
	 */
	showEditMeetingModal(meetingId) {
		const meeting = this.getMeeting(meetingId);
		if (!meeting) {
			NotificationComponent.show("Meeting not found", "error");
			return;
		}

		ModalComponent.form({
			title: "Edit Meeting",
			fields: [
				{
					name: "title",
					label: "Meeting Title",
					type: "text",
					required: true,
					value: meeting.title,
				},
				{
					name: "date",
					label: "Date",
					type: "date",
					required: true,
					value: meeting.date,
				},
				{
					name: "time",
					label: "Time",
					type: "time",
					required: true,
					value: meeting.time,
				},
				{
					name: "duration",
					label: "Duration (minutes)",
					type: "number",
					value: meeting.duration.toString(),
				},
				{
					name: "location",
					label: "Location",
					type: "text",
					value: meeting.location,
				},
				{
					name: "type",
					label: "Meeting Type",
					type: "select",
					options: [
						{ value: "meeting", label: "Meeting" },
						{ value: "interview", label: "Interview" },
						{ value: "planning", label: "Planning" },
						{ value: "recurring", label: "Recurring" },
						{ value: "training", label: "Training" },
					],
					value: meeting.type,
				},
				{
					name: "description",
					label: "Description",
					type: "textarea",
					value: meeting.description,
				},
			],
			onSubmit: (data) => {
				if (this.updateMeeting(meetingId, data)) {
					NotificationComponent.show("Meeting updated successfully", "success");
					ModalComponent.close();
				}
			},
		});
	}

	/**
	 * Show delete meeting confirmation
	 * @param {number} meetingId - Meeting ID
	 */
	showDeleteMeetingConfirmation(meetingId) {
		const meeting = this.getMeeting(meetingId);
		if (!meeting) {
			NotificationComponent.show("Meeting not found", "error");
			return;
		}

		ModalComponent.confirm({
			title: "Delete Meeting",
			message: `Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`,
			confirmText: "Delete",
			cancelText: "Cancel",
			onConfirm: () => {
				if (this.deleteMeeting(meetingId)) {
					NotificationComponent.show("Meeting deleted successfully", "success");
					ModalComponent.close();
				}
			},
		});
	}

	/**
	 * Render upcoming meetings widget
	 * @param {string} containerId - Container element ID
	 * @param {number} limit - Maximum number of meetings to show
	 */
	renderUpcomingMeetings(containerId = "upcomingMeetings", limit = 5) {
		const container = document.getElementById(containerId);
		if (!container) return;

		const upcomingMeetings = this.getUpcomingMeetings(14).slice(0, limit);

		if (upcomingMeetings.length === 0) {
			container.innerHTML = `
				<div class="empty-state">
					<p>No upcoming meetings scheduled</p>
					<button class="btn btn-primary btn-sm" onclick="window.studyHallApp.meetingManager.showCreateMeetingModal()">
						Schedule Meeting
					</button>
				</div>
			`;
			return;
		}

		const meetingsHTML = upcomingMeetings
			.map(
				(meeting) => `
			<div class="meeting-item" style="padding: 10px; border-bottom: 1px solid #e1e5e9; cursor: pointer;" 
				onclick="window.studyHallApp.meetingManager.showEditMeetingModal(${
					meeting.id
				})">
				<div style="display: flex; justify-content: space-between; align-items: start;">
					<div>
						<div style="font-weight: 600; color: #333;">${meeting.title}</div>
						<div style="font-size: 12px; color: #666; margin-top: 4px;">
							📅 ${this.formatDate(meeting.date)} at ${meeting.time}
						</div>
						<div style="font-size: 12px; color: #666;">
							⏱️ ${meeting.duration} min • 📍 ${meeting.location}
						</div>
					</div>
					<span class="meeting-type-badge" style="font-size: 11px; padding: 3px 8px; background: #e3f2fd; color: #1976d2; border-radius: 4px;">
						${meeting.type}
					</span>
				</div>
			</div>
		`
			)
			.join("");

		container.innerHTML = `
			<div class="upcoming-meetings-list">
				${meetingsHTML}
			</div>
		`;
	}

	/**
	 * Format date for display
	 * @param {string} dateString - Date in YYYY-MM-DD format
	 * @returns {string} Formatted date string
	 */
	formatDate(dateString) {
		const date = new Date(dateString);
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		today.setHours(0, 0, 0, 0);
		tomorrow.setHours(0, 0, 0, 0);
		date.setHours(0, 0, 0, 0);

		if (date.getTime() === today.getTime()) {
			return "Today";
		} else if (date.getTime() === tomorrow.getTime()) {
			return "Tomorrow";
		} else {
			const options = { month: "short", day: "numeric" };
			return date.toLocaleDateString("en-US", options);
		}
	}

	/**
	 * Get meeting statistics
	 * @returns {Object} Statistics object
	 */
	getMeetingStats() {
		const today = new Date().toISOString().split("T")[0];
		const todaysMeetings = this.getMeetingsByDate(today);
		const upcomingMeetings = this.getUpcomingMeetings(7);

		return {
			total: this.meetings.length,
			today: todaysMeetings.length,
			upcoming: upcomingMeetings.length,
			hoursToday: todaysMeetings.reduce((sum, m) => sum + m.duration, 0) / 60,
		};
	}
}
