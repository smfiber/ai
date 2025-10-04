import { CONSTANTS, state } from './config.js';

// --- GENERIC MODAL HELPERS ---

/**
 * Opens a modal dialog by its ID.
 * @param {string} modalId The ID of the modal element to open.
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('is-open');
        document.body.classList.add('modal-open');
    }
}

/**
 * Closes a modal dialog by its ID.
 * @param {string} modalId The ID of the modal element to close.
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('is-open');
        const anyModalOpen = document.querySelector('.modal.is-open');
        if (!anyModalOpen) {
            document.body.classList.remove('modal-open');
        }
    }
}

/**
 * Displays a temporary message in a dedicated message modal.
 * @param {string} message The message to display.
 * @param {string} type The type of message ('info', 'warning', 'error').
 * @param {number} duration The time in milliseconds before the modal auto-closes.
 */
export function displayMessageInModal(message, type = 'info', duration = 4000) {
    const modal = document.getElementById(CONSTANTS.MODAL_MESSAGE);
    const content = modal.querySelector('.modal-content');
    if (!content) return;

    const typeClasses = {
        info: 'bg-blue-100 border-blue-500 text-blue-700',
        warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
        error: 'bg-red-100 border-red-500 text-red-700',
    };

    content.innerHTML = `<div class="p-6 rounded-lg border-l-4 ${typeClasses[type] || typeClasses.info}" role="alert">
                           <p class="font-bold">${type.charAt(0).toUpperCase() + type.slice(1)}</p>
                           <p>${message}</p>
                         </div>`;
    openModal(CONSTANTS.MODAL_MESSAGE);
    setTimeout(() => closeModal(CONSTANTS.MODAL_MESSAGE), duration);
}

/**
 * Opens a confirmation dialog with a specific action.
 * @param {string} title The title for the confirmation dialog.
 * @param {string} message The message/question to ask the user.
 * @param {function} onConfirm A callback function to execute if the user confirms.
 */
export function openConfirmationModal(title, message, onConfirm) {
    document.getElementById('confirmation-title').textContent = title;
    document.getElementById('confirmation-message').textContent = message;

    const confirmButton = document.getElementById('confirm-button');
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    newConfirmButton.addEventListener('click', () => {
        closeModal(CONSTANTS.MODAL_CONFIRMATION);
        onConfirm();
    }, { once: true });

    openModal(CONSTANTS.MODAL_CONFIRMATION);
}

/**
 * Opens the "Deep Dive" modal for a specific stock ticker.
 * @param {string} ticker The stock ticker symbol.
 */
export function openDeepDiveModal(ticker) {
    const modalId = 'deepDiveModal';
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Set title and reset content areas
    const titleEl = document.getElementById('deep-dive-modal-title');
    const filingsContainer = document.getElementById('historical-filings-container');
    const analysisContainer = document.getElementById('filing-analysis-container');

    const stock = state.portfolioCache.find(s => s.ticker === ticker);
    const companyName = stock ? stock.companyName : ticker;
    
    titleEl.textContent = `Deep Dive: ${companyName} (${ticker})`;
    filingsContainer.innerHTML = '<div class="loader mx-auto my-8"></div>';
    analysisContainer.innerHTML = `<div class="text-center text-gray-500 pt-16">Select a filing to view or analyze.</div>`;
    
    openModal(modalId);
}
