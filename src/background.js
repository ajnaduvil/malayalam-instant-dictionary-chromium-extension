import lookupWord from './index'; // Update import to use local implementation

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "lookupWord") {
    lookupWord(request.word) // Use the local function
      .then((definitions) => {
        sendResponse({ definitions });
      })
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    
    return true; // Indicates that the response is asynchronous
  }
});
