/**
 * SpaceManager - Handles space/workspace management
 * Manages space creation, editing, deletion, and UI rendering
 */

import { ModalComponent } from "./components/ModalComponent.js";
import { NotificationComponent } from "./components/NotificationComponent.js";

export class SpaceManager {
	/**
	 * Initialize the SpaceManager
	 * @param {Object} dependencies - Required dependencies
	 * @param {Object} dependencies.authSystem - Authentication system
	 * @param {Object} dependencies.navigationManager - Navigation component manager
	 */
	constructor(dependencies = {}) {
		this.authSystem = dependencies.authSystem;
		this.navigationManager = dependencies.navigationManager;
		this.spaces = this.loadSpaces();
	}

	/**
	 * Load spaces from localStorage
	 * @returns {Array} Array of space objects
	 */
	loadSpaces() {
		try {
			const saved = localStorage.getItem("study-hall-spaces");
			if (saved) {
				return JSON.parse(saved);
			}
		} catch (error) {
			console.error("Error loading spaces:", error);
		}

		// Return default spaces if none exist
		return [
			{
				id: "space-1",
				name: "HR Team",
				icon: "👥",
				description: "Main HR team workspace",
				createdAt: new Date().toISOString(),
				createdBy: "admin@studyhall.com",
				members: [],
				isDefault: true,
			},
			{
				id: "space-2",
				name: "Recruitment",
				icon: "🎯",
				description: "Recruitment and hiring workspace",
				createdAt: new Date().toISOString(),
				createdBy: "admin@studyhall.com",
				members: [],
				isDefault: false,
			},
		];
	}

	/**
	 * Save spaces to localStorage
	 */
	saveSpaces() {
		try {
			localStorage.setItem("study-hall-spaces", JSON.stringify(this.spaces));
		} catch (error) {
			console.error("Error saving spaces:", error);
			NotificationComponent.show("Failed to save spaces", "error");
		}
	}

	/**
	 * Get all spaces
	 * @returns {Array} Array of all spaces
	 */
	getAllSpaces() {
		return this.spaces;
	}

	/**
	 * Get a specific space by ID
	 * @param {string} spaceId - Space ID
	 * @returns {Object|null} Space object or null if not found
	 */
	getSpace(spaceId) {
		return this.spaces.find((space) => space.id === spaceId) || null;
	}

	/**
	 * Create a new space
	 * @param {Object} spaceData - Space data
	 * @param {string} spaceData.name - Space name
	 * @param {string} spaceData.icon - Space icon
	 * @param {string} spaceData.description - Space description
	 * @returns {Object} Created space object
	 */
	createSpace(spaceData) {
		const user = this.authSystem.getCurrentUser();
		const space = {
			id: `space-${Date.now()}`,
			name: spaceData.name,
			icon: spaceData.icon || "🏢",
			description: spaceData.description || "",
			createdAt: new Date().toISOString(),
			createdBy: user ? user.email : "unknown",
			members: [],
			isDefault: false,
		};

		this.spaces.push(space);
		this.saveSpaces();

		// Add to navigation if available
		if (this.navigationManager) {
			this.navigationManager.addSpace(space);
		}

		return space;
	}

	/**
	 * Update an existing space
	 * @param {string} spaceId - Space ID
	 * @param {Object} updates - Updated space properties
	 * @returns {boolean} Success status
	 */
	updateSpace(spaceId, updates) {
		const spaceIndex = this.spaces.findIndex((s) => s.id === spaceId);
		if (spaceIndex === -1) {
			NotificationComponent.show("Space not found", "error");
			return false;
		}

		this.spaces[spaceIndex] = {
			...this.spaces[spaceIndex],
			...updates,
			id: spaceId, // Prevent ID changes
		};

		this.saveSpaces();

		// Update navigation if available
		if (this.navigationManager) {
			this.navigationManager.updateSpace(this.spaces[spaceIndex]);
		}

		return true;
	}

	/**
	 * Delete a space
	 * @param {string} spaceId - Space ID
	 * @returns {boolean} Success status
	 */
	deleteSpace(spaceId) {
		const space = this.getSpace(spaceId);
		if (!space) {
			NotificationComponent.show("Space not found", "error");
			return false;
		}

		if (space.isDefault) {
			NotificationComponent.show("Cannot delete default space", "error");
			return false;
		}

		this.spaces = this.spaces.filter((s) => s.id !== spaceId);
		this.saveSpaces();

		// Remove from navigation if available
		if (this.navigationManager) {
			this.navigationManager.removeSpace(spaceId);
		}

		return true;
	}

	/**
	 * Rename a space
	 * @param {string} spaceId - Space ID
	 * @param {string} newName - New space name
	 * @returns {boolean} Success status
	 */
	renameSpace(spaceId, newName) {
		return this.updateSpace(spaceId, { name: newName });
	}

	/**
	 * Duplicate a space
	 * @param {string} spaceId - Space ID to duplicate
	 * @returns {Object|null} Duplicated space or null on failure
	 */
	duplicateSpace(spaceId) {
		const originalSpace = this.getSpace(spaceId);
		if (!originalSpace) {
			NotificationComponent.show("Space not found", "error");
			return null;
		}

		const duplicatedSpace = this.createSpace({
			name: `${originalSpace.name} (Copy)`,
			icon: originalSpace.icon,
			description: originalSpace.description,
		});

		NotificationComponent.show(
			`Space "${originalSpace.name}" duplicated successfully`,
			"success"
		);

		return duplicatedSpace;
	}

	/**
	 * Set a space as default
	 * @param {string} spaceId - Space ID
	 * @returns {boolean} Success status
	 */
	setDefaultSpace(spaceId) {
		const space = this.getSpace(spaceId);
		if (!space) {
			NotificationComponent.show("Space not found", "error");
			return false;
		}

		// Remove default flag from all spaces
		this.spaces.forEach((s) => {
			s.isDefault = false;
		});

		// Set new default
		space.isDefault = true;
		this.saveSpaces();

		NotificationComponent.show(
			`"${space.name}" set as default space`,
			"success"
		);
		return true;
	}

	/**
	 * Add member to space
	 * @param {string} spaceId - Space ID
	 * @param {string} userEmail - User email to add
	 * @returns {boolean} Success status
	 */
	addMemberToSpace(spaceId, userEmail) {
		const space = this.getSpace(spaceId);
		if (!space) {
			NotificationComponent.show("Space not found", "error");
			return false;
		}

		if (space.members.includes(userEmail)) {
			NotificationComponent.show("User already in space", "error");
			return false;
		}

		space.members.push(userEmail);
		this.saveSpaces();

		NotificationComponent.show("Member added to space", "success");
		return true;
	}

	/**
	 * Remove member from space
	 * @param {string} spaceId - Space ID
	 * @param {string} userEmail - User email to remove
	 * @returns {boolean} Success status
	 */
	removeMemberFromSpace(spaceId, userEmail) {
		const space = this.getSpace(spaceId);
		if (!space) {
			NotificationComponent.show("Space not found", "error");
			return false;
		}

		space.members = space.members.filter((email) => email !== userEmail);
		this.saveSpaces();

		NotificationComponent.show("Member removed from space", "success");
		return true;
	}

	/**
	 * Show modal to create a new space
	 */
	showCreateSpaceModal() {
		ModalComponent.form({
			title: "Create New Space",
			fields: [
				{ name: "name", label: "Space Name", type: "text", required: true },
				{
					name: "icon",
					label: "Icon",
					type: "text",
					placeholder: "🏢",
					value: "🏢",
				},
				{ name: "description", label: "Description", type: "textarea" },
			],
			onSubmit: (data) => {
				this.handleSpaceCreation(data);
			},
		});
	}

	/**
	 * Handle space creation from modal
	 * @param {Object} data - Form data from modal
	 */
	handleSpaceCreation(data) {
		const space = this.createSpace(data);
		NotificationComponent.show(
			`Space "${space.name}" created successfully`,
			"success"
		);
		ModalComponent.close();
	}

	/**
	 * Show space options menu
	 * @param {string} spaceId - Space ID
	 * @param {Event} event - Click event
	 */
	showSpaceOptionsMenu(spaceId, event) {
		const space = this.getSpace(spaceId);
		if (!space) {
			NotificationComponent.show("Space not found", "error");
			return;
		}

		const options = [
			{
				label: "Rename",
				icon: "✏️",
				action: () => this.showRenameSpaceModal(spaceId),
			},
			{
				label: "Duplicate",
				icon: "📋",
				action: () => this.duplicateSpace(spaceId),
			},
		];

		// Add set default option if not already default
		if (!space.isDefault) {
			options.push({
				label: "Set as Default",
				icon: "⭐",
				action: () => this.setDefaultSpace(spaceId),
			});
		}

		// Add delete option if not default
		if (!space.isDefault) {
			options.push({
				label: "Delete",
				icon: "🗑️",
				action: () => this.showDeleteSpaceConfirmation(spaceId),
				danger: true,
			});
		}

		ModalComponent.menu({
			title: space.name,
			options: options,
			position: event ? { x: event.clientX, y: event.clientY } : null,
		});
	}

	/**
	 * Show rename space modal
	 * @param {string} spaceId - Space ID
	 */
	showRenameSpaceModal(spaceId) {
		const space = this.getSpace(spaceId);
		if (!space) {
			NotificationComponent.show("Space not found", "error");
			return;
		}

		ModalComponent.form({
			title: "Rename Space",
			fields: [
				{
					name: "name",
					label: "Space Name",
					type: "text",
					required: true,
					value: space.name,
				},
			],
			onSubmit: (data) => {
				if (this.renameSpace(spaceId, data.name)) {
					NotificationComponent.show("Space renamed successfully", "success");
					ModalComponent.close();
				}
			},
		});
	}

	/**
	 * Show delete space confirmation
	 * @param {string} spaceId - Space ID
	 */
	showDeleteSpaceConfirmation(spaceId) {
		const space = this.getSpace(spaceId);
		if (!space) {
			NotificationComponent.show("Space not found", "error");
			return;
		}

		ModalComponent.confirm({
			title: "Delete Space",
			message: `Are you sure you want to delete "${space.name}"? This action cannot be undone.`,
			confirmText: "Delete",
			cancelText: "Cancel",
			onConfirm: () => {
				if (this.deleteSpace(spaceId)) {
					NotificationComponent.show("Space deleted successfully", "success");
					ModalComponent.close();
				}
			},
		});
	}

	/**
	 * Show workspace menu
	 */
	showWorkspaceMenu() {
		const user = this.authSystem.getCurrentUser();
		const options = [
			{
				label: "Create New Space",
				icon: "➕",
				action: () => this.showCreateSpaceModal(),
			},
			{
				label: "Manage Spaces",
				icon: "⚙️",
				action: () => this.showManageSpacesModal(),
			},
		];

		ModalComponent.menu({
			title: "Workspace Menu",
			options: options,
		});
	}

	/**
	 * Show manage spaces modal
	 */
	showManageSpacesModal() {
		const spacesHTML = this.spaces
			.map(
				(space) => `
			<div class="space-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #e1e5e9; border-radius: 8px; margin-bottom: 8px;">
				<div style="display: flex; align-items: center; gap: 10px;">
					<span style="font-size: 24px;">${space.icon}</span>
					<div>
						<div style="font-weight: 600; color: #333;">${space.name}</div>
						<div style="font-size: 12px; color: #666;">${
							space.description || "No description"
						}</div>
						${
							space.isDefault
								? '<span style="font-size: 11px; color: #007bff;">⭐ Default</span>'
								: ""
						}
					</div>
				</div>
				<div style="display: flex; gap: 5px;">
					<button class="btn btn-sm" onclick="window.studyHallApp.spaceManager.showSpaceOptionsMenu('${
						space.id
					}', event)">Options</button>
				</div>
			</div>
		`
			)
			.join("");

		ModalComponent.custom({
			title: "Manage Spaces",
			content: `
				<div style="max-height: 400px; overflow-y: auto;">
					${spacesHTML}
				</div>
				<div style="margin-top: 15px; text-align: right;">
					<button class="btn btn-primary" onclick="window.studyHallApp.spaceManager.showCreateSpaceModal()">
						Create New Space
					</button>
				</div>
			`,
		});
	}

	/**
	 * Get space statistics
	 * @returns {Object} Statistics object
	 */
	getSpaceStats() {
		return {
			total: this.spaces.length,
			default: this.spaces.filter((s) => s.isDefault).length,
			withMembers: this.spaces.filter((s) => s.members.length > 0).length,
		};
	}
}
