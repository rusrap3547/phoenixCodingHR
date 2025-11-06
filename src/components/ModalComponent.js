// Unified Modal Component System
// Provides consistent modal behavior across the entire application

export class ModalComponent {
	constructor(options = {}) {
		this.options = {
			title: options.title || "",
			content: options.content || "",
			size: options.size || "medium", // small, medium, large, fullscreen
			closable: options.closable !== false, // default true
			backdrop: options.backdrop !== false, // default true (click to close)
			keyboard: options.keyboard !== false, // default true (escape to close)
			className: options.className || "",
			buttons: options.buttons || [], // array of button configs
			onShow: options.onShow || null,
			onHide: options.onHide || null,
			onSubmit: options.onSubmit || null,
			...options,
		};

		this.modal = null;
		this.isVisible = false;
		this.escapeHandler = null;
		this.id = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// Create and show the modal
	show() {
		if (this.isVisible) {
			return this;
		}

		// Remove any existing modals first
		this.removeExistingModals();

		// Create modal structure
		this.modal = this.createModalElement();

		// Add to DOM
		document.body.appendChild(this.modal);

		// Bind events
		this.bindEvents();

		// Set state
		this.isVisible = true;

		// Focus management
		this.manageFocus();

		// Callback
		if (this.options.onShow) {
			this.options.onShow(this);
		}

		console.log(`Modal ${this.id} shown`);
		return this;
	}

	// Hide and remove the modal
	hide() {
		if (!this.isVisible || !this.modal) {
			return this;
		}

		// Callback before hiding
		if (this.options.onHide) {
			this.options.onHide(this);
		}

		// Remove event listeners
		this.unbindEvents();

		// Remove from DOM
		this.modal.remove();

		// Reset state
		this.modal = null;
		this.isVisible = false;

		console.log(`Modal ${this.id} hidden`);
		return this;
	}

	// Update modal content
	updateContent(content) {
		if (!this.modal) return this;

		const body = this.modal.querySelector(".modal-body");
		if (body) {
			body.innerHTML = content;
		}
		return this;
	}

	// Update modal title
	updateTitle(title) {
		if (!this.modal) return this;

		const titleElement = this.modal.querySelector(".modal-title");
		if (titleElement) {
			titleElement.textContent = title;
		}
		return this;
	}

	// Create the modal DOM element
	createModalElement() {
		const modal = document.createElement("div");
		modal.className = `modal-overlay modal-size-${this.options.size} ${this.options.className}`;
		modal.id = this.id;
		modal.setAttribute("role", "dialog");
		modal.setAttribute("aria-modal", "true");
		modal.setAttribute("aria-labelledby", `${this.id}-title`);

		modal.innerHTML = `
			<div class="modal-content">
				${this.createHeader()}
				${this.createBody()}
				${this.createFooter()}
			</div>
		`;

		return modal;
	}

	// Create modal header
	createHeader() {
		if (!this.options.title && !this.options.closable) {
			return "";
		}

		return `
			<div class="modal-header">
				${
					this.options.title
						? `<h2 class="modal-title" id="${this.id}-title">${this.options.title}</h2>`
						: ""
				}
				${
					this.options.closable
						? `<button class="modal-close" aria-label="Close modal">&times;</button>`
						: ""
				}
			</div>
		`;
	}

	// Create modal body
	createBody() {
		return `<div class="modal-body">${this.options.content}</div>`;
	}

	// Create modal footer
	createFooter() {
		if (!this.options.buttons || this.options.buttons.length === 0) {
			return "";
		}

		const buttonsHtml = this.options.buttons
			.map((button) => {
				const className = `btn ${button.className || "btn-secondary"}`;
				const attrs = Object.entries(button.attributes || {})
					.map(([key, value]) => `${key}="${value}"`)
					.join(" ");

				return `<button class="${className}" data-action="${
					button.action || ""
				}" ${attrs}>${button.text}</button>`;
			})
			.join("");

		return `<div class="modal-footer">${buttonsHtml}</div>`;
	}

	// Bind event listeners
	bindEvents() {
		if (!this.modal) return;

		// Close button
		if (this.options.closable) {
			const closeBtn = this.modal.querySelector(".modal-close");
			if (closeBtn) {
				closeBtn.addEventListener("click", (e) => {
					e.preventDefault();
					e.stopPropagation();
					this.hide();
				});
			}
		}

		// Backdrop click
		if (this.options.backdrop) {
			this.modal.addEventListener("click", (e) => {
				if (e.target === this.modal) {
					this.hide();
				}
			});
		}

		// Escape key
		if (this.options.keyboard) {
			this.escapeHandler = (e) => {
				if (e.key === "Escape") {
					this.hide();
				}
			};
			document.addEventListener("keydown", this.escapeHandler);
		}

		// Button actions
		const buttons = this.modal.querySelectorAll(
			".modal-footer button[data-action]"
		);
		buttons.forEach((button) => {
			button.addEventListener("click", (e) => {
				const action = button.dataset.action;
				this.handleButtonAction(action, e, button);
			});
		});

		// Form submission if present
		const form = this.modal.querySelector("form");
		if (form && this.options.onSubmit) {
			form.addEventListener("submit", (e) => {
				e.preventDefault();
				this.options.onSubmit(e, this, form);
			});
		}
	}

	// Unbind event listeners
	unbindEvents() {
		if (this.escapeHandler) {
			document.removeEventListener("keydown", this.escapeHandler);
			this.escapeHandler = null;
		}
	}

	// Handle button actions
	handleButtonAction(action, event, button) {
		switch (action) {
			case "close":
			case "cancel":
				this.hide();
				break;
			case "submit":
				const form = this.modal.querySelector("form");
				if (form) {
					form.dispatchEvent(new Event("submit"));
				}
				break;
			default:
				// Custom action - call callback if provided
				if (this.options.onButtonClick) {
					this.options.onButtonClick(action, event, button, this);
				}
		}
	}

	// Focus management for accessibility
	manageFocus() {
		if (!this.modal) return;

		// Focus first focusable element
		setTimeout(() => {
			const focusableElements = this.modal.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);

			if (focusableElements.length > 0) {
				focusableElements[0].focus();
			}
		}, 100);
	}

	// Remove any existing modals to prevent stacking
	removeExistingModals() {
		const existingModals = document.querySelectorAll(".modal-overlay");
		existingModals.forEach((modal) => modal.remove());
	}

	// Static method to create and show a simple modal quickly
	static show(title, content, classNameOrOptions = {}, options = {}) {
		// Handle different parameter combinations
		let finalOptions = {};
		let className = "";

		if (typeof classNameOrOptions === "string") {
			// Called as show(title, content, className, options)
			className = classNameOrOptions;
			finalOptions = { className, ...options };
		} else {
			// Called as show(title, content, options)
			finalOptions = { ...classNameOrOptions };
		}

		const modal = new ModalComponent({
			title,
			content,
			...finalOptions,
		});
		return modal.show();
	}

	// Static method to create a confirmation modal
	static confirm(configOrTitle, content, onConfirm, onCancel = null) {
		// Support both object-based and parameter-based API
		if (typeof configOrTitle === "object" && configOrTitle !== null) {
			// Object-based API
			const config = configOrTitle;
			return new ModalComponent({
				title: config.title || "Confirm",
				content: config.message || config.content || "",
				buttons: [
					{
						text: config.cancelText || "Cancel",
						action: "cancel",
						className: "btn-secondary",
					},
					{
						text: config.confirmText || "Confirm",
						action: "confirm",
						className: config.confirmClass || "btn-primary",
					},
				],
				onButtonClick: (action, event, button, modal) => {
					if (action === "confirm" && config.onConfirm) {
						config.onConfirm(modal);
					} else if (action === "cancel" && config.onCancel) {
						config.onCancel(modal);
					} else {
						modal.hide();
					}
				},
				...config,
			}).show();
		}

		// Traditional parameter-based API
		return new ModalComponent({
			title: configOrTitle,
			content,
			buttons: [
				{ text: "Cancel", action: "cancel", className: "btn-secondary" },
				{ text: "Confirm", action: "confirm", className: "btn-primary" },
			],
			onButtonClick: (action, event, button, modal) => {
				if (action === "confirm" && onConfirm) {
					onConfirm(modal);
				} else if (action === "cancel" && onCancel) {
					onCancel(modal);
				}
				modal.hide();
			},
		}).show();
	}

	// Static method to create an alert modal
	static alert(title, content, onOk = null) {
		return new ModalComponent({
			title,
			content,
			buttons: [{ text: "OK", action: "ok", className: "btn-primary" }],
			onButtonClick: (action, event, button, modal) => {
				if (onOk) onOk(modal);
				modal.hide();
			},
		}).show();
	}

	// Static method to create a form modal
	static form(configOrTitle, formContent, onSubmit, options = {}) {
		// Use object-based API if first argument is an object with a 'fields' array property
		if (
			typeof configOrTitle === "object" &&
			configOrTitle !== null &&
			Array.isArray(configOrTitle.fields)
		) {
			const config = configOrTitle;
			const fields = config.fields || [];
			const title = config.title || "";
			const submitCallback = config.onSubmit;

			// Generate form HTML from fields
			let formHtml = "";
			fields.forEach((field) => {
				const required = field.required ? "required" : "";
				const placeholder = field.placeholder
					? `placeholder="${field.placeholder}"`
					: "";
				const value = field.value ? `value="${field.value}"` : "";

				switch (field.type) {
					case "textarea":
						formHtml += `
							   <div class="form-group">
								   <label for="${field.name}">${field.label}</label>
								   <textarea id="${field.name}" name="${
							field.name
						}" ${required} ${placeholder}>${field.value || ""}</textarea>
							   </div>
						   `;
						break;
					case "select":
						const selectOptions = field.options
							? field.options
									.map(
										(opt) =>
											`<option value="${opt.value}" ${
												opt.selected ? "selected" : ""
											}>${opt.label}</option>`
									)
									.join("")
							: "";
						formHtml += `
							   <div class="form-group">
								   <label for="${field.name}">${field.label}</label>
								   <select id="${field.name}" name="${field.name}" ${required}>
									   ${selectOptions}
								   </select>
							   </div>
						   `;
						break;
					default: // text, email, etc.
						formHtml += `
							   <div class="form-group">
								   <label for="${field.name}">${field.label}</label>
								   <input type="${field.type || "text"}" id="${field.name}" name="${
							field.name
						}" ${required} ${placeholder} ${value}>
							   </div>
						   `;
				}
			});

			return new ModalComponent({
				title,
				content: `<form class="modal-form">${formHtml}</form>`,
				buttons: [
					{ text: "Cancel", action: "cancel", className: "btn-secondary" },
					{ text: "Submit", action: "submit", className: "btn-primary" },
				],
				onSubmit: (e, modal, form) => {
					e.preventDefault();
					const formData = new FormData(form);
					const data = {};
					for (let [key, value] of formData.entries()) {
						data[key] = value;
					}
					if (submitCallback) {
						submitCallback(data);
					}
					modal.hide();
				},
				...config,
			}).show();
		}

		// Handle traditional API (title, formContent, onSubmit, options)
		return new ModalComponent({
			title: configOrTitle,
			content: `<form class="modal-form">${formContent}</form>`,
			buttons: [
				{ text: "Cancel", action: "cancel", className: "btn-secondary" },
				{ text: "Submit", action: "submit", className: "btn-primary" },
			],
			onSubmit,
			...options,
		}).show();
	}

	/**
	 * Creates a custom modal with flexible content
	 * @param {Object} config - Configuration object
	 * @param {string} config.title - Modal title
	 * @param {string} config.content - HTML content for the modal body
	 * @param {Array} [config.buttons] - Optional custom buttons
	 * @param {string} [config.className] - Additional CSS class for the modal
	 * @param {Function} [config.onClose] - Callback when modal is closed
	 * @returns {ModalComponent} The modal instance
	 */
	static custom(config) {
		const {
			title,
			content,
			buttons = [
				{ text: "Close", action: "close", className: "btn-secondary" },
			],
			className,
			onClose,
			...rest
		} = config;

		return new ModalComponent({
			title,
			content,
			buttons,
			className,
			onClose,
			...rest,
		}).show();
	}

	/**
	 * Creates a menu-style modal with clickable options
	 * @param {Object} config - Configuration object
	 * @param {string} config.title - Modal title
	 * @param {Array} config.options - Array of menu options
	 * @param {string} config.options[].label - Option label text
	 * @param {string} [config.options[].icon] - Optional icon/emoji
	 * @param {Function} config.options[].action - Function to call when option is clicked
	 * @param {string} [config.options[].className] - Optional CSS class for the option
	 * @param {boolean} [config.options[].danger] - Whether this is a dangerous action (red styling)
	 * @returns {ModalComponent} The modal instance
	 */
	static menu(config) {
		const { title, options = [] } = config;

		// Build menu HTML
		let menuHtml = '<div class="modal-menu">';
		options.forEach((option) => {
			const icon = option.icon
				? `<span class="menu-icon">${option.icon}</span>`
				: "";
			const dangerClass = option.danger ? "menu-item-danger" : "";
			const customClass = option.className || "";

			menuHtml += `
				<button class="menu-item ${dangerClass} ${customClass}" data-action="${option.label}">
					${icon}
					<span class="menu-label">${option.label}</span>
				</button>
			`;
		});
		menuHtml += "</div>";

		const modal = new ModalComponent({
			title,
			content: menuHtml,
			buttons: [
				{ text: "Cancel", action: "cancel", className: "btn-secondary" },
			],
			className: "modal-menu-container",
		}).show();

		// Bind menu item clicks
		setTimeout(() => {
			const menuItems = modal.modalElement.querySelectorAll(".menu-item");
			menuItems.forEach((item, index) => {
				item.addEventListener("click", (e) => {
					e.preventDefault();
					const option = options[index];
					if (option && option.action) {
						modal.hide();
						// Execute action after modal closes
						setTimeout(() => option.action(), 150);
					}
				});
			});
		}, 0);

		return modal;
	}
}
