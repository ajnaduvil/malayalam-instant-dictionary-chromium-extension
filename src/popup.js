// You can add any popup-specific functionality here

document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('olam-close-button'); // Ensure this ID matches your HTML
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            window.close(); 
        });
    }
});

