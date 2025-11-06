// Dashboard Management System
// Handles dashboard creation, rendering, statistics, and lifecycle management

import { ModalComponent } from "./components/ModalComponent.js";
import { NotificationComponent } from "./components/NotificationComponent.js";

/**
 * DashboardManager
 * Manages all dashboard-related functionality including:
 * - Dashboard CRUD operations
 * - Task/meeting/stats rendering for dashboard views
 * - Daily statistics generation
 * - Dashboard persistence
 */
export class DashboardManager {
	/**
	 * @param {Object} dependencies - Required dependencies
	 * @param {Object} dependencies.authSystem - Authentication system
	 * @param {Object} dependencies.taskManager - Task management system
	 * @param {Array} dependencies.tasks - Legacy tasks array
	 * @param {Array} dependencies.meetings - Meetings array
	 */
	constructor(dependencies) {
		this.authSystem = dependencies.authSystem;
		this.taskManager = dependencies.taskManager;
		this.tasks = dependencies.tasks; // Legacy support
		this.meetings = dependencies.meetings;

		// Initialize dashboards
		this.dashboards = this.loadDashboards();
		this.dailyStats = this.generateDailyStats();
	}

	// ========================
	// DASHBOARD PERSISTENCE
	// ========================

	/**
	 * Load dashboards from localStorage
	 * @returns {Array} Array of dashboard objects
	 */
	loadDashboards() {
		try {
			const saved = localStorage.getItem("study-hall-dashboards");
			if (saved) {
				const dashboards = JSON.parse(saved);
				console.log("✅ Loaded dashboards from localStorage:", dashboards);
				return dashboards;
			}
		} catch (error) {
			console.warn("⚠️ Failed to load dashboards from localStorage:", error);
		}

		// Return default dashboards if nothing saved or error occurred
		return [
			{ id: "dashboard", name: "Overview", icon: "📊" },
			{ id: "projects", name: "HR Projects", icon: "📋" },
			{ id: "reports", name: "Analytics", icon: "📈" },
		];
	}

	/**
	 * Save dashboards to localStorage
	 */
	saveDashboards() {
		try {
			localStorage.setItem(
				"study-hall-dashboards",
				JSON.stringify(this.dashboards)
			);
			console.log("✅ Dashboards saved to localStorage");
		} catch (error) {
			console.warn("⚠️ Failed to save dashboards to localStorage:", error);
		}
	}

	/**
	 * Get all dashboards
	 * @returns {Array} Array of dashboard objects
	 */
	getAllDashboards() {
		return this.dashboards;
	}

	/**
	 * Get dashboard by ID
	 * @param {string} id - Dashboard ID
	 * @returns {Object|null} Dashboard object or null if not found
	 */
	getDashboard(id) {
		return this.dashboards.find((d) => d.id === id) || null;
	}

	// ========================
	// DASHBOARD CREATION
	// ========================

	/**
	 * Show modal to create a new dashboard
	 */
	showCreateDashboardModal() {
		console.log("📊 showCreateDashboardModal called");

		const formFields = [
			{
				type: "text",
				name: "name",
				label: "Dashboard Name *",
				placeholder: "e.g., Team Performance, Q4 Metrics",
				required: true,
			},
			{
				type: "textarea",
				name: "description",
				label: "Description",
				placeholder: "Brief description of what this dashboard will track...",
				rows: 3,
			},
			{
				type: "select",
				name: "icon",
				label: "Icon",
				options: [
					{ value: "📊", label: "📊 Charts" },
					{ value: "📈", label: "📈 Analytics" },
					{ value: "📋", label: "📋 Tasks" },
					{ value: "👥", label: "👥 People" },
					{ value: "💼", label: "💼 Business" },
					{ value: "🎯", label: "🎯 Goals" },
					{ value: "⚡", label: "⚡ Performance" },
					{ value: "🔍", label: "🔍 Insights" },
					{ value: "💰", label: "💰 Finance" },
					{ value: "📅", label: "📅 Calendar" },
				],
			},
			{
				type: "select",
				name: "template",
				label: "Template",
				options: [
					{ value: "blank", label: "Blank Dashboard" },
					{ value: "analytics", label: "Analytics Template" },
					{ value: "team", label: "Team Management" },
					{ value: "project", label: "Project Overview" },
					{ value: "hr", label: "HR Metrics" },
				],
			},
		];

		ModalComponent.form({
			title: "Create New Dashboard",
			fields: formFields,
			onSubmit: (formData) => {
				this.handleDashboardCreation(formData);
			},
		});
	}

	/**
	 * Handle dashboard creation from form data
	 * @param {Object} formData - Form data from modal
	 */
	handleDashboardCreation(formData) {
		const dashboardData = {
			id: `dashboard-${Date.now()}`,
			name: formData.name ? formData.name.trim() : "",
			description: formData.description ? formData.description.trim() : "",
			icon: formData.icon || "📊",
			template: formData.template || "blank",
			createdAt: new Date().toISOString(),
			widgets: [],
		};

		// Validate required fields
		if (!dashboardData.name) {
			NotificationComponent.show("Dashboard name is required", "error");
			return;
		}

		// Create the dashboard
		this.createDashboard(dashboardData);

		NotificationComponent.show("Dashboard created successfully!", "success");

		return dashboardData;
	}

	/**
	 * Create a new dashboard
	 * @param {Object} dashboardData - Dashboard configuration
	 */
	createDashboard(dashboardData) {
		// Add to dashboards array
		this.dashboards.push(dashboardData);

		// Save to localStorage
		this.saveDashboards();

		console.log("✅ Dashboard created:", dashboardData);

		return dashboardData;
	}

	/**
	 * Delete a dashboard
	 * @param {string} dashboardId - Dashboard ID to delete
	 */
	deleteDashboard(dashboardId) {
		const index = this.dashboards.findIndex((d) => d.id === dashboardId);

		if (index === -1) {
			NotificationComponent.show("Dashboard not found", "error");
			return false;
		}

		// Remove from array
		this.dashboards.splice(index, 1);

		// Save to localStorage
		this.saveDashboards();

		NotificationComponent.show("Dashboard deleted successfully", "success");

		return true;
	}

	/**
	 * Update dashboard properties
	 * @param {string} dashboardId - Dashboard ID
	 * @param {Object} updates - Properties to update
	 */
	updateDashboard(dashboardId, updates) {
		const dashboard = this.getDashboard(dashboardId);

		if (!dashboard) {
			NotificationComponent.show("Dashboard not found", "error");
			return false;
		}

		// Update properties
		Object.assign(dashboard, updates, {
			updatedAt: new Date().toISOString(),
		});

		// Save to localStorage
		this.saveDashboards();

		console.log("✅ Dashboard updated:", dashboard);

		return dashboard;
	}

	// ========================
	// STATISTICS GENERATION
	// ========================

	/**
	 * Generate daily statistics for the current user
	 * @returns {Object} Statistics object
	 */
	generateDailyStats() {
		const currentUser = this.authSystem?.getCurrentUser();
		const today = new Date().toISOString().split("T")[0];

		// Get user's tasks
		const userTasks = this.tasks.filter(
			(task) => task.assigneeEmail === currentUser?.email
		);

		// Get today's meetings
		const todaysMeetings = this.meetings.filter(
			(meeting) =>
				meeting.date === today && meeting.attendees.includes(currentUser?.name)
		);

		// Calculate stats
		const completedTasks = userTasks.filter(
			(task) => task.status === "completed"
		).length;
		const pendingTasks = userTasks.filter(
			(task) => task.status === "pending"
		).length;
		const overdueTasks = userTasks.filter(
			(task) =>
				task.dueDate &&
				new Date(task.dueDate) < new Date() &&
				task.status !== "completed"
		).length;

		const todayHours =
			todaysMeetings.reduce((total, meeting) => total + meeting.duration, 0) /
			60;

		return {
			tasksCompleted: completedTasks,
			tasksPending: pendingTasks,
			tasksOverdue: overdueTasks,
			meetingsToday: todaysMeetings.length,
			hoursInMeetings: Math.round(todayHours * 10) / 10,
			totalTasks: userTasks.length,
		};
	}

	/**
	 * Refresh daily statistics
	 */
	refreshDailyStats() {
		this.dailyStats = this.generateDailyStats();
		return this.dailyStats;
	}

	// ========================
	// DASHBOARD RENDERING
	// ========================

	/**
	 * Render the main dashboard view
	 */
	renderDashboard() {
		try {
			console.log("📊 Rendering dashboard components...");

			// Render all dashboard components
			this.renderMyTasks();
			this.renderUpcomingMeetings();
			this.renderDailyStats();

			console.log("✅ Dashboard rendered successfully!");
		} catch (error) {
			console.error("❌ Error rendering dashboard:", error);
			console.error("Stack:", error.stack);
		}
	}

	/**
	 * Render user's tasks on dashboard
	 */
	renderMyTasks() {
		const currentUser = this.authSystem?.getCurrentUser();
		const container = document.getElementById("myTasksContainer");

		if (!container || !currentUser) return;

		// Get user's tasks sorted by most recent
		const userTasks = this.tasks
			.filter((task) => task.assigneeEmail === currentUser.email)
			.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

		if (userTasks.length === 0) {
			container.innerHTML = `
				<div class="empty-state">
					<p>No tasks assigned to you yet.</p>
					<button class="btn btn-primary" onclick="studyHallApp.showTaskModal()">
						Create Your First Task
					</button>
				</div>
			`;
			return;
		}

		container.innerHTML = userTasks
			.map(
				(task) => `
			<div class="task-item ${task.status}" data-task-id="${task.id}">
				<div class="task-header">
					<div class="task-title-section">
						<button class="task-status-btn" onclick="studyHallApp.toggleTaskStatus(${
							task.id
						})" 
								title="${
									task.status === "completed"
										? "Mark as pending"
										: "Mark as completed"
								}">
							${task.status === "completed" ? "✅" : "⭕"}
						</button>
						<div class="task-details">
							<div class="task-title">${task.title}</div>
							${
								task.description
									? `<div class="task-description">${task.description}</div>`
									: ""
							}
						</div>
					</div>
					<div class="task-actions">
						<span class="task-priority priority-${task.priority}">${task.priority}</span>
						<button class="task-action-btn" onclick="studyHallApp.showTaskModal(${
							task.id
						})" title="Edit task">
							✏️
						</button>
						<button class="task-action-btn" onclick="studyHallApp.deleteTask(${
							task.id
						})" title="Delete task">
							🗑️
						</button>
					</div>
				</div>
				<div class="task-meta">
					${task.dueDate ? `<span class="task-due-date">Due: ${task.dueDate}</span>` : ""}
					<span class="task-assignee">Assigned to: ${
						task.assignee || task.assigneeName
					}</span>
				</div>
			</div>
		`
			)
			.join("");
	}

	/**
	 * Render upcoming meetings on dashboard
	 */
	renderUpcomingMeetings() {
		const currentUser = this.authSystem?.getCurrentUser();
		const container = document.getElementById("meetingsContainer");

		if (!container || !currentUser) return;

		// Get upcoming meetings (next 7 days) where user is attending
		const today = new Date();
		const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

		const upcomingMeetings = this.meetings
			.filter((meeting) => {
				const meetingDate = new Date(meeting.date);
				return (
					meetingDate >= today &&
					meetingDate <= nextWeek &&
					meeting.attendees.includes(currentUser.name)
				);
			})
			.sort(
				(a, b) =>
					new Date(a.date + " " + a.time) - new Date(b.date + " " + b.time)
			)
			.slice(0, 5); // Show only next 5 meetings

		if (upcomingMeetings.length === 0) {
			container.innerHTML = `
				<div class="empty-state">
					<p>No upcoming meetings this week.</p>
				</div>
			`;
			return;
		}

		container.innerHTML = upcomingMeetings
			.map(
				(meeting) => `
			<div class="meeting-item">
				<div class="meeting-header">
					<div class="meeting-title">${meeting.title}</div>
					<div class="meeting-time">${meeting.time}</div>
				</div>
				<div class="meeting-info">
					<div class="meeting-date">${new Date(meeting.date).toLocaleDateString()}</div>
					<div class="meeting-location">📍 ${meeting.location}</div>
					<div class="meeting-attendees">👥 ${meeting.attendees.length} attendees</div>
					<span class="meeting-type ${meeting.type}">${meeting.type}</span>
				</div>
			</div>
		`
			)
			.join("");
	}

	/**
	 * Render daily statistics widget
	 */
	renderDailyStats() {
		const container = document.getElementById("dailyStats");
		const stats = this.dailyStats;

		if (!container) return;

		container.innerHTML = `
			<div class="stats-grid">
				<div class="stat-card tasks-completed">
					<div class="stat-number">${stats.tasksCompleted}</div>
					<div class="stat-label">Completed</div>
				</div>
				<div class="stat-card">
					<div class="stat-number">${stats.tasksPending}</div>
					<div class="stat-label">Pending</div>
				</div>
				<div class="stat-card tasks-overdue">
					<div class="stat-number">${stats.tasksOverdue}</div>
					<div class="stat-label">Overdue</div>
				</div>
				<div class="stat-card meetings">
					<div class="stat-number">${stats.meetingsToday}</div>
					<div class="stat-label">Meetings Today</div>
				</div>
			</div>
		`;
	}

	// ========================
	// DASHBOARD OPTIONS (TODO Implementation)
	// ========================

	/**
	 * Show dashboard options menu
	 * @param {string} dashboardId - Dashboard ID
	 * @param {Event} event - Click event for menu positioning
	 */
	showDashboardOptionsMenu(dashboardId, event) {
		const dashboard = this.getDashboard(dashboardId);

		if (!dashboard) {
			NotificationComponent.show("Dashboard not found", "error");
			return;
		}

		const ModalComponent = window.ModalComponent;
		if (!ModalComponent) return;

		// Check if this is the default dashboard
		const isDefault = dashboard.isDefault || false;

		ModalComponent.menu({
			title: dashboard.name,
			options: [
				{
					label: "Rename",
					icon: "✏️",
					action: () => this.showRenameDashboardModal(dashboardId),
				},
				{
					label: "Duplicate",
					icon: "📋",
					action: () => {
						const duplicated = this.duplicateDashboard(dashboardId);
						if (duplicated && this.app) {
							// Refresh dashboard list in sidebar
							if (this.app.navigationComponent) {
								this.app.navigationComponent.renderDashboardsList();
							}
						}
					},
				},
				{
					label: isDefault ? "Default Dashboard" : "Set as Default",
					icon: "⭐",
					action: () => {
						if (!isDefault) {
							this.setDefaultDashboard(dashboardId);
						}
					},
					disabled: isDefault,
				},
				{
					label: "Export",
					icon: "📤",
					action: () => this.exportDashboard(dashboardId),
				},
				{
					label: "Delete",
					icon: "🗑️",
					action: () => this.showDeleteDashboardConfirmation(dashboardId),
					danger: true,
				},
			],
			position: event ? { x: event.clientX, y: event.clientY } : null,
		});
	}

	/**
	 * Show rename dashboard modal
	 * @param {string} dashboardId - Dashboard ID
	 */
	showRenameDashboardModal(dashboardId) {
		const dashboard = this.getDashboard(dashboardId);

		if (!dashboard) {
			NotificationComponent.show("Dashboard not found", "error");
			return;
		}

		const ModalComponent = window.ModalComponent;
		if (!ModalComponent) return;

		ModalComponent.form({
			title: "Rename Dashboard",
			fields: [
				{
					name: "name",
					label: "Dashboard Name",
					type: "text",
					value: dashboard.name,
					required: true,
					placeholder: "Enter dashboard name",
				},
			],
			submitText: "Rename",
			onSubmit: (data) => {
				if (!data.name || data.name.trim() === "") {
					NotificationComponent.show("Please enter a dashboard name", "error");
					return;
				}

				const updated = this.renameDashboard(dashboardId, data.name.trim());

				if (updated) {
					// Refresh dashboard list in sidebar
					if (this.app && this.app.navigationComponent) {
						this.app.navigationComponent.renderDashboardsList();
					}

					// Update page title if this is the current view
					if (this.app && this.app.currentView === dashboardId) {
						const pageTitle = document.getElementById("pageTitle");
						if (pageTitle) {
							pageTitle.textContent = data.name.trim();
						}
					}

					ModalComponent.close();
				}
			},
		});
	}

	/**
	 * Show delete dashboard confirmation
	 * @param {string} dashboardId - Dashboard ID
	 */
	showDeleteDashboardConfirmation(dashboardId) {
		const dashboard = this.getDashboard(dashboardId);

		if (!dashboard) {
			NotificationComponent.show("Dashboard not found", "error");
			return;
		}

		// Prevent deleting the default dashboard
		if (dashboard.isDefault) {
			NotificationComponent.show(
				"Cannot delete the default dashboard. Set another dashboard as default first.",
				"error"
			);
			return;
		}

		const ModalComponent = window.ModalComponent;
		if (!ModalComponent) return;

		ModalComponent.confirm({
			title: "Delete Dashboard",
			message: `Are you sure you want to delete "${dashboard.name}"? This action cannot be undone.`,
			confirmText: "Delete",
			cancelText: "Cancel",
			onConfirm: () => {
				const deleted = this.deleteDashboard(dashboardId);

				if (deleted) {
					// Refresh dashboard list in sidebar
					if (this.app && this.app.navigationComponent) {
						this.app.navigationComponent.renderDashboardsList();
					}

					// Navigate to main dashboard if we deleted the current view
					if (this.app && this.app.currentView === dashboardId) {
						this.app.showView("dashboard");
					}

					ModalComponent.close();
				}
			},
		});
	}

	/**
	 * Set dashboard as default
	 * @param {string} dashboardId - Dashboard ID
	 */
	setDefaultDashboard(dashboardId) {
		const dashboard = this.getDashboard(dashboardId);

		if (!dashboard) {
			NotificationComponent.show("Dashboard not found", "error");
			return;
		}

		// Remove default flag from all dashboards
		this.dashboards.forEach((d) => {
			d.isDefault = false;
		});

		// Set this dashboard as default
		dashboard.isDefault = true;
		this.saveDashboards();

		NotificationComponent.show(
			`"${dashboard.name}" set as default dashboard`,
			"success"
		);

		// Refresh dashboard list in sidebar
		if (this.app && this.app.navigationComponent) {
			this.app.navigationComponent.renderDashboardsList();
		}
	}

	/**
	 * Export dashboard configuration
	 * @param {string} dashboardId - Dashboard ID
	 */
	exportDashboard(dashboardId) {
		const dashboard = this.getDashboard(dashboardId);

		if (!dashboard) {
			NotificationComponent.show("Dashboard not found", "error");
			return;
		}

		try {
			const exportData = {
				...dashboard,
				exportedAt: new Date().toISOString(),
				version: "1.0",
			};

			const dataStr = JSON.stringify(exportData, null, 2);
			const dataBlob = new Blob([dataStr], { type: "application/json" });
			const url = URL.createObjectURL(dataBlob);

			const link = document.createElement("a");
			link.href = url;
			link.download = `${dashboard.name
				.replace(/\s+/g, "-")
				.toLowerCase()}-dashboard.json`;
			link.click();

			URL.revokeObjectURL(url);

			NotificationComponent.show(
				`Dashboard "${dashboard.name}" exported successfully`,
				"success"
			);
		} catch (error) {
			console.error("Error exporting dashboard:", error);
			NotificationComponent.show("Failed to export dashboard", "error");
		}
	}

	/**
	 * Duplicate a dashboard
	 * @param {string} dashboardId - Dashboard ID to duplicate
	 */
	duplicateDashboard(dashboardId) {
		const dashboard = this.getDashboard(dashboardId);

		if (!dashboard) {
			NotificationComponent.show("Dashboard not found", "error");
			return null;
		}

		const duplicatedDashboard = {
			...dashboard,
			id: `dashboard-${Date.now()}`,
			name: `${dashboard.name} (Copy)`,
			createdAt: new Date().toISOString(),
		};

		this.dashboards.push(duplicatedDashboard);
		this.saveDashboards();

		NotificationComponent.show("Dashboard duplicated successfully!", "success");

		return duplicatedDashboard;
	}

	/**
	 * Rename a dashboard
	 * @param {string} dashboardId - Dashboard ID
	 * @param {string} newName - New dashboard name
	 */
	renameDashboard(dashboardId, newName) {
		return this.updateDashboard(dashboardId, { name: newName });
	}
}
