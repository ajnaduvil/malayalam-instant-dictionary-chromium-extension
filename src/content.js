import olam from 'olam'; // Ensure this import works in your environment

document.addEventListener('dblclick', async (event) => {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText) {
    // Send a message to the background script with the selected text
    chrome.runtime.sendMessage({ action: "lookupWord", word: selectedText }, (response) => {
      if (response && response.definitions) {
        showPopup(event.clientX, event.clientY, response.definitions, selectedText);
      }
    });
  }
});

function showPopup(x, y, definitions, word) {
  const popup = document.createElement('div');
  Object.assign(popup.style, {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    backgroundColor: '#2a2a2a', // Dark background
    border: '1px solid #444444',
    borderRadius: '8px',
    padding: '10px', // Reduced padding
    zIndex: '9999',
    maxWidth: '220px', // Smaller width
    maxHeight: '250px', // Smaller height
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    fontSize: '11px', // Slightly smaller font size
    fontFamily: 'Arial, sans-serif',
    color: '#ffffff', // Light text color
    transition: 'opacity 0.3s ease-in-out',
    opacity: '0'
  });

  // Custom scrollbar styles
  const scrollbarStyles = `
    #olam-popup::-webkit-scrollbar {
      width: 2px; // Smaller scrollbar width
    }
    #olam-popup::-webkit-scrollbar-thumb {
      background-color: rgba(140, 200, 255, 0.5); // Tint of main theme color
      border-radius: 4px;
    }
    #olam-popup::-webkit-scrollbar-track {
      background: #333333; // Dark track
    }
  `;

  // Add custom scrollbar styles
  const styleElement = document.createElement('style');
  styleElement.textContent = scrollbarStyles;
  document.head.appendChild(styleElement);

  // Add id to popup for scrollbar styling
  popup.id = 'olam-popup';

  // Group definitions by title
  const groupedDefinitions = definitions.reduce((acc, def) => {
    if (!acc[def.title]) {
      acc[def.title] = [];
    }
    acc[def.title].push(def);
    return acc;
  }, {});

  const content = Object.entries(groupedDefinitions).map(([title, defs]) => `
    <div style="margin-bottom: 10px;">
      <p style="margin: 0 0 5px; font-weight: bold; font-size: 12px; color: rgba(140, 199, 255, 0.95);">${title}</p>
      <ul style="list-style-type: none; padding-left: 0; margin: 0;">
        ${defs.map(def => `
          <li style="margin: 0 0 5px; line-height: 1.4; position: relative; padding-left: 12px; transition: background 0.2s; cursor: pointer;">
            <span style="position: absolute; left: 0; top: 0; color: rgba(140, 200, 255, 0.7);">•</span>
            <span style="color: rgba(255, 255, 255, 0.9);">${def.meaning}</span> <!-- Less pronounced color -->
            ${def.partOfSpeech !== null ? `<span style="font-size: 8px; font-style: italic; color: rgba(170, 170, 170, 0.8);">(${def.partOfSpeech})</span>` : ''} <!-- Smaller font size -->
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');

  const closeButton = `
    <button style="position: absolute; right: 5px; top: 5px; background: none; border: none; font-size: 16px; cursor: pointer; color: rgba(140, 199, 255, 0.85); padding: 2px;" onclick="this.parentElement.remove();">✖</button>
  `;

  const moreLink = `
    <p style="margin: 5px 0 0; text-align: right;">
      <a href="https://olam.in/dictionary/english/malayalam/${encodeURIComponent(word)}" target="_blank" style="color: rgba(140, 199, 255, 0.7); text-decoration: none; font-weight: bold; font-size: 12px;">More details →</a>
    </p>
  `;

  popup.innerHTML = closeButton + content + moreLink;

  document.body.appendChild(popup);

  // Trigger reflow to enable transition
  popup.offsetHeight;
  popup.style.opacity = '1';

  document.addEventListener('click', removePopup);

  function removePopup(event) {
    if (!popup.contains(event.target)) {
      popup.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(popup);
        document.removeEventListener('click', removePopup);
        document.head.removeChild(styleElement);
      }, 300);
    }
  }
}