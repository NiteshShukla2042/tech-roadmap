/**
 * TECH ROADMAP - FEEDBACK FORM CONTROLLER
 * 
 * Handles:
 * 1. Form input validation (Name, Email, Message)
 * 2. Regular Expression (Regex) verification for email patterns
 * 3. Saving submission entries inside Local Storage arrays
 * 4. Displaying dynamic success/error alert notification banners
 * 5. Rendering past user review logs on the feedback page
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. SELECT DOM FORM ELEMENTS
    const feedbackForm = document.getElementById('feedback-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const formAlert = document.getElementById('form-alert');
    const submissionsSection = document.getElementById('submissions-section');
    const submissionsList = document.getElementById('submissions-list');

    const STORAGE_KEY = 'tech-roadmap-feedbacks';

    // 2. RENDER SUBMISSIONS ON PAGE LOAD
    renderSubmissions();

    // 3. ATTACH FORM SUBMIT EVENT LISTENER
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', (event) => {
            // Stop page from refreshing on form submit
            event.preventDefault();

            // Clear previous alert banner state
            clearAlert();

            // Run validation check across all fields
            const isNameValid = validateField(nameInput, validateNameText);
            const isEmailValid = validateField(emailInput, validateEmailText);
            const isMessageValid = validateField(messageInput, validateMessageText);

            // If any fields are invalid, trigger error banner and halt submission
            if (!isNameValid || !isEmailValid || !isMessageValid) {
                showAlert('Please fill out all fields correctly before submitting.', 'danger');
                return;
            }

            // If all fields are valid, gather input values
            const nameValue = nameInput.value.trim();
            const emailValue = emailInput.value.trim();
            const messageValue = messageInput.value.trim();

            // Create a feedback record object
            const feedbackEntry = {
                name: nameValue,
                email: emailValue,
                message: messageValue,
                timestamp: new Date().toLocaleString()
            };

            // Save record to Local Storage
            saveFeedbackToStorage(feedbackEntry);

            // Display success alert
            showAlert('Thank you for your feedback! Your review has been saved successfully.', 'success');

            // Reset all input fields in the form
            feedbackForm.reset();

            // Re-render submissions to display the new review immediately
            renderSubmissions();
        });
    }

    // 4. REAL-TIME INPUT VALIDATION (UX IMPROVEMENT)
    // Toggles off red border outline as soon as user types valid characters
    if (nameInput) {
        nameInput.addEventListener('input', () => validateField(nameInput, validateNameText));
    }
    if (emailInput) {
        emailInput.addEventListener('input', () => validateField(emailInput, validateEmailText));
    }
    if (messageInput) {
        messageInput.addEventListener('input', () => validateField(messageInput, validateMessageText));
    }

    // ==========================================
    // VALIDATION HELPER FUNCTIONS
    // ==========================================

    // Validates an input field using a custom validation test function
    function validateField(inputElement, validationFn) {
        if (!inputElement) return false;
        
        const value = inputElement.value.trim();
        const isValid = validationFn(value);
        const parentGroup = inputElement.closest('.form-group');

        if (parentGroup) {
            if (isValid) {
                // Remove error style classes
                parentGroup.classList.remove('invalid');
            } else {
                // Add error style classes (triggers red border & error span in CSS)
                parentGroup.classList.add('invalid');
            }
        }

        return isValid;
    }

    // Check if name is not empty and is at least 2 characters long
    function validateNameText(value) {
        return value.length >= 2;
    }

    // Check if email fits standard regex parameters
    function validateEmailText(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    // Check if message is not empty and is at least 10 characters long
    function validateMessageText(value) {
        return value.length >= 10;
    }

    // ==========================================
    // STORAGE & DISPLAY HELPER FUNCTIONS
    // ==========================================

    // Saves a feedback entry into the local storage array
    function saveFeedbackToStorage(newEntry) {
        try {
            // Retrieve existing feedback arrays or initialize empty array
            const existingFeedbacks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            
            // Add new review to the list
            existingFeedbacks.push(newEntry);
            
            // Write back updated list to local storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existingFeedbacks));
        } catch (e) {
            console.error("Failed to save feedback to local storage: ", e);
        }
    }

    // Renders past feedback logs onto the page layout
    function renderSubmissions() {
        if (!submissionsList || !submissionsSection) return;

        // Fetch logs from storage
        let feedbacks = [];
        try {
            feedbacks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            console.error("Failed to read feedback logs from storage: ", e);
        }

        // If no reviews exist, hide the entire community feedback section
        if (feedbacks.length === 0) {
            submissionsSection.style.display = 'none';
            return;
        }

        // Show the section if reviews exist
        submissionsSection.style.display = 'block';

        // Clear existing elements in the container
        submissionsList.innerHTML = '';

        // Sort reviews by date descending (Newest submissions show first)
        const sortedFeedbacks = [...feedbacks].reverse();

        // Loop through and build cards for the latest 5 reviews
        const displayLimit = Math.min(sortedFeedbacks.length, 5);
        for (let i = 0; i < displayLimit; i++) {
            const entry = sortedFeedbacks[i];
            
            // Create review card elements
            const card = document.createElement('div');
            card.className = 'submission-card';

            const meta = document.createElement('div');
            meta.className = 'submission-meta';

            const nameSpan = document.createElement('span');
            nameSpan.className = 'submission-name';
            nameSpan.textContent = sanitizeInput(entry.name);

            const dateSpan = document.createElement('span');
            dateSpan.className = 'submission-date';
            dateSpan.textContent = entry.timestamp;

            const msg = document.createElement('p');
            msg.className = 'submission-msg';
            msg.textContent = sanitizeInput(entry.message);

            // Assemble components
            meta.appendChild(nameSpan);
            meta.appendChild(dateSpan);
            card.appendChild(meta);
            card.appendChild(msg);
            
            submissionsList.appendChild(card);
        }
    }

    // Displays dynamic alert banners (success or danger warnings)
    function showAlert(message, type) {
        if (!formAlert) return;

        formAlert.textContent = message;
        formAlert.className = 'form-alert'; // Reset styles
        
        if (type === 'success') {
            formAlert.classList.add('success');
        } else if (type === 'danger') {
            formAlert.classList.add('danger');
        }

        // Smoothly scroll formAlert into view if needed
        formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Clears the alert banner
    function clearAlert() {
        if (formAlert) {
            formAlert.textContent = '';
            formAlert.className = 'form-alert';
        }
    }

    // Sanitization helper to prevent Cross-Site Scripting (XSS) in local storage rendering
    function sanitizeInput(string) {
        const tempElement = document.createElement('div');
        tempElement.textContent = string;
        return tempElement.innerHTML;
    }
});
