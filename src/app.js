// The Study Hall App - Main Application Logic
// Handles routing, navigation, and app state management

import { authSystem } from "./auth.js";
import { UserManager } from "./userManager.js";
import { PermissionsManager } from "./permissionsManager.js";
import { HierarchyManager } from "./hierarchyManager.js";
import { DashboardManager } from "./dashboardManager.js";
import { SpaceManager } from "./spaceManager.js";
import { MeetingManager } from "./meetingManager.js";
import { DocumentManager } from "./documentManager.js";
import { DocumentUIManager } from "./documentUIManager.js";
import { TaskManager } from "./taskManager.js";
import { TaskUIManager } from "./taskUIManager.js";
import { AdminUIManager } from "./adminUIManager.js";
import { ModalComponent } from "./components/ModalComponent.js";
import { NotificationComponent } from "./components/NotificationComponent.js";
import { ViewManagerComponent } from "./components/ViewManagerComponent.js";
import { NavigationComponent } from "./components/NavigationComponent.js";

export class StudyHallApp {
	constructor() {
		this.currentView = "dashboard";
		this.sidebarCollapsed = false;
		this.sectionStates = {
			favorites: true,
			dashboards: true,
			documentation: true,
			spaces: true,
		};

		// Initialize management systems with proper dependency injection
		this.authSystem = authSystem;

		// Initialize managers with proper dependencies
		this.userManager = new UserManager(this.authSystem);
		this.permissionsManager = new PermissionsManager(this.authSystem);
		this.hierarchyManager = new HierarchyManager(
			this.authSystem,
			this.userManager
		);
		this.documentManager = new DocumentManager(
			this.authSystem,
			this.permissionsManager
		);

		// Initialize task management system
		this.taskManager = new TaskManager(
			this.authSystem,
			this.userManager,
			this.permissionsManager
		);

		// Legacy task management (will be replaced by TaskManager)
		this.tasks = this.loadTasks();
		this.taskIdCounter = this.getNextTaskId();

		// Initialize meeting management system
		this.meetingManager = new MeetingManager({
			authSystem: this.authSystem,
		});

		// Expose meetings for backward compatibility
		this.meetings = this.meetingManager.getAllMeetings();

		// Initialize dashboard management system
		this.dashboardManager = new DashboardManager({
			authSystem: this.authSystem,
			taskManager: this.taskManager,
			tasks: this.tasks, // Legacy support
			meetings: this.meetings,
		});

		// Expose dashboards for backward compatibility
		this.dashboards = this.dashboardManager.getAllDashboards();
		this.dailyStats = this.dashboardManager.dailyStats;

		// Initialize space management system (will receive navigationManager after DOM ready)
		this.spaceManager = null;

		// UI managers will be initialized after DOM is ready
		this.documentUIManager = null;
		this.taskUIManager = null;
		this.adminUIManager = null;

		// Initialize ViewManagerComponent for routing
		this.viewManager = null;

		// Initialize NavigationComponent for sidebar management
		this.navigationManager = null;

		// Legacy documentation management (will be replaced by DocumentManager)
		this.documents = this.loadDocuments();
		this.policies = this.loadPolicies();
		this.trainings = this.loadTrainings();
		this.templates = this.loadTemplates();

		this.init();
	}

	// ========================
	// DASHBOARD METHODS (Delegated to DashboardManager)
	// ========================

	/**
	 * Load dashboards - DEPRECATED: Use dashboardManager instead
	 * Kept for backward compatibility
	 */
	loadDashboards() {
		console.warn(
			"⚠️ loadDashboards() is deprecated. Use dashboardManager.loadDashboards()"
		);
		return this.dashboardManager?.loadDashboards() || [];
	}

	/**
	 * Save dashboards - DEPRECATED: Use dashboardManager instead
	 */
	saveDashboards() {
		console.warn(
			"⚠️ saveDashboards() is deprecated. Use dashboardManager.saveDashboards()"
		);
		this.dashboardManager?.saveDashboards();
	}

	/**
	 * Generate daily stats - Delegated to DashboardManager
	 */
	generateDailyStats() {
		return (
			this.dashboardManager?.generateDailyStats() || {
				tasksCompleted: 0,
				tasksPending: 0,
				tasksOverdue: 0,
				meetingsToday: 0,
				hoursInMeetings: 0,
				totalTasks: 0,
			}
		);
	}

	/**
	 * Render dashboard - Delegated to DashboardManager
	 */
	renderDashboard() {
		this.dashboardManager?.renderDashboard();
	}

	/**
	 * Render my tasks - Delegated to DashboardManager
	 */
	renderMyTasks() {
		this.dashboardManager?.renderMyTasks();
	}

	/**
	 * Render upcoming meetings - Delegated to MeetingManager
	 */
	renderUpcomingMeetings() {
		this.meetingManager?.renderUpcomingMeetings();
	}

	/**
	 * Render daily stats - Delegated to DashboardManager
	 */
	renderDailyStats() {
		this.dashboardManager?.renderDailyStats();
	}

	/**
	 * Show create dashboard modal - Delegated to DashboardManager
	 */
	showCreateDashboardModal() {
		this.dashboardManager?.showCreateDashboardModal();
	}

	/**
	 * Handle dashboard creation - Delegated to DashboardManager
	 */
	handleDashboardCreation(formData) {
		const dashboard = this.dashboardManager?.handleDashboardCreation(formData);
		if (dashboard) {
			// Update local reference for backward compatibility
			this.dashboards = this.dashboardManager.getAllDashboards();
			// Refresh navigation to show new dashboard
			this.navigationManager?.refresh();
		}
		return dashboard;
	}

	/**
	 * Create dashboard - Delegated to DashboardManager
	 */
	createDashboard(dashboardData) {
		const dashboard = this.dashboardManager?.createDashboard(dashboardData);
		if (dashboard) {
			// Update local reference for backward compatibility
			this.dashboards = this.dashboardManager.getAllDashboards();
		}
		return dashboard;
	}

	/**
	 * Delete dashboard - Delegated to DashboardManager
	 */
	deleteDashboard(dashboardId) {
		const result = this.dashboardManager?.deleteDashboard(dashboardId);
		if (result) {
			// Update local reference for backward compatibility
			this.dashboards = this.dashboardManager.getAllDashboards();
			// Refresh navigation
			this.navigationManager?.refresh();
		}
		return result;
	}

	// ========================
	// MEETING MANAGEMENT DELEGATION METHODS
	// ========================

	/**
	 * Load meetings - Delegated to MeetingManager
	 */
	loadMeetings() {
		return this.meetingManager?.getAllMeetings() || [];
	}

	/**
	 * Get all meetings - Delegated to MeetingManager
	 */
	getAllMeetings() {
		return this.meetingManager?.getAllMeetings() || [];
	}

	/**
	 * Get meeting by ID - Delegated to MeetingManager
	 */
	getMeeting(meetingId) {
		return this.meetingManager?.getMeeting(meetingId);
	}

	/**
	 * Create meeting - Delegated to MeetingManager
	 */
	createMeeting(meetingData) {
		const meeting = this.meetingManager?.createMeeting(meetingData);
		if (meeting) {
			// Update local reference for backward compatibility
			this.meetings = this.meetingManager.getAllMeetings();
		}
		return meeting;
	}

	/**
	 * Update meeting - Delegated to MeetingManager
	 */
	updateMeeting(meetingId, updates) {
		const result = this.meetingManager?.updateMeeting(meetingId, updates);
		if (result) {
			// Update local reference for backward compatibility
			this.meetings = this.meetingManager.getAllMeetings();
		}
		return result;
	}

	/**
	 * Delete meeting - Delegated to MeetingManager
	 */
	deleteMeeting(meetingId) {
		const result = this.meetingManager?.deleteMeeting(meetingId);
		if (result) {
			// Update local reference for backward compatibility
			this.meetings = this.meetingManager.getAllMeetings();
		}
		return result;
	}

	/**
	 * Show create meeting modal - Delegated to MeetingManager
	 */
	showCreateMeetingModal() {
		this.meetingManager?.showCreateMeetingModal();
	}

	/**
	 * Show edit meeting modal - Delegated to MeetingManager
	 */
	showEditMeetingModal(meetingId) {
		this.meetingManager?.showEditMeetingModal(meetingId);
	}

	// ========================
	// TASK MANAGEMENT METHODS
	// ========================

	// Task management methods
	loadTasks() {
		try {
			const saved = localStorage.getItem("study-hall-tasks");
			if (saved) {
				const tasks = JSON.parse(saved);
				console.log("Loaded tasks from localStorage:", tasks);
				return tasks;
			}
		} catch (error) {
			console.warn("Failed to load tasks from localStorage:", error);
		}

		// Return default tasks if none saved
		return [
			{
				id: 1,
				title: "Review candidate applications",
				description:
					"Review and process new job applications for the development team",
				assignee: "Sarah Johnson",
				assigneeEmail: "hr@studyhall.com",
				dueDate: "2025-11-06",
				priority: "high",
				status: "pending",
				category: "HR",
				createdAt: "2025-11-05T10:00:00Z",
				createdBy: "Admin User",
			},
			{
				id: 2,
				title: "Update job descriptions",
				description:
					"Revise and update job descriptions for all technical positions",
				assignee: "Mike Chen",
				assigneeEmail: "manager@studyhall.com",
				dueDate: "2025-11-10",
				priority: "medium",
				status: "pending",
				category: "Operations",
				createdAt: "2025-11-05T09:30:00Z",
				createdBy: "Admin User",
			},
		];
	}

	saveTasks() {
		try {
			localStorage.setItem("study-hall-tasks", JSON.stringify(this.tasks));
			console.log("Tasks saved to localStorage");
		} catch (error) {
			console.warn("Failed to save tasks to localStorage:", error);
		}
	}

	getNextTaskId() {
		const maxId = this.tasks.reduce((max, task) => Math.max(max, task.id), 0);
		return maxId + 1;
	}

	// ========================
	// DOCUMENTATION MANAGEMENT METHODS
	// ========================

	// Documentation management methods
	loadDocuments() {
		try {
			const saved = localStorage.getItem("study-hall-documents");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load documents from localStorage:", error);
		}

		// Return default documents
		return [
			{
				id: 1,
				title: "Employee Handbook",
				category: "hr-policies",
				type: "PDF",
				description:
					"Comprehensive guide covering all company policies, procedures, and benefits",
				author: "HR Department",
				lastModified: "2025-10-15",
				tags: ["policies", "onboarding", "benefits"],
				content: `# Employee Handbook\n\n## Welcome to The Study Hall\n\nThis handbook contains important information about our company policies...`,
				icon: "📚",
			},
			{
				id: 2,
				title: "Remote Work Policy",
				category: "hr-policies",
				type: "Document",
				description: "Guidelines and requirements for remote work arrangements",
				author: "Sarah Johnson",
				lastModified: "2025-11-01",
				tags: ["remote", "policy", "flexibility"],
				content: `# Remote Work Policy\n\n## Overview\n\nThe Study Hall supports flexible work arrangements...`,
				icon: "🏠",
			},
			{
				id: 3,
				title: "Onboarding Checklist",
				category: "procedures",
				type: "Checklist",
				description: "Step-by-step process for new employee onboarding",
				author: "HR Department",
				lastModified: "2025-10-28",
				tags: ["onboarding", "checklist", "new-hire"],
				content: `# New Employee Onboarding Checklist\n\n## Pre-Start\n- [ ] Send welcome email\n- [ ] Prepare workspace...`,
				icon: "✅",
			},
			{
				id: 4,
				title: "IT Setup Guide",
				category: "procedures",
				type: "Guide",
				description: "Technical setup instructions for new employees",
				author: "IT Department",
				lastModified: "2025-10-20",
				tags: ["IT", "setup", "technical"],
				content: `# IT Setup Guide\n\n## Equipment Assignment\n\n1. Laptop Configuration\n2. Software Installation...`,
				icon: "💻",
			},
			{
				id: 5,
				title: "Performance Review Process",
				category: "procedures",
				type: "Process",
				description: "Annual performance review procedures and timeline",
				author: "HR Department",
				lastModified: "2025-09-15",
				tags: ["performance", "review", "evaluation"],
				content: `# Performance Review Process\n\n## Timeline\n\nQuarterly check-ins and annual reviews...`,
				icon: "📊",
			},
		];
	}

	loadPolicies() {
		try {
			const saved = localStorage.getItem("study-hall-policies");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load policies from localStorage:", error);
		}

		return [
			{
				id: 1,
				title: "Code of Conduct",
				description:
					"Professional behavior standards and ethical guidelines for all employees",
				status: "active",
				lastUpdated: "2025-10-01",
				version: "2.1",
				category: "Ethics & Compliance",
				icon: "⚖️",
			},
			{
				id: 2,
				title: "Data Privacy Policy",
				description:
					"Guidelines for handling sensitive company and customer data",
				status: "active",
				lastUpdated: "2025-09-15",
				version: "1.3",
				category: "Security",
				icon: "🔒",
			},
			{
				id: 3,
				title: "Leave of Absence Policy",
				description:
					"Procedures for requesting and managing various types of leave",
				status: "active",
				lastUpdated: "2025-08-20",
				version: "1.8",
				category: "HR Policies",
				icon: "🏖️",
			},
			{
				id: 4,
				title: "Equipment Usage Policy",
				description: "Guidelines for company equipment use and maintenance",
				status: "draft",
				lastUpdated: "2025-11-03",
				version: "2.0-draft",
				category: "IT Policies",
				icon: "🖥️",
			},
			{
				id: 5,
				title: "Social Media Policy",
				description: "Professional social media usage guidelines",
				status: "active",
				lastUpdated: "2025-07-10",
				version: "1.2",
				category: "Communications",
				icon: "📱",
			},
		];
	}

	loadTrainings() {
		try {
			const saved = localStorage.getItem("study-hall-trainings");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load trainings from localStorage:", error);
		}

		return [
			{
				id: 1,
				title: "New Employee Orientation",
				description:
					"Comprehensive introduction to company culture, values, and basic procedures",
				duration: "4 hours",
				type: "Interactive",
				lastUpdated: "2025-10-15",
				completions: 45,
				icon: "🎯",
			},
			{
				id: 2,
				title: "Data Security Awareness",
				description:
					"Essential cybersecurity practices and threat awareness training",
				duration: "2 hours",
				type: "Online Course",
				lastUpdated: "2025-11-01",
				completions: 52,
				icon: "🛡️",
			},
			{
				id: 3,
				title: "Leadership Development",
				description:
					"Management skills and leadership principles for team leads and managers",
				duration: "6 hours",
				type: "Workshop",
				lastUpdated: "2025-09-20",
				completions: 18,
				icon: "👑",
			},
		];
	}

	loadTemplates() {
		try {
			const saved = localStorage.getItem("study-hall-templates");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.warn("Failed to load templates from localStorage:", error);
		}

		return [
			{
				id: 1,
				title: "Job Description Template",
				type: "Word Document",
				description: "Standardized format for creating job descriptions",
				category: "HR",
				icon: "📝",
			},
			{
				id: 2,
				title: "Performance Review Form",
				type: "PDF Form",
				description: "Annual performance evaluation template",
				category: "HR",
				icon: "📋",
			},
		];
	}

	saveDocuments() {
		try {
			localStorage.setItem(
				"study-hall-documents",
				JSON.stringify(this.documents)
			);
		} catch (error) {
			console.error("Failed to save documents:", error);
		}
	}

	savePolicies() {
		try {
			localStorage.setItem(
				"study-hall-policies",
				JSON.stringify(this.policies)
			);
		} catch (error) {
			console.error("Failed to save policies:", error);
		}
	}

	saveTrainings() {
		try {
			localStorage.setItem(
				"study-hall-trainings",
				JSON.stringify(this.trainings)
			);
		} catch (error) {
			console.error("Failed to save trainings:", error);
		}
	}

	saveTemplates() {
		try {
			localStorage.setItem(
				"study-hall-templates",
				JSON.stringify(this.templates)
			);
		} catch (error) {
			console.error("Failed to save templates:", error);
		}
	}

	// ========================
	// DOCUMENTATION RENDERING METHODS
	// ========================

	// Documentation rendering methods
	renderDocuments(category = "all") {
		const container = document.getElementById("docsList");
		if (!container) return;

		let filteredDocs = this.documents;
		if (category !== "all") {
			filteredDocs = this.documents.filter((doc) => doc.category === category);
		}

		if (filteredDocs.length === 0) {
			container.innerHTML = `
				<div class="empty-state">
					<p>No documents found in this category.</p>
					<button class="btn btn-primary" onclick="studyHallApp.showCreateDocumentModal()">
						Create First Document
					</button>
				</div>
			`;
			return;
		}

		container.innerHTML = filteredDocs
			.map(
				(doc) => `
			<div class="document-item" onclick="studyHallApp.openDocument(${doc.id})">
				<div class="document-icon">${doc.icon}</div>
				<div class="document-info">
					<div class="document-title">${doc.title}</div>
					<div class="document-meta">
						<span>By ${doc.author}</span>
						<span>Modified ${new Date(doc.lastModified).toLocaleDateString()}</span>
						<span>${doc.type}</span>
					</div>
					<div class="document-description">${doc.description}</div>
					<div class="document-category">${this.getCategoryName(doc.category)}</div>
				</div>
				<div class="document-actions">
					<button class="doc-action-btn" onclick="event.stopPropagation(); studyHallApp.editDocument(${
						doc.id
					})" title="Edit">
						✏️
					</button>
					<button class="doc-action-btn" onclick="event.stopPropagation(); studyHallApp.shareDocument(${
						doc.id
					})" title="Share">
						🔗
					</button>
					<button class="doc-action-btn" onclick="event.stopPropagation(); studyHallApp.deleteDocument(${
						doc.id
					})" title="Delete">
						🗑️
					</button>
				</div>
			</div>
		`
			)
			.join("");
	}

	renderPolicies() {
		const container = document.getElementById("policiesGrid");
		if (!container) return;

		container.innerHTML = this.policies
			.map(
				(policy) => `
			<div class="policy-card" onclick="studyHallApp.openPolicy(${policy.id})">
				<div class="policy-header">
					<div class="policy-icon">${policy.icon}</div>
					<div class="policy-title">${policy.title}</div>
				</div>
				<div class="policy-description">${policy.description}</div>
				<div class="policy-meta">
					<span>v${policy.version}</span>
					<span class="policy-status ${policy.status}">${policy.status}</span>
				</div>
			</div>
		`
			)
			.join("");
	}

	renderTrainings() {
		const container = document.getElementById("trainingGrid");
		if (!container) return;

		container.innerHTML = this.trainings
			.map(
				(training) => `
			<div class="training-card" onclick="studyHallApp.openTraining(${training.id})">
				<div class="training-thumbnail">${training.icon}</div>
				<div class="training-content">
					<div class="training-title">${training.title}</div>
					<div class="training-description">${training.description}</div>
					<div class="training-meta">
						<span>${training.completions} completed</span>
						<span class="training-duration">${training.duration}</span>
					</div>
				</div>
			</div>
		`
			)
			.join("");
	}

	renderTemplates() {
		const container = document.getElementById("templatesGrid");
		if (!container) return;

		container.innerHTML = this.templates
			.map(
				(template) => `
			<div class="template-card">
				<div class="template-icon">${template.icon}</div>
				<div class="template-title">${template.title}</div>
				<div class="template-type">${template.type}</div>
				<div class="template-actions">
					<button class="btn btn-sm btn-primary" onclick="studyHallApp.useTemplate(${template.id})">
						Use Template
					</button>
					<button class="btn btn-sm" onclick="studyHallApp.editTemplate(${template.id})">
						Edit
					</button>
				</div>
			</div>
		`
			)
			.join("");
	}

	// Documentation interaction methods
	openDocument(docId) {
		const doc = this.documents.find((d) => d.id === docId);
		if (!doc) return;

		const viewer = document.getElementById("docsViewer");
		const content = document.getElementById("viewerContent");
		const docsList = document.getElementById("docsList").parentElement;

		// Hide docs list and show viewer
		docsList.style.display = "none";
		viewer.style.display = "flex";

		// Render document content (markdown-like)
		content.innerHTML = `
			<div class="document-header">
				<h1>${doc.title}</h1>
				<div class="document-meta">
					<span><strong>Author:</strong> ${doc.author}</span>
					<span><strong>Last Modified:</strong> ${new Date(
						doc.lastModified
					).toLocaleDateString()}</span>
					<span><strong>Type:</strong> ${doc.type}</span>
					<span><strong>Category:</strong> ${this.getCategoryName(doc.category)}</span>
				</div>
			</div>
			<div class="document-body">
				${this.formatDocumentContent(doc.content)}
			</div>
		`;
	}

	closeDocumentViewer() {
		const viewer = document.getElementById("docsViewer");
		const docsList = document.getElementById("docsList").parentElement;

		viewer.style.display = "none";
		docsList.style.display = "flex";
	}

	formatDocumentContent(content) {
		// Simple markdown-like formatting
		return content
			.replace(/^# (.*$)/gm, "<h1>$1</h1>")
			.replace(/^## (.*$)/gm, "<h2>$1</h2>")
			.replace(/^### (.*$)/gm, "<h3>$1</h3>")
			.replace(
				/^\- \[([ x])\] (.*$)/gm,
				'<div class="checkbox-item"><input type="checkbox" $1 disabled> $2</div>'
			)
			.replace(/^\- (.*$)/gm, "<li>$1</li>")
			.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
			.replace(/\*(.*?)\*/g, "<em>$1</em>")
			.replace(/\n/g, "<br>");
	}

	getCategoryName(category) {
		const categories = {
			all: "All Documents",
			"hr-policies": "HR Policies",
			procedures: "Procedures",
			training: "Training",
			templates: "Templates",
		};
		return categories[category] || category;
	}

	// Documentation category filtering
	filterDocuments(category) {
		// Update active category
		document.querySelectorAll(".docs-category").forEach((cat) => {
			cat.classList.remove("active");
		});
		document
			.querySelector(`[data-category="${category}"]`)
			.classList.add("active");

		// Update breadcrumb
		const breadcrumb = document.getElementById("docsBreadcrumb");
		breadcrumb.innerHTML = `
			<span class="breadcrumb-item">Knowledge Base</span>
			<span class="breadcrumb-item active">${this.getCategoryName(category)}</span>
		`;

		// Render filtered documents
		this.renderDocuments(category);
	}

	// Documentation search functionality
	searchDocuments(searchTerm) {
		const container = document.getElementById("docsList");
		if (!container) return;

		if (!searchTerm.trim()) {
			// If search is empty, show all documents
			this.renderDocuments();
			return;
		}

		// Filter documents based on search term
		const filteredDocs = this.documents.filter(
			(doc) =>
				doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
				doc.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
				doc.tags.some((tag) =>
					tag.toLowerCase().includes(searchTerm.toLowerCase())
				)
		);

		if (filteredDocs.length === 0) {
			container.innerHTML = `
				<div class="empty-state">
					<p>No documents found matching "${searchTerm}"</p>
					<button class="btn btn-primary" onclick="studyHallApp.clearSearch()">
						Clear Search
					</button>
				</div>
			`;
			return;
		}

		// Render search results
		container.innerHTML = filteredDocs
			.map(
				(doc) => `
			<div class="document-item" onclick="studyHallApp.openDocument(${doc.id})">
				<div class="document-icon">${doc.icon}</div>
				<div class="document-info">
					<div class="document-title">${this.highlightSearchTerm(
						doc.title,
						searchTerm
					)}</div>
					<div class="document-meta">
						<span>By ${doc.author}</span>
						<span>Modified ${new Date(doc.lastModified).toLocaleDateString()}</span>
						<span>${doc.type}</span>
					</div>
					<div class="document-description">${this.highlightSearchTerm(
						doc.description,
						searchTerm
					)}</div>
					<div class="document-category">${this.getCategoryName(doc.category)}</div>
				</div>
				<div class="document-actions">
					<button class="doc-action-btn" onclick="event.stopPropagation(); studyHallApp.editDocument(${
						doc.id
					})" title="Edit">
						✏️
					</button>
					<button class="doc-action-btn" onclick="event.stopPropagation(); studyHallApp.shareDocument(${
						doc.id
					})" title="Share">
						🔗
					</button>
					<button class="doc-action-btn" onclick="event.stopPropagation(); studyHallApp.deleteDocument(${
						doc.id
					})" title="Delete">
						🗑️
					</button>
				</div>
			</div>
		`
			)
			.join("");

		// Update breadcrumb to show search results
		const breadcrumb = document.getElementById("docsBreadcrumb");
		breadcrumb.innerHTML = `
			<span class="breadcrumb-item">Knowledge Base</span>
			<span class="breadcrumb-item active">Search Results (${filteredDocs.length})</span>
		`;
	}

	highlightSearchTerm(text, searchTerm) {
		if (!searchTerm.trim()) return text;
		const regex = new RegExp(`(${searchTerm})`, "gi");
		return text.replace(regex, "<mark>$1</mark>");
	}

	clearSearch() {
		const searchInput = document.getElementById("docsSearchInput");
		if (searchInput) {
			searchInput.value = "";
		}
		this.renderDocuments();
	}

	// Placeholder methods for document actions
	showCreateDocumentModal() {
		this.showNotification("Document creation coming soon!", "info");
	}

	editDocument(docId) {
		this.showNotification("Document editing coming soon!", "info");
	}

	shareDocument(docId) {
		this.showNotification("Document sharing coming soon!", "info");
	}

	deleteDocument(docId) {
		if (confirm("Are you sure you want to delete this document?")) {
			this.documents = this.documents.filter((d) => d.id !== docId);
			this.saveDocuments();
			this.renderDocuments();
			this.showNotification("Document deleted successfully!", "success");
		}
	}

	printDocument() {
		window.print();
	}

	openPolicy(policyId) {
		this.showNotification("Policy viewer coming soon!", "info");
	}

	openTraining(trainingId) {
		this.showNotification("Training viewer coming soon!", "info");
	}

	useTemplate(templateId) {
		this.showNotification("Template usage coming soon!", "info");
	}

	editTemplate(templateId) {
		this.showNotification("Template editing coming soon!", "info");
	}

	showCreatePolicyModal() {
		this.showNotification("Policy creation coming soon!", "info");
	}

	showCreateTrainingModal() {
		this.showNotification("Training creation coming soon!", "info");
	}

	showCreateTemplateModal() {
		this.showNotification("Template creation coming soon!", "info");
	}

	init() {
		console.log("StudyHallApp initializing...");

		try {
			// Initialize authentication and user info
			console.log("1. Initializing user...");
			this.initializeUser();

			// Initialize document management UI
			console.log("2. Initializing document manager...");
			this.initializeDocumentManager();

			// Initialize task management UI
			console.log("3. Initializing task manager...");
			this.initializeTaskManager();

			// Initialize ViewManagerComponent for routing
			console.log("4. Initializing view manager...");
			this.initializeViewManager();

			// Initialize NavigationComponent for sidebar management
			console.log("5. Initializing navigation manager...");
			this.initializeNavigationManager();

			console.log("6. Binding events...");
			this.bindEvents();

			console.log("7. Handling initial route...");
			this.handleInitialRoute();

			console.log("8. Updating page title...");
			this.updatePageTitle();

			console.log("9. Initializing section states...");
			this.initializeSectionStates();

			console.log("10. Initializing saved dashboards...");
			this.initializeSavedDashboards();

			// Render the dashboard when app initializes
			console.log("11. Rendering dashboard...");
			this.renderDashboard();

			console.log("StudyHallApp initialized successfully!");
		} catch (error) {
			console.error("Error during StudyHallApp initialization:", error);
			console.error("Error stack:", error.stack);

			// Try to render dashboard anyway
			try {
				console.log("Attempting fallback dashboard render...");
				this.renderDashboard();
			} catch (dashboardError) {
				console.error("Dashboard render also failed:", dashboardError);
			}
		}
	}

	bindEvents() {
		// Note: Sidebar navigation is now handled by NavigationComponent
		// Note: Sidebar toggle and section toggles are now handled by NavigationComponent

		// Create dashboard button
		const createDashboard = document.getElementById("createDashboard");
		console.log("Create dashboard button found:", createDashboard);
		if (createDashboard) {
			createDashboard.addEventListener("click", () => {
				console.log("Create dashboard button clicked!");
				this.createNewDashboard();
			});
		} else {
			console.error("Create dashboard button not found!");
		}

		// Add dashboard button
		const addDashboard = document.getElementById("addDashboard");
		console.log("Add dashboard button found:", addDashboard);
		if (addDashboard) {
			addDashboard.addEventListener("click", () => {
				console.log("Add dashboard button clicked!");
				this.createNewDashboard();
			});
		}

		// Add space button
		const addSpace = document.getElementById("addSpace");
		if (addSpace) {
			addSpace.addEventListener("click", () => this.createNewSpace());
		}

		// Item options buttons
		document.addEventListener("click", (e) => {
			if (e.target.classList.contains("item-options")) {
				e.preventDefault();
				e.stopPropagation();
				this.showItemOptions(e.target);
			}
		});

		// Workspace dropdown
		const workspaceDropdown = document.querySelector(".workspace-dropdown");
		if (workspaceDropdown) {
			workspaceDropdown.addEventListener("click", () =>
				this.showWorkspaceMenu()
			);
		}

		// Handle browser back/forward
		window.addEventListener("popstate", (e) => {
			if (e.state && e.state.view) {
				this.showView(e.state.view, false);
			}
		});

		// View toggles for tasks (list/board view)
		const viewToggles = document.querySelectorAll(".view-toggle");
		viewToggles.forEach((toggle) => {
			toggle.addEventListener("click", (e) => {
				this.handleViewToggle(e.target);
			});
		});

		// Handle responsive sidebar on window resize
		window.addEventListener("resize", () => {
			this.handleResize();
		});

		// Documentation search
		const docsSearchInput = document.getElementById("docsSearchInput");
		if (docsSearchInput) {
			docsSearchInput.addEventListener("input", (e) => {
				this.searchDocuments(e.target.value);
			});
		}
	}

	initializeSectionStates() {
		// Set initial section states
		Object.keys(this.sectionStates).forEach((sectionName) => {
			const isExpanded = this.sectionStates[sectionName];
			const sectionContent = document.querySelector(
				`[data-section-content="${sectionName}"]`
			);
			const sectionToggle = document.querySelector(
				`[data-section="${sectionName}"]`
			);

			if (sectionContent && sectionToggle) {
				if (isExpanded) {
					sectionContent.classList.remove("collapsed");
					sectionToggle.classList.remove("collapsed");
				} else {
					sectionContent.classList.add("collapsed");
					sectionToggle.classList.add("collapsed");
				}
			}
		});
	}

	initializeSavedDashboards() {
		// Create views and sidebar entries for any custom dashboards that don't have the default IDs
		const defaultIds = ["dashboard", "projects", "reports"];
		const customDashboards = this.dashboards.filter(
			(d) => !defaultIds.includes(d.id)
		);

		customDashboards.forEach((dashboard) => {
			// Create the dashboard view
			this.createDashboardView(dashboard);

			// Add to sidebar navigation
			this.addDashboardToSidebar(dashboard);
		});

		console.log(
			`Initialized ${customDashboards.length} saved custom dashboards`
		);
	}

	// Authentication and User Management Methods
	initializeUser() {
		// Check if user is authenticated
		if (!this.authSystem.isAuthenticated()) {
			console.log("User not authenticated, redirecting to login");
			window.location.href = "login.html";
			return;
		}

		// Get current user and update UI
		const user = this.authSystem.getCurrentUser();
		if (user) {
			this.updateUserInterface(user);
			this.bindUserMenuEvents();
			this.applyRoleBasedVisibility(user);

			// Initialize admin UI manager for admin users
			if (
				this.permissionsManager.hasPermission("admin") ||
				user.role === "SpongeLord"
			) {
				try {
					this.adminUIManager = new AdminUIManager(
						this.authSystem,
						this.userManager,
						this.permissionsManager,
						this.hierarchyManager
					);

					// Make admin UI globally accessible for onclick handlers
					window.adminUI = this.adminUIManager;
					console.log("Admin UI Manager initialized for:", user.name);
				} catch (error) {
					console.error("Failed to initialize AdminUIManager:", error);
					this.adminUIManager = null;
				}
			}
		}

		console.log("User initialized:", user?.name);
	}

	initializeDocumentManager() {
		// Set the app reference for the document manager
		this.documentManager.setApp(this);

		// Initialize Document UI Manager
		this.documentUIManager = new DocumentUIManager(this.documentManager, this);
		// Make document UI globally accessible for onclick handlers
		window.documentUIManager = this.documentUIManager;
		console.log("Document Manager and UI initialized");
	}

	initializeTaskManager() {
		// Initialize Task UI Manager
		this.taskUIManager = new TaskUIManager(
			this.taskManager,
			this.authSystem,
			this.userManager
		);
		// Make task UI globally accessible for onclick handlers
		window.taskUIManager = this.taskUIManager;
		console.log("Task Manager and UI initialized");
	}

	initializeViewManager() {
		try {
			// Initialize ViewManagerComponent with routes and view-specific logic
			this.viewManager = new ViewManagerComponent({
				container: "#contentArea",
				defaultView: "dashboard",
				transition: "fade",
				transitionDuration: 200,
				onViewChange: (newView, oldView) => {
					// Permission checks before view change
					if (!this.permissionsManager.canAccessFeature(newView)) {
						this.showNotification(
							"Access denied. You don't have permission to access this feature.",
							"error"
						);
						return false; // Cancel navigation
					}

					// Additional admin view checks
					const adminViews = ["roles", "users", "audit", "settings"];
					if (
						adminViews.includes(newView) &&
						!this.permissionsManager.hasPermission("admin")
					) {
						this.showNotification(
							"Access denied. Administrator privileges required.",
							"error"
						);
						return false; // Cancel navigation
					}

					return true; // Allow navigation
				},
				onViewLoad: (viewName) => {
					// Handle view-specific rendering after view is shown
					this.handleViewSpecificLogic(viewName);
					this.updatePageTitle(viewName);
				},
			});

			console.log("ViewManager initialized");
		} catch (error) {
			console.error("Failed to initialize ViewManager:", error);
			console.warn("App will continue without ViewManager");
		}
	}

	// Initialize NavigationComponent for sidebar management
	initializeNavigationManager() {
		try {
			// Small delay to ensure DOM is fully ready
			setTimeout(() => {
				this.navigationManager = new NavigationComponent({
					container: "#sidebar",
					sections: ["favorites", "dashboards", "documentation", "spaces"],
					initialStates: this.sectionStates,
					onNavigate: (view) => {
						// Delegate to ViewManager for navigation
						if (this.viewManager) {
							this.viewManager.navigateToView(view);
						} else {
							// Fallback to legacy navigation
							this.navigateToView(view);
						}
					},
					onSectionToggle: (sectionName, isExpanded) => {
						// Update app section states
						this.sectionStates[sectionName] = isExpanded;
						this.saveSectionStates();
					},
					onAddDashboard: () => {
						this.showAddDashboardModal();
					},
					onAddSpace: () => {
						this.showAddSpaceModal();
					},
					onItemOptions: (itemId, itemType, event) => {
						this.handleNavigationItemOptions(itemId, itemType, event);
					},
				});

				// Initialize SpaceManager now that navigationManager is available
				this.spaceManager = new SpaceManager({
					authSystem: this.authSystem,
					navigationManager: this.navigationManager,
				});

				console.log("NavigationManager initialized");
				console.log("SpaceManager initialized");
			}, 100); // Small delay to ensure DOM is fully ready
		} catch (error) {
			console.error("Failed to initialize NavigationManager:", error);
			console.warn("App will continue without NavigationManager");
		}
	}

	handleViewSpecificLogic(viewName) {
		// Handle view-specific rendering
		if (viewName === "tasks") {
			this.renderTasks();
		} else if (viewName === "docs") {
			// Use enhanced document management
			if (this.documentUIManager) {
				this.documentUIManager.enhanceDocumentsView();
			} else {
				// Fallback to legacy system
				this.renderDocuments();
				// Set up category click handlers
				document.querySelectorAll(".docs-category").forEach((category) => {
					category.addEventListener("click", () => {
						const categoryType = category.dataset.category;
						this.filterDocuments(categoryType);
					});
				});
			}
		} else if (viewName === "policies") {
			this.renderPolicies();
		} else if (viewName === "training") {
			this.renderTrainings();
		} else if (viewName === "templates") {
			this.renderTemplates();
		} else if (viewName === "users" && this.adminUIManager) {
			// Enhanced user management view
			this.adminUIManager.enhanceUsersView();
		}
	}

	// Handle navigation item options (dashboard/space options)
	handleNavigationItemOptions(itemId, itemType, event) {
		if (itemType === "dashboard") {
			this.showDashboardOptions(itemId, event);
		} else if (itemType === "space") {
			this.showSpaceOptions(itemId, event);
		}
	}

	// Show dashboard options menu
	showDashboardOptions(dashboardId, event) {
		// TODO: Implement dashboard options menu
		console.log("Dashboard options for:", dashboardId);
	}

	// Show space options menu - Delegated to SpaceManager
	showSpaceOptions(spaceId, event) {
		this.spaceManager?.showSpaceOptionsMenu(spaceId, event);
	}

	// Show add dashboard modal
	showAddDashboardModal() {
		ModalComponent.form({
			title: "Add Dashboard",
			fields: [
				{ name: "name", label: "Dashboard Name", type: "text", required: true },
				{ name: "icon", label: "Icon", type: "text", placeholder: "📊" },
				{ name: "description", label: "Description", type: "textarea" },
			],
			onSubmit: (data) => {
				this.addDashboard(data);
			},
		});
	}

	// Show add space modal - Delegated to SpaceManager
	showAddSpaceModal() {
		this.spaceManager?.showCreateSpaceModal();
	}

	// Add dashboard helper
	addDashboard(dashboardData) {
		const dashboard = {
			id: `dashboard-${Date.now()}`,
			name: dashboardData.name,
			icon: dashboardData.icon || "📊",
			description: dashboardData.description || "",
		};

		this.dashboards.push(dashboard);
		this.saveDashboards();

		// Add to navigation
		if (this.navigationManager) {
			this.navigationManager.addDashboard(dashboard);
		}

		NotificationComponent.show(
			`Dashboard "${dashboard.name}" added successfully`,
			"success"
		);
	}

	// Add space helper - Delegated to SpaceManager
	addSpace(spaceData) {
		return this.spaceManager?.createSpace(spaceData);
	}

	updateUserInterface(user) {
		// Update user info in topbar
		const userInfo = document.getElementById("userInfo");
		const userDetails = document.getElementById("userDetails");

		if (userInfo) {
			userInfo.innerHTML = `
				<span class="user-name">${user.name}</span>
				<span class="user-role">${user.role}</span>
			`;
		}

		if (userDetails) {
			userDetails.innerHTML = `
				<div class="user-name">${user.name}</div>
				<div class="user-email">${user.email}</div>
			`;
		}
	}

	bindUserMenuEvents() {
		// User menu toggle
		const userMenuBtn = document.getElementById("userMenuBtn");
		const userDropdown = document.getElementById("userDropdown");

		if (userMenuBtn && userDropdown) {
			userMenuBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.toggleUserMenu();
			});

			// Close dropdown when clicking outside
			document.addEventListener("click", (e) => {
				if (
					!userMenuBtn.contains(e.target) &&
					!userDropdown.contains(e.target)
				) {
					this.closeUserMenu();
				}
			});
		}

		// Logout button
		const logoutBtn = document.getElementById("logoutBtn");
		if (logoutBtn) {
			logoutBtn.addEventListener("click", (e) => {
				e.preventDefault();
				this.handleLogout();
			});
		}

		// Account Settings button
		const accountSettingsBtn = document.getElementById("accountSettingsBtn");
		if (accountSettingsBtn) {
			accountSettingsBtn.addEventListener("click", (e) => {
				e.preventDefault();
				this.closeUserMenu();
				this.showAccountSettingsModal();
			});
		}

		// Preferences button
		const preferencesBtn = document.getElementById("preferencesBtn");
		if (preferencesBtn) {
			preferencesBtn.addEventListener("click", (e) => {
				e.preventDefault();
				this.closeUserMenu();
				this.showPreferencesModal();
			});
		}
	}

	toggleUserMenu() {
		const userDropdown = document.getElementById("userDropdown");
		if (userDropdown) {
			const isVisible = userDropdown.style.display !== "none";
			userDropdown.style.display = isVisible ? "none" : "block";
		}
	}

	closeUserMenu() {
		const userDropdown = document.getElementById("userDropdown");
		if (userDropdown) {
			userDropdown.style.display = "none";
		}
	}

	handleLogout() {
		if (confirm("Are you sure you want to sign out?")) {
			console.log("User logging out...");
			this.authSystem.logout();
		}
	}

	// ========================
	// SIMPLE DOCUMENTS VIEW (for documents-view)
	// ========================

	/**
	 * Render simple documents view with card-based grid layout
	 * @param {string} [category="all"] - Category to filter by ("all", "hr_policies", "company_policies", "training", "templates")
	 */
	renderSimpleDocuments(category = "all") {
		const container = document.getElementById("simpleDocumentsGrid");
		const emptyState = document.getElementById("documentsEmptyState");

		if (!container) return;

		// Get documents from DocumentManager
		let documents = this.documentManager.getAllDocuments();

		// Filter by category if needed
		if (category !== "all") {
			documents = documents.filter((doc) => doc.category === category);
		}

		// Show empty state if no documents
		if (documents.length === 0) {
			container.style.display = "none";
			if (emptyState) emptyState.style.display = "block";
			return;
		}

		// Hide empty state and show grid
		container.style.display = "grid";
		if (emptyState) emptyState.style.display = "none";

		// Render document cards
		container.innerHTML = documents
			.map(
				(doc) => `
			<div class="document-card" style="background: white; border: 1px solid #e1e5e9; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s ease;" 
				onclick="studyHallApp.viewSimpleDocument(${doc.id})"
				onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.1)'; this.style.borderColor='#007bff';"
				onmouseout="this.style.transform='none'; this.style.boxShadow='none'; this.style.borderColor='#e1e5e9';">
				<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
					<div style="display: flex; align-items: center; gap: 10px;">
						<span style="font-size: 24px;">${doc.icon || "📄"}</span>
						<div>
							<div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 4px;">${
								doc.title
							}</div>
							<span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; background: ${this.getStatusColor(
								doc.status
							)}; color: white;">
								${doc.status}
							</span>
						</div>
					</div>
					<button class="item-options" onclick="event.stopPropagation(); studyHallApp.showDocumentOptions(${
						doc.id
					}, event)" style="background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px 8px; color: #666;">
						⋯
					</button>
				</div>
				<div style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
					${doc.description || "No description"}
				</div>
				<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;">
					${
						doc.tags
							? doc.tags
									.slice(0, 3)
									.map(
										(tag) =>
											`<span style="padding: 3px 8px; background: #e3f2fd; color: #1976d2; border-radius: 12px; font-size: 11px; font-weight: 500;">${tag}</span>`
									)
									.join("")
							: ""
					}
				</div>
				<div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #999;">
					<span>By ${doc.author}</span>
					<span>${new Date(doc.dateCreated).toLocaleDateString()}</span>
				</div>
			</div>
		`
			)
			.join("");
	}

	/**
	 * Get color for document status badge
	 * @param {string} status - Document status ("published", "draft", "pending_approval", "archived")
	 * @returns {string} Hex color code
	 */
	getStatusColor(status) {
		const colors = {
			published: "#28a745",
			draft: "#ffc107",
			pending_approval: "#dc3545",
			archived: "#6c757d",
		};
		return colors[status] || "#6c757d";
	}

	/**
	 * Filter documents by category and update tab styling
	 * @param {string} category - Category to filter by
	 */
	filterDocumentsByCategory(category) {
		// Update active tab styling
		document.querySelectorAll(".doc-tab").forEach((tab) => {
			tab.style.borderBottom = "none";
			tab.style.fontWeight = "normal";
			tab.style.color = "#666";
			tab.style.marginBottom = "0";
		});

		event.target.style.borderBottom = "2px solid #007bff";
		event.target.style.fontWeight = "600";
		event.target.style.color = "#007bff";
		event.target.style.marginBottom = "-2px";

		// Render filtered documents
		this.renderSimpleDocuments(category);
	}

	/**
	 * View document details in a modal viewer
	 * @param {number} id - Document ID
	 */
	viewSimpleDocument(id) {
		const document = this.documentManager.getDocumentById(id);
		if (!document) {
			this.showNotification("Document not found", "error");
			return;
		}

		// Record view
		this.documentManager.recordDocumentView(id);

		// Show document viewer modal
		const ModalComponent = window.ModalComponent;
		if (!ModalComponent) return;

		ModalComponent.custom({
			title: document.title,
			content: `
				<div style="max-height: 70vh; overflow-y: auto;">
					<div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e1e5e9;">
						<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
							<span style="font-size: 32px;">${document.icon || "📄"}</span>
							<div>
								<span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: ${this.getStatusColor(
									document.status
								)}; color: white;">
									${document.status}
								</span>
								<div style="font-size: 14px; color: #666; margin-top: 4px;">
									By ${document.author} • ${new Date(document.dateCreated).toLocaleDateString()}
								</div>
							</div>
						</div>
						${
							document.description
								? `<p style="color: #666; margin: 10px 0;">${document.description}</p>`
								: ""
						}
						${
							document.tags && document.tags.length > 0
								? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;">${document.tags
										.map(
											(tag) =>
												`<span style="padding: 3px 8px; background: #e3f2fd; color: #1976d2; border-radius: 12px; font-size: 11px;">${tag}</span>`
										)
										.join("")}</div>`
								: ""
						}
					</div>
					<div style="line-height: 1.6; font-size: 16px; color: #333; white-space: pre-wrap;">
						${document.content || "No content available"}
					</div>
					<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9; display: flex; gap: 10px; justify-content: flex-end;">
						<button class="btn btn-outline" onclick="studyHallApp.downloadDocument(${id})">
							<span class="btn-icon">📥</span>
							Download
						</button>
						<button class="btn btn-outline" onclick="window.ModalComponent.close(); studyHallApp.shareDocument(${id})">
							<span class="btn-icon">🔗</span>
							Share
						</button>
						<button class="btn btn-primary" onclick="window.ModalComponent.close(); studyHallApp.editDocument(${id})">
							<span class="btn-icon">✏️</span>
							Edit
						</button>
					</div>
				</div>
			`,
		});
	}

	/**
	 * Show document options context menu
	 * @param {number} id - Document ID
	 * @param {Event} event - Click event for menu positioning
	 */
	showDocumentOptions(id, event) {
		const document = this.documentManager.getDocumentById(id);
		if (!document) return;

		const ModalComponent = window.ModalComponent;
		if (!ModalComponent) return;

		ModalComponent.menu({
			title: document.title,
			options: [
				{
					label: "View",
					icon: "👁️",
					action: () => this.viewSimpleDocument(id),
				},
				{
					label: "Edit",
					icon: "✏️",
					action: () => this.editDocument(id),
				},
				{
					label: "Share",
					icon: "🔗",
					action: () => this.shareDocument(id),
				},
				{
					label: "Download",
					icon: "📥",
					action: () => this.downloadDocument(id),
				},
				{
					label: "Delete",
					icon: "🗑️",
					action: () => this.deleteSimpleDocument(id),
					danger: true,
				},
			],
			position: event ? { x: event.clientX, y: event.clientY } : null,
		});
	}

	/**
	 * Delete document with confirmation
	 * @param {number} id - Document ID
	 */
	deleteSimpleDocument(id) {
		const document = this.documentManager.getDocumentById(id);
		if (!document) {
			this.showNotification("Document not found", "error");
			return;
		}

		const ModalComponent = window.ModalComponent;
		if (!ModalComponent) return;

		ModalComponent.confirm({
			title: "Delete Document",
			message: `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
			confirmText: "Delete",
			cancelText: "Cancel",
			onConfirm: () => {
				try {
					this.documentManager.deleteDocument(id);
					this.showNotification("Document deleted successfully", "success");
					this.renderSimpleDocuments();
					ModalComponent.close();
				} catch (error) {
					console.error("Error deleting document:", error);
					this.showNotification("Failed to delete document", "error");
				}
			},
		});
	}

	/**
	 * Download document (delegates to DocumentUIManager)
	 * @param {number} id - Document ID
	 */
	downloadDocument(id) {
		if (this.documentUIManager) {
			this.documentUIManager.downloadDocument(id);
		}
	}

	/**
	 * Show create document modal (delegates to DocumentUIManager)
	 */
	showCreateDocumentModal() {
		if (this.documentUIManager) {
			this.documentUIManager.showCreateDocumentModal();
		}
	}

	/**
	 * Show template selection modal (delegates to DocumentUIManager)
	 */
	showTemplateSelectionModal() {
		if (this.documentUIManager) {
			this.documentUIManager.showTemplateSelectionModal();
		}
	}

	/**
	 * Edit document (delegates to DocumentUIManager)
	 * @param {number} id - Document ID
	 */
	editDocument(id) {
		if (this.documentUIManager) {
			this.documentUIManager.editDocument(id);
		}
	}

	/**
	 * Share document (delegates to DocumentUIManager)
	 * @param {number} id - Document ID
	 */
	shareDocument(id) {
		if (this.documentUIManager) {
			this.documentUIManager.shareDocument(id);
		}
	}

	// Role-Based Access Control
	applyRoleBasedVisibility(user) {
		const adminSection = document.getElementById("adminSection");

		// Use the new permissions manager to check admin access
		const hasAdminAccess =
			this.permissionsManager.hasPermission("admin") ||
			this.permissionsManager.hasPermission("hr");

		// Show/hide admin section based on permissions
		if (adminSection) {
			if (hasAdminAccess) {
				adminSection.style.display = "block";
				console.log(`Admin section visible for user: ${user.name}`);
			} else {
				adminSection.style.display = "none";
				console.log(`Admin section hidden for user: ${user.name}`);
			}
		}

		// Update navigation based on available features
		this.updateNavigationVisibility();

		console.log("User permissions applied:", user.permissions);
	}

	updateNavigationVisibility() {
		// Get available navigation items based on permissions
		const availableNavItems = this.permissionsManager.getAvailableNavItems();

		// Update sidebar navigation
		const navItems = document.querySelectorAll(".nav-item[data-view]");
		navItems.forEach((navItem) => {
			const viewName = navItem.dataset.view;
			const isAvailable = availableNavItems.some(
				(item) => item.id === viewName
			);

			if (isAvailable) {
				navItem.style.display = "flex";
			} else {
				navItem.style.display = "none";
			}
		});
	}

	getRolePermissions(role) {
		const permissions = {
			"HR Manager": {
				canManageUsers: true,
				canManageRoles: true,
				canViewAuditLogs: true,
				canManageSystemSettings: true,
				canAccessAdminPanel: true,
				canCreateUsers: true,
				canDeleteUsers: true,
				canExportData: true,
			},
			"HR Specialist": {
				canManageUsers: false,
				canManageRoles: false,
				canViewAuditLogs: false,
				canManageSystemSettings: false,
				canAccessAdminPanel: false,
				canCreateUsers: false,
				canDeleteUsers: false,
				canExportData: true,
			},
			"Department Manager": {
				canManageUsers: false,
				canManageRoles: false,
				canViewAuditLogs: false,
				canManageSystemSettings: false,
				canAccessAdminPanel: false,
				canCreateUsers: false,
				canDeleteUsers: false,
				canExportData: false,
			},
			Employee: {
				canManageUsers: false,
				canManageRoles: false,
				canViewAuditLogs: false,
				canManageSystemSettings: false,
				canAccessAdminPanel: false,
				canCreateUsers: false,
				canDeleteUsers: false,
				canExportData: false,
			},
		};

		return permissions[role] || permissions["Employee"];
	}

	hasPermission(permission) {
		return this.permissionsManager.hasPermission(permission);
	}

	// Navigation with permission checking
	navigateToView(viewName) {
		// Delegate to ViewManagerComponent for unified routing
		if (this.viewManager) {
			this.viewManager.navigateToView(viewName);
		} else {
			// Fallback for initialization period
			console.warn("ViewManager not initialized, using fallback navigation");
			this.legacyNavigateToView(viewName);
		}
	}

	legacyNavigateToView(viewName) {
		// Legacy navigation logic (kept as fallback)
		// Check if user has permission to access specific features
		if (!this.permissionsManager.canAccessFeature(viewName)) {
			this.showNotification(
				"Access denied. You don't have permission to access this feature.",
				"error"
			);
			return;
		}

		// Additional admin view checks
		const adminViews = ["roles", "users", "audit", "settings"];
		if (
			adminViews.includes(viewName) &&
			!this.permissionsManager.hasPermission("admin")
		) {
			this.showNotification(
				"Access denied. Administrator privileges required.",
				"error"
			);
			return;
		}

		// Proceed with normal navigation
		this.showView(viewName);
	}

	// Note: toggleSection is now handled by NavigationComponent

	createNewDashboard() {
		console.log("createNewDashboard method called!");
		this.showCreateDashboardModal();
	}

	// Note: showCreateDashboardModal, handleDashboardCreation, createDashboard
	// are now delegated to DashboardManager (see delegation methods above)

	// ========================
	// WORKSPACE & DASHBOARD VIEW GENERATION
	// (These will be refactored in future phases)
	// ========================

	createDashboardView(dashboard) {
		const contentArea = document.getElementById("contentArea");

		// Create dashboard view HTML based on template
		const dashboardHTML = this.generateDashboardHTML(dashboard);

		// Create view element
		const viewElement = document.createElement("div");
		viewElement.className = "view custom-dashboard-view";
		viewElement.id = `${dashboard.id}-view`;
		viewElement.innerHTML = dashboardHTML;

		// Add to content area
		contentArea.appendChild(viewElement);
	}

	generateDashboardHTML(dashboard) {
		const templates = {
			blank: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "Custom dashboard"
					}</p>
					<div class="dashboard-actions">
						<button class="btn btn-primary" onclick="studyHallApp.addWidget('${
							dashboard.id
						}')">+ Add Widget</button>
						<button class="btn btn-secondary" onclick="studyHallApp.editDashboard('${
							dashboard.id
						}')">Edit Dashboard</button>
					</div>
				</div>
				<div class="dashboard-content" id="${dashboard.id}-content">
					<div class="empty-dashboard">
						<div class="empty-icon">📊</div>
						<h3>Your dashboard is ready!</h3>
						<p>Start by adding some widgets to track your data.</p>
						<button class="btn btn-primary" onclick="studyHallApp.addWidget('${
							dashboard.id
						}')">Add Your First Widget</button>
					</div>
				</div>
			`,
			analytics: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "Analytics dashboard"
					}</p>
				</div>
				<div class="dashboard-grid">
					<div class="dashboard-card">
						<h3>Key Metrics</h3>
						<div class="metrics-grid">
							<div class="metric">
								<div class="metric-value">24</div>
								<div class="metric-label">Total Users</div>
							</div>
							<div class="metric">
								<div class="metric-value">89%</div>
								<div class="metric-label">Success Rate</div>
							</div>
						</div>
					</div>
					<div class="dashboard-card">
						<h3>Chart Placeholder</h3>
						<div class="chart-placeholder">📈 Analytics chart will go here</div>
					</div>
				</div>
			`,
			team: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "Team management dashboard"
					}</p>
				</div>
				<div class="dashboard-grid">
					<div class="dashboard-card">
						<h3>Team Overview</h3>
						<p>Team members: 12</p>
						<p>Active projects: 5</p>
						<p>Completed tasks: 89</p>
					</div>
					<div class="dashboard-card">
						<h3>Recent Activity</h3>
						<div class="activity-placeholder">👥 Team activity will be shown here</div>
					</div>
				</div>
			`,
			project: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "Project overview dashboard"
					}</p>
				</div>
				<div class="dashboard-grid">
					<div class="dashboard-card">
						<h3>Project Status</h3>
						<div class="progress-bar">
							<div class="progress-fill" style="width: 65%"></div>
						</div>
						<p>65% Complete</p>
					</div>
					<div class="dashboard-card">
						<h3>Timeline</h3>
						<p>📅 Project timeline and milestones</p>
					</div>
				</div>
			`,
			hr: `
				<div class="dashboard-header">
					<h2>${dashboard.icon} ${dashboard.name}</h2>
					<p class="dashboard-description">${
						dashboard.description || "HR metrics dashboard"
					}</p>
				</div>
				<div class="dashboard-grid">
					<div class="dashboard-card">
						<h3>HR Metrics</h3>
						<div class="hr-stats">
							<div class="stat">
								<span class="stat-number">142</span>
								<span class="stat-label">Employees</span>
							</div>
							<div class="stat">
								<span class="stat-number">8</span>
								<span class="stat-label">Open Positions</span>
							</div>
							<div class="stat">
								<span class="stat-number">95%</span>
								<span class="stat-label">Retention Rate</span>
							</div>
						</div>
					</div>
				</div>
			`,
		};

		return templates[dashboard.template] || templates.blank;
	}

	addDashboardToSidebar(dashboard) {
		const dashboardsSection = document.querySelector(
			'[data-section-content="dashboards"]'
		);

		const listItem = document.createElement("li");
		listItem.innerHTML = `
			<a href="#${dashboard.id}" class="nav-item" data-view="${dashboard.id}">
				<span class="nav-icon">${dashboard.icon}</span>
				<span class="nav-text">${dashboard.name}</span>
				<button class="item-options" title="Dashboard options">⋯</button>
			</a>
		`;

		dashboardsSection.appendChild(listItem);

		// Bind navigation event to new item
		const navItem = listItem.querySelector(".nav-item");
		navItem.addEventListener("click", (e) => {
			e.preventDefault();
			this.navigateToView(dashboard.id);
		});
	}

	closeModal() {
		console.log("closeModal called - delegating to ModalComponent");
		ModalComponent.closeAll();
		this.currentModal = null;
	}

	// Account Settings Modal
	showAccountSettingsModal() {
		// Get current user info
		const user = this.authSystem?.getCurrentUser();

		// Create form sections
		const profileSection = `
			<div class="settings-section">
				<h3>Profile Information</h3>
				<form class="settings-form" id="profileForm">
					<div class="form-row">
						<div class="form-group">
							<label for="fullName">Full Name</label>
							<input type="text" id="fullName" name="fullName" value="${
								user?.name || ""
							}" required>
						</div>
						<div class="form-group">
							<label for="email">Email Address</label>
							<input type="email" id="email" name="email" value="${
								user?.email || ""
							}" readonly>
							<small class="form-help">Email cannot be changed for security reasons</small>
						</div>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label for="role">Role</label>
							<input type="text" id="role" name="role" value="${user?.role || ""}" readonly>
						</div>
						<div class="form-group">
							<label for="department">Department</label>
							<input type="text" id="department" name="department" value="${
								user?.department || ""
							}" readonly>
						</div>
					</div>
				</form>
			</div>

			<div class="settings-section">
				<h3>Security</h3>
				<form class="settings-form" id="securityForm">
					<div class="form-group">
						<label for="currentPassword">Current Password</label>
						<input type="password" id="currentPassword" name="currentPassword" placeholder="Enter current password">
					</div>
					<div class="form-row">
						<div class="form-group">
							<label for="newPassword">New Password</label>
							<input type="password" id="newPassword" name="newPassword" placeholder="Enter new password">
						</div>
						<div class="form-group">
							<label for="confirmPassword">Confirm Password</label>
							<input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm new password">
						</div>
					</div>
					<div class="form-group">
						<label class="checkbox-label">
							<input type="checkbox" id="enableTwoFactor" name="enableTwoFactor">
							<span class="checkbox-custom"></span>
							Enable Two-Factor Authentication (Coming Soon)
						</label>
					</div>
				</form>
			</div>

			<div class="settings-section">
				<h3>Account Actions</h3>
				<div class="action-buttons">
					<button class="btn btn-outline" id="exportDataBtn">
						<span class="btn-icon">📥</span>
						Export My Data
					</button>
					<button class="btn btn-danger" id="deleteAccountBtn">
						<span class="btn-icon">🗑️</span>
						Delete Account
					</button>
				</div>
			</div>
		`;

		// Create modal with custom buttons
		const modal = ModalComponent.show(
			"Account Settings",
			profileSection,
			"account-settings-modal",
			{
				size: "large",
				buttons: [
					{
						text: "Cancel",
						className: "btn-secondary",
						action: () => ModalComponent.closeAll(),
					},
					{
						text: "Save Changes",
						className: "btn-primary",
						action: () => this.saveAccountSettings(),
					},
				],
			}
		);

		// Add custom event handlers after modal is shown
		setTimeout(() => {
			const exportBtn = document.getElementById("exportDataBtn");
			const deleteBtn = document.getElementById("deleteAccountBtn");

			if (exportBtn) {
				exportBtn.addEventListener("click", () => this.exportUserData());
			}

			if (deleteBtn) {
				deleteBtn.addEventListener("click", () => this.handleDeleteAccount());
			}
		}, 100);
	}

	// Preferences Modal
	showPreferencesModal() {
		// Create preferences content
		const preferencesContent = `
			<div class="settings-section">
				<h3>Appearance</h3>
				<div class="preference-group">
					<label>Theme</label>
					<div class="radio-group">
						<label class="radio-label">
							<input type="radio" name="theme" value="dark" checked>
							<span class="radio-custom"></span>
							Dark Mode
						</label>
						<label class="radio-label">
							<input type="radio" name="theme" value="light">
							<span class="radio-custom"></span>
							Light Mode
						</label>
						<label class="radio-label">
							<input type="radio" name="theme" value="auto">
							<span class="radio-custom"></span>
							System Default
						</label>
					</div>
				</div>
				<div class="preference-group">
					<label>Sidebar</label>
					<label class="checkbox-label">
						<input type="checkbox" id="collapseSidebar" name="collapseSidebar">
						<span class="checkbox-custom"></span>
						Start with collapsed sidebar
					</label>
				</div>
			</div>

			<div class="settings-section">
				<h3>Notifications</h3>
				<div class="preference-group">
					<label class="checkbox-label">
						<input type="checkbox" id="emailNotifications" name="emailNotifications" checked>
						<span class="checkbox-custom"></span>
						Email notifications
					</label>
					<label class="checkbox-label">
						<input type="checkbox" id="pushNotifications" name="pushNotifications" checked>
						<span class="checkbox-custom"></span>
						Browser notifications
					</label>
					<label class="checkbox-label">
						<input type="checkbox" id="taskReminders" name="taskReminders" checked>
						<span class="checkbox-custom"></span>
						Task due date reminders
					</label>
					<label class="checkbox-label">
						<input type="checkbox" id="weeklyReports" name="weeklyReports">
						<span class="checkbox-custom"></span>
						Weekly activity reports
					</label>
				</div>
			</div>

			<div class="settings-section">
				<h3>Productivity</h3>
				<div class="preference-group">
					<label for="defaultView">Default Dashboard View</label>
					<select id="defaultView" name="defaultView" class="form-select">
						<option value="dashboard">Overview Dashboard</option>
						<option value="projects">HR Projects</option>
						<option value="tasks">Task List</option>
						<option value="people">People Directory</option>
					</select>
				</div>
				<div class="preference-group">
					<label for="workingHours">Working Hours</label>
					<div class="time-range">
						<select id="startTime" name="startTime" class="form-select">
							<option value="08:00">8:00 AM</option>
							<option value="09:00" selected>9:00 AM</option>
							<option value="10:00">10:00 AM</option>
						</select>
						<span class="time-separator">to</span>
						<select id="endTime" name="endTime" class="form-select">
							<option value="16:00">4:00 PM</option>
							<option value="17:00" selected>5:00 PM</option>
							<option value="18:00">6:00 PM</option>
						</select>
					</div>
				</div>
				<div class="preference-group">
					<label class="checkbox-label">
						<input type="checkbox" id="autoSave" name="autoSave" checked>
						<span class="checkbox-custom"></span>
						Auto-save draft changes
					</label>
				</div>
			</div>

			<div class="settings-section">
				<h3>Language & Region</h3>
				<div class="preference-group">
					<label for="language">Language</label>
					<select id="language" name="language" class="form-select">
						<option value="en" selected>English (US)</option>
						<option value="en-gb">English (UK)</option>
						<option value="es">Español</option>
						<option value="fr">Français</option>
						<option value="de">Deutsch</option>
					</select>
				</div>
				<div class="preference-group">
					<label for="timezone">Timezone</label>
					<select id="timezone" name="timezone" class="form-select">
						<option value="America/New_York">Eastern Time (ET)</option>
						<option value="America/Chicago">Central Time (CT)</option>
						<option value="America/Denver">Mountain Time (MT)</option>
						<option value="America/Los_Angeles" selected>Pacific Time (PT)</option>
						<option value="UTC">UTC</option>
					</select>
				</div>
				<div class="preference-group">
					<label for="dateFormat">Date Format</label>
					<select id="dateFormat" name="dateFormat" class="form-select">
						<option value="MM/DD/YYYY" selected>MM/DD/YYYY</option>
						<option value="DD/MM/YYYY">DD/MM/YYYY</option>
						<option value="YYYY-MM-DD">YYYY-MM-DD</option>
					</select>
				</div>
			</div>
		`;

		// Create modal with custom buttons
		ModalComponent.show(
			"Preferences",
			preferencesContent,
			"preferences-modal",
			{
				size: "large",
				buttons: [
					{
						text: "Cancel",
						className: "btn-secondary",
						action: () => ModalComponent.closeAll(),
					},
					{
						text: "Reset to Defaults",
						className: "btn-outline",
						action: () => this.resetPreferences(),
					},
					{
						text: "Save Preferences",
						className: "btn-primary",
						action: () => this.savePreferences(),
					},
				],
			}
		);
	}

	// Account Settings Actions
	saveAccountSettings() {
		const profileForm = document.getElementById("profileForm");
		const securityForm = document.getElementById("securityForm");

		const profileData = new FormData(profileForm);
		const securityData = new FormData(securityForm);

		// Update profile information
		const newName = profileData.get("fullName");
		if (newName && newName.trim()) {
			// Here you would typically send to backend
			console.log("Updating profile:", { name: newName });
			this.showNotification("Profile updated successfully!", "success");
		}

		// Handle password change
		const currentPassword = securityData.get("currentPassword");
		const newPassword = securityData.get("newPassword");
		const confirmPassword = securityData.get("confirmPassword");

		if (currentPassword && newPassword && confirmPassword) {
			if (newPassword !== confirmPassword) {
				this.showNotification("Passwords don't match!", "error");
				return;
			}
			if (newPassword.length < 6) {
				this.showNotification(
					"Password must be at least 6 characters!",
					"error"
				);
				return;
			}
			// Here you would typically verify current password and update
			console.log("Password change requested");
			this.showNotification("Password updated successfully!", "success");
		}

		this.closeModal();
	}

	exportUserData() {
		// Create mock data export
		const userData = {
			profile: this.authSystem?.getCurrentUser(),
			dashboards: this.dashboards,
			preferences: JSON.parse(
				localStorage.getItem("study-hall-preferences") || "{}"
			),
			exportDate: new Date().toISOString(),
		};

		const dataStr = JSON.stringify(userData, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });

		const link = document.createElement("a");
		link.href = URL.createObjectURL(dataBlob);
		link.download = `study-hall-data-${
			new Date().toISOString().split("T")[0]
		}.json`;
		link.click();

		this.showNotification("Data export completed!", "success");
	}

	handleDeleteAccount() {
		const confirmed = confirm(
			"Are you sure you want to delete your account?\n\nThis action cannot be undone and will permanently remove all your data."
		);

		if (confirmed) {
			const doubleConfirm = prompt(
				"To confirm account deletion, please type 'DELETE' in capital letters:"
			);

			if (doubleConfirm === "DELETE") {
				// Here you would typically send delete request to backend
				alert(
					"Account deletion requested. You will be contacted by an administrator to complete the process."
				);
				console.log(
					"Account deletion requested for user:",
					this.authSystem?.getCurrentUser()?.email
				);
			} else {
				this.showNotification("Account deletion cancelled.", "info");
			}
		}
	}

	// Preferences Actions
	savePreferences() {
		const modal = this.currentModal;
		const formData = new FormData();

		// Collect all form inputs
		const inputs = modal.querySelectorAll("input, select");
		inputs.forEach((input) => {
			if (input.type === "checkbox" || input.type === "radio") {
				if (input.checked) {
					formData.append(input.name, input.value || "true");
				}
			} else {
				formData.append(input.name, input.value);
			}
		});

		// Convert to object
		const preferences = {};
		for (let [key, value] of formData.entries()) {
			preferences[key] = value;
		}

		// Save to localStorage
		localStorage.setItem("study-hall-preferences", JSON.stringify(preferences));

		console.log("Preferences saved:", preferences);
		this.showNotification("Preferences saved successfully!", "success");
		this.closeModal();

		// Apply some preferences immediately
		this.applyPreferences(preferences);
	}

	resetPreferences() {
		if (confirm("Reset all preferences to default values?")) {
			localStorage.removeItem("study-hall-preferences");
			this.showNotification("Preferences reset to defaults!", "info");
			this.closeModal();
			// Reopen modal to show defaults
			setTimeout(() => this.showPreferencesModal(), 100);
		}
	}

	applyPreferences(preferences) {
		// Apply theme
		if (preferences.theme) {
			document.body.className = document.body.className.replace(
				/theme-\w+/g,
				""
			);
			if (preferences.theme !== "auto") {
				document.body.classList.add(`theme-${preferences.theme}`);
			}
		}

		// Apply sidebar preference
		if (preferences.collapseSidebar === "true") {
			this.collapseSidebar();
		}

		console.log("Applied preferences:", preferences);
	}

	// Helper methods for dashboard management
	addWidget(dashboardId) {
		this.showNotification("Widget creation coming soon!", "info");
	}

	editDashboard(dashboardId) {
		this.showNotification("Dashboard editing coming soon!", "info");
	}

	// Create new space - Delegated to SpaceManager
	createNewSpace() {
		this.spaceManager?.showCreateSpaceModal();
	}

	showItemOptions(optionsButton) {
		// Remove any existing context menu
		this.closeContextMenu();

		// Get the item this options button belongs to
		const navItem = optionsButton.closest(".nav-item");
		const itemName = navItem.querySelector(".nav-text").textContent;
		const itemView = navItem.dataset.view;

		// Create context menu
		const contextMenu = document.createElement("div");
		contextMenu.className = "context-menu";
		contextMenu.innerHTML = `
			<div class="context-menu-item" data-action="rename">
				<span class="context-icon">✏️</span>
				<span class="context-text">Rename</span>
			</div>
			<div class="context-menu-item" data-action="duplicate">
				<span class="context-icon">📋</span>
				<span class="context-text">Duplicate</span>
			</div>
			<div class="context-menu-item" data-action="favorite">
				<span class="context-icon">⭐</span>
				<span class="context-text">Add to Favorites</span>
			</div>
			<div class="context-menu-divider"></div>
			<div class="context-menu-item" data-action="share">
				<span class="context-icon">🔗</span>
				<span class="context-text">Share</span>
			</div>
			<div class="context-menu-item context-menu-danger" data-action="delete">
				<span class="context-icon">🗑️</span>
				<span class="context-text">Delete</span>
			</div>
		`;

		// Position the context menu
		const rect = optionsButton.getBoundingClientRect();
		contextMenu.style.position = "fixed";
		contextMenu.style.top = `${rect.bottom + 5}px`;
		contextMenu.style.left = `${rect.left - 150}px`; // Position to the left of the button
		contextMenu.style.zIndex = "1001";

		// Add to page
		document.body.appendChild(contextMenu);

		// Add event listeners to menu items
		contextMenu.addEventListener("click", (e) => {
			const menuItem = e.target.closest(".context-menu-item");
			if (menuItem) {
				const action = menuItem.dataset.action;
				this.handleItemAction(action, itemName, itemView, navItem);
				this.closeContextMenu();
			}
		});

		// Close menu when clicking outside
		setTimeout(() => {
			document.addEventListener("click", this.closeContextMenu.bind(this), {
				once: true,
			});
		}, 100);

		// Store reference for cleanup
		this.currentContextMenu = contextMenu;
	}

	closeContextMenu() {
		if (this.currentContextMenu) {
			this.currentContextMenu.remove();
			this.currentContextMenu = null;
		}
	}

	handleItemAction(action, itemName, itemView, navItem) {
		switch (action) {
			case "rename":
				this.renameItem(itemName, itemView, navItem);
				break;
			case "duplicate":
				this.duplicateItem(itemName, itemView, navItem);
				break;
			case "favorite":
				this.toggleFavorite(itemName, itemView, navItem);
				break;
			case "share":
				this.shareItem(itemName, itemView);
				break;
			case "delete":
				this.deleteItem(itemName, itemView, navItem);
				break;
		}
	}

	renameItem(itemName, itemView, navItem) {
		const newName = prompt(`Rename "${itemName}" to:`, itemName);
		if (newName && newName.trim() && newName !== itemName) {
			// Update the UI
			const navText = navItem.querySelector(".nav-text");
			navText.textContent = newName.trim();

			// Update internal data if it's a dashboard
			const dashboard = this.dashboards.find((d) => d.id === itemView);
			if (dashboard) {
				dashboard.name = newName.trim();
				// Save to localStorage after rename
				this.saveDashboards();
			}

			this.showNotification(`Renamed to "${newName.trim()}"`, "success");
		}
	}

	duplicateItem(itemName, itemView, navItem) {
		const newName = prompt(
			`Name for duplicate of "${itemName}":`,
			`${itemName} Copy`
		);
		if (newName && newName.trim()) {
			// For now, just show success message
			// You could implement actual duplication logic here
			this.showNotification(
				`Created duplicate: "${newName.trim()}"`,
				"success"
			);
			console.log(`Duplicating ${itemName} as ${newName.trim()}`);
		}
	}

	toggleFavorite(itemName, itemView, navItem) {
		// Check if already in favorites
		const favoritesSection = document.querySelector(
			'[data-section-content="favorites"]'
		);
		const existingFavorite = Array.from(
			favoritesSection.querySelectorAll(".nav-item")
		).find((item) => item.dataset.view === itemView);

		if (existingFavorite) {
			this.showNotification(`"${itemName}" is already in favorites`, "info");
		} else {
			// Add to favorites (clone the nav item)
			const favoriteItem = navItem.cloneNode(true);
			favoriteItem.querySelector(".nav-icon").textContent = "⭐";

			const li = document.createElement("li");
			li.appendChild(favoriteItem);
			favoritesSection.appendChild(li);

			this.showNotification(`Added "${itemName}" to favorites`, "success");
		}
	}

	shareItem(itemName, itemView) {
		// Create a shareable link (placeholder functionality)
		const shareUrl = `${window.location.origin}${window.location.pathname}#${itemView}`;

		// Copy to clipboard if available
		if (navigator.clipboard) {
			navigator.clipboard
				.writeText(shareUrl)
				.then(() => {
					this.showNotification(`Link copied to clipboard!`, "success");
				})
				.catch(() => {
					this.showNotification(`Share link: ${shareUrl}`, "info");
				});
		} else {
			this.showNotification(`Share link: ${shareUrl}`, "info");
		}
	}

	deleteItem(itemName, itemView, navItem) {
		const confirmDelete = confirm(
			`Are you sure you want to delete "${itemName}"? This action cannot be undone.`
		);
		if (confirmDelete) {
			// Remove from UI sidebar
			navItem.closest("li").remove();

			// Remove from internal data if it's a dashboard
			const dashboardIndex = this.dashboards.findIndex(
				(d) => d.id === itemView
			);
			if (dashboardIndex !== -1) {
				this.dashboards.splice(dashboardIndex, 1);

				// Save to localStorage after deletion
				this.saveDashboards();

				// Remove the dashboard view from DOM
				const dashboardView = document.getElementById(`${itemView}-view`);
				if (dashboardView) {
					dashboardView.remove();
				}
			}

			// Remove from favorites if it exists there
			const favoritesSection = document.querySelector(
				'[data-section-content="favorites"]'
			);
			const favoriteItem = Array.from(
				favoritesSection.querySelectorAll(".nav-item")
			).find((item) => item.dataset.view === itemView);
			if (favoriteItem) {
				favoriteItem.closest("li").remove();
			}

			// If we're currently viewing this item, navigate to dashboard
			if (this.currentView === itemView) {
				this.navigateToView("dashboard");
			}

			this.showNotification(`Deleted "${itemName}"`, "success");
		}
	}

	// Show workspace menu - Delegated to SpaceManager
	showWorkspaceMenu() {
		this.spaceManager?.showWorkspaceMenu();
	}

	// Note: navigateToView method is now handled above (line 1734) - this duplicate was causing conflicts

	showView(viewName, pushState = true) {
		// Hide all views
		const allViews = document.querySelectorAll(".view");
		allViews.forEach((view) => view.classList.remove("active"));

		// Show target view
		const targetView = document.getElementById(`${viewName}-view`);
		if (targetView) {
			targetView.classList.add("active");
			this.currentView = viewName;
		}

		// Update navigation active state
		const navItems = document.querySelectorAll(".nav-item");
		navItems.forEach((item) => {
			if (item.dataset.view === viewName) {
				item.classList.add("active");
			} else {
				item.classList.remove("active");
			}
		});

		// Update page title
		this.updatePageTitle(viewName);

		// Handle view-specific rendering
		if (viewName === "tasks") {
			this.renderTasks();
		} else if (viewName === "documents") {
			// Render simple documents view
			this.renderSimpleDocuments();
			// Set up search functionality
			const searchInput = document.getElementById("simpleDocumentSearch");
			if (searchInput) {
				searchInput.addEventListener("input", (e) => {
					const query = e.target.value.toLowerCase();
					const cards = document.querySelectorAll(".document-card");
					cards.forEach((card) => {
						const text = card.textContent.toLowerCase();
						card.style.display = text.includes(query) ? "block" : "none";
					});
				});
			}
		} else if (viewName === "docs") {
			// Use enhanced document management
			if (this.documentUIManager) {
				this.documentUIManager.enhanceDocumentsView();
			} else {
				// Fallback to legacy system
				this.renderDocuments();
				// Set up category click handlers
				document.querySelectorAll(".docs-category").forEach((category) => {
					category.addEventListener("click", () => {
						const categoryType = category.dataset.category;
						this.filterDocuments(categoryType);
					});
				});
			}
		} else if (viewName === "policies") {
			this.renderPolicies();
		} else if (viewName === "training") {
			this.renderTrainings();
		} else if (viewName === "templates") {
			this.renderTemplates();
		} else if (viewName === "users" && this.adminUIManager) {
			// Enhanced user management view
			this.adminUIManager.enhanceUsersView();
		}

		// Update URL and browser history
		if (pushState) {
			const url = `#${viewName}`;
			history.pushState({ view: viewName }, "", url);
		}

		// Auto-hide sidebar on mobile after navigation
		if (window.innerWidth <= 768) {
			this.collapseSidebar();
		}
	}

	updatePageTitle(viewName = this.currentView) {
		const titleMap = {
			dashboard: "Dashboard",
			projects: "Projects",
			tasks: "Tasks",
			people: "People",
			calendar: "Calendar",
			documents: "Documents",
			reports: "Reports",
		};

		const pageTitle = document.getElementById("pageTitle");
		const documentTitle = document.title;

		if (pageTitle) {
			pageTitle.textContent = titleMap[viewName] || "Dashboard";
		}

		document.title = `${titleMap[viewName] || "Dashboard"} - The Study Hall`;
	}

	// Note: toggleSidebar, collapseSidebar, expandSidebar are now handled by NavigationComponent

	handleInitialRoute() {
		// Check URL hash for initial route
		const hash = window.location.hash.slice(1); // Remove #
		const validViews = [
			"dashboard",
			"projects",
			"tasks",
			"people",
			"calendar",
			"documents",
			"reports",
		];

		if (hash && validViews.includes(hash)) {
			this.showView(hash, false);
		} else {
			// Default to dashboard
			this.showView("dashboard", false);
		}
	}

	handleViewToggle(toggleButton) {
		// Handle view type toggles (like list/board for tasks)
		const parentContainer = toggleButton.closest(".view-controls");
		if (parentContainer) {
			const toggles = parentContainer.querySelectorAll(".view-toggle");
			toggles.forEach((toggle) => toggle.classList.remove("active"));
			toggleButton.classList.add("active");

			// You can add view-specific logic here
			const viewType = toggleButton.dataset.viewType;
			console.log(`Switched to ${viewType} view`);
		}
	}

	handleResize() {
		// Auto-collapse sidebar on small screens
		if (window.innerWidth <= 768 && !this.sidebarCollapsed) {
			this.collapseSidebar();
		} else if (window.innerWidth > 768 && this.sidebarCollapsed) {
			this.expandSidebar();
		}
	}

	// Task Management Methods
	showTaskModal(taskId = null) {
		console.log("showTaskModal called with taskId:", taskId);
		console.log("Current app instance:", this);

		// Use the new TaskUIManager if available
		if (this.taskUIManager) {
			this.taskUIManager.showTaskModal(taskId);
			return;
		}

		// Fallback to legacy task modal using ModalComponent
		try {
			const isEditing = taskId !== null;
			const task = isEditing ? this.tasks.find((t) => t.id === taskId) : null;

			// Get current user info
			const currentUser = this.authSystem?.getCurrentUser();
			console.log("Current user:", currentUser);

			// Get all users for assignment dropdown
			const users = [
				{ name: "Admin User", email: "admin@studyhall.com" },
				{ name: "Sarah Johnson", email: "hr@studyhall.com" },
				{ name: "Mike Chen", email: "manager@studyhall.com" },
				{
					name: currentUser?.name || "Current User",
					email: currentUser?.email || "user@studyhall.com",
				},
			];

			// Remove duplicates
			const uniqueUsers = users.filter(
				(user, index, self) =>
					index === self.findIndex((u) => u.email === user.email)
			);

			// Use ModalComponent.form for better UX
			ModalComponent.form({
				title: isEditing ? "Edit Task" : "Create New Task",
				fields: [
					{
						name: "title",
						label: "Task Title",
						type: "text",
						required: true,
						placeholder: "Enter task title...",
						value: task?.title || "",
					},
					{
						name: "description",
						label: "Description",
						type: "textarea",
						placeholder: "Add task description...",
						rows: 3,
						value: task?.description || "",
					},
					{
						name: "assignee",
						label: "Assign To",
						type: "select",
						required: true,
						options: [
							{ value: "", label: "Select assignee..." },
							...uniqueUsers.map((user) => ({
								value: user.email,
								label: user.name,
								selected: task?.assigneeEmail === user.email,
							})),
						],
					},
					{
						name: "dueDate",
						label: "Due Date",
						type: "date",
						value: task?.dueDate || "",
					},
					{
						name: "priority",
						label: "Priority",
						type: "select",
						options: [
							{
								value: "low",
								label: "Low",
								selected: task?.priority === "low",
							},
							{
								value: "medium",
								label: "Medium",
								selected: task?.priority === "medium",
							},
							{
								value: "high",
								label: "High",
								selected: task?.priority === "high",
							},
						],
					},
					{
						name: "category",
						label: "Category",
						type: "text",
						placeholder: "e.g., HR, Operations, Development",
						value: task?.category || "",
					},
				],
				onSubmit: (formData) => {
					if (isEditing) {
						this.updateTaskFromData(formData, taskId);
					} else {
						this.createTaskFromData(formData);
					}
				},
			});

			console.log("Task modal created with ModalComponent successfully");
		} catch (error) {
			console.error("Error in showTaskModal:", error);
			console.error("Error stack:", error.stack);
		}
	}

	// Helper method for creating task from ModalComponent form data
	createTaskFromData(formData) {
		const currentUser = this.authSystem?.getCurrentUser();

		// Find assignee name from email
		const assigneeEmail = formData.assignee;
		const users = [
			{ name: "Admin User", email: "admin@studyhall.com" },
			{ name: "Sarah Johnson", email: "hr@studyhall.com" },
			{ name: "Mike Chen", email: "manager@studyhall.com" },
			{
				name: currentUser?.name || "Current User",
				email: currentUser?.email || "user@studyhall.com",
			},
		];

		const assignee = users.find((user) => user.email === assigneeEmail);
		const assigneeName = assignee ? assignee.name : assigneeEmail;

		const newTask = {
			id: this.getNextTaskId(),
			title: formData.title,
			description: formData.description || "",
			assignee: assigneeName,
			assigneeEmail: assigneeEmail,
			createdBy: currentUser?.name || "Current User",
			createdByEmail: currentUser?.email || "user@studyhall.com",
			dueDate: formData.dueDate || "",
			priority: formData.priority || "medium",
			category: formData.category || "",
			status: "pending",
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		this.tasks.push(newTask);
		this.saveTasks();
		this.renderTasks();
		this.renderDashboard();

		this.showNotification("Task created successfully!", "success");
		console.log("New task created:", newTask);
	}

	// Helper method for updating task from ModalComponent form data
	updateTaskFromData(formData, taskId) {
		const taskIndex = this.tasks.findIndex((t) => t.id === taskId);

		if (taskIndex === -1) {
			this.showNotification("Task not found!", "error");
			return;
		}

		const currentUser = this.authSystem?.getCurrentUser();

		// Find assignee name from email
		const assigneeEmail = formData.assignee;
		const users = [
			{ name: "Admin User", email: "admin@studyhall.com" },
			{ name: "Sarah Johnson", email: "hr@studyhall.com" },
			{ name: "Mike Chen", email: "manager@studyhall.com" },
			{
				name: currentUser?.name || "Current User",
				email: currentUser?.email || "user@studyhall.com",
			},
		];

		const assignee = users.find((user) => user.email === assigneeEmail);
		const assigneeName = assignee ? assignee.name : assigneeEmail;

		// Update task
		this.tasks[taskIndex] = {
			...this.tasks[taskIndex],
			title: formData.title,
			description: formData.description || "",
			assignee: assigneeName,
			assigneeEmail: assigneeEmail,
			dueDate: formData.dueDate || "",
			priority: formData.priority || "medium",
			category: formData.category || "",
			updatedAt: new Date().toISOString(),
		};

		this.saveTasks();
		this.renderTasks();
		this.renderDashboard();

		this.showNotification("Task updated successfully!", "success");
		console.log("Task updated:", this.tasks[taskIndex]);
	}

	createTask(form, taskId) {
		const formData = new FormData(form);
		const currentUser = this.authSystem?.getCurrentUser();

		// Find assignee name from email
		const assigneeEmail = formData.get("assignee");
		const users = [
			{ name: "Admin User", email: "admin@studyhall.com" },
			{ name: "Sarah Johnson", email: "hr@studyhall.com" },
			{ name: "Mike Chen", email: "manager@studyhall.com" },
		];
		const assignee =
			users.find((u) => u.email === assigneeEmail)?.name || assigneeEmail;

		const newTask = {
			id: this.taskIdCounter++,
			title: formData.get("title"),
			description: formData.get("description") || "",
			assignee: assignee,
			assigneeEmail: assigneeEmail,
			dueDate: formData.get("dueDate") || null,
			priority: formData.get("priority") || "medium",
			status: "pending",
			category: formData.get("category") || "General",
			createdAt: new Date().toISOString(),
			createdBy: currentUser?.name || "Unknown User",
		};

		this.tasks.push(newTask);
		this.saveTasks();
		this.refreshTasksView();
		this.closeModal();
		this.showNotification("Task created successfully!", "success");

		// Refresh dashboard if on dashboard view
		if (
			document.getElementById("dashboard-view")?.classList.contains("active")
		) {
			this.renderDashboard();
		}
	}

	updateTask(form, taskId) {
		const formData = new FormData(form);
		const taskIndex = this.tasks.findIndex((t) => t.id === taskId);

		if (taskIndex === -1) {
			this.showNotification("Task not found!", "error");
			return;
		}

		// Find assignee name from email
		const assigneeEmail = formData.get("assignee");
		const users = [
			{ name: "Admin User", email: "admin@studyhall.com" },
			{ name: "Sarah Johnson", email: "hr@studyhall.com" },
			{ name: "Mike Chen", email: "manager@studyhall.com" },
		];
		const assignee =
			users.find((u) => u.email === assigneeEmail)?.name || assigneeEmail;

		// Update task
		this.tasks[taskIndex] = {
			...this.tasks[taskIndex],
			title: formData.get("title"),
			description: formData.get("description") || "",
			assignee: assignee,
			assigneeEmail: assigneeEmail,
			dueDate: formData.get("dueDate") || null,
			priority: formData.get("priority") || "medium",
			category: formData.get("category") || "General",
			updatedAt: new Date().toISOString(),
		};

		this.saveTasks();
		this.refreshTasksView();
		this.closeModal();
		this.showNotification("Task updated successfully!", "success");

		// Refresh dashboard if on dashboard view
		if (
			document.getElementById("dashboard-view")?.classList.contains("active")
		) {
			this.renderDashboard();
		}
	}

	deleteTask(taskId) {
		if (confirm("Are you sure you want to delete this task?")) {
			this.tasks = this.tasks.filter((t) => t.id !== taskId);
			this.saveTasks();
			this.refreshTasksView();
			this.showNotification("Task deleted successfully!", "success");

			// Refresh dashboard if on dashboard view
			if (
				document.getElementById("dashboard-view")?.classList.contains("active")
			) {
				this.renderDashboard();
			}
		}
	}

	toggleTaskStatus(taskId) {
		const task = this.tasks.find((t) => t.id === taskId);
		if (task) {
			task.status = task.status === "completed" ? "pending" : "completed";
			task.completedAt =
				task.status === "completed" ? new Date().toISOString() : null;
			this.saveTasks();
			this.refreshTasksView();
			this.showNotification(`Task marked as ${task.status}!`, "success");

			// Refresh dashboard if on dashboard view
			if (
				document.getElementById("dashboard-view")?.classList.contains("active")
			) {
				this.renderDashboard();
			}
		}
	}

	refreshTasksView() {
		const tasksContainer = document.querySelector(".tasks-container");
		if (tasksContainer) {
			this.renderTasks();
		}
	}

	renderTasks() {
		const tasksView = document.getElementById("tasks-view");
		if (!tasksView) return;

		// Use the new TaskUIManager if available
		if (this.taskUIManager) {
			this.taskUIManager.renderTasksView();
			return;
		}

		// Fallback to legacy task rendering
		const tasksContainer = document.querySelector(".tasks-container");
		if (!tasksContainer) return;

		tasksContainer.innerHTML = this.tasks
			.map((task) => {
				const dueDate = task.dueDate
					? new Date(task.dueDate).toLocaleDateString()
					: "No due date";
				const isOverdue =
					task.dueDate &&
					new Date(task.dueDate) < new Date() &&
					task.status !== "completed";

				return `
				<div class="task-item ${task.status === "completed" ? "completed" : ""} ${
					isOverdue ? "overdue" : ""
				}">
					<div class="task-checkbox ${task.status === "completed" ? "checked" : ""}" 
						 onclick="studyHallApp.toggleTaskStatus(${task.id})">
						${task.status === "completed" ? "✓" : ""}
					</div>
					<div class="task-content">
						<div class="task-title">${task.title}</div>
						<div class="task-description">${task.description}</div>
						<div class="task-meta">
							<span class="task-assignee">👤 ${task.assignee}</span>
							<span class="task-due ${isOverdue ? "overdue" : ""}">📅 ${dueDate}</span>
							<span class="task-category">📂 ${task.category}</span>
						</div>
					</div>
					<div class="task-priority priority-${task.priority}">${
					task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
				}</div>
					<div class="task-actions">
						<button class="task-action-btn" onclick="studyHallApp.showTaskModal(${
							task.id
						})" title="Edit Task">
							✏️
						</button>
						<button class="task-action-btn danger" onclick="studyHallApp.deleteTask(${
							task.id
						})" title="Delete Task">
							🗑️
						</button>
					</div>
				</div>
			`;
			})
			.join("");
	}

	closeModal() {
		console.log("closeModal called - delegating to ModalComponent");
		ModalComponent.closeAll();
		this.currentModal = null;
	}

	// Utility methods for future features
	showNotification(message, type = "info") {
		// Delegate to the unified NotificationComponent
		return NotificationComponent.show(message, type);
	}

	openModal(modalId) {
		// Modal management
		console.log(`Opening modal: ${modalId}`);
	}

	showCustomModal(title, content, modalClass = "custom-modal") {
		// Use ModalComponent instead of legacy modal
		return ModalComponent.show({
			title: title,
			content: content,
			className: modalClass,
		});
	}

	closeModal() {
		console.log("closeModal called - delegating to ModalComponent");
		ModalComponent.closeAll();
		this.currentModal = null;
	}

	// Generic modal creation method for use by other managers
	createModal(title, content, modalClass = "") {
		console.log("createModal called with title:", title);
		return ModalComponent.show(title, content, modalClass);
	}
}

// StudyHallApp class is already exported in the class declaration above
