// USER FILTERS POPUP

// Elements
let retweetsField = document.getElementById("retweets-field");
let saveButton = document.getElementById("save-button");

// Populate fields with stored values
chrome.storage.sync.get("retweetsFilter", function(filterVal) {
    if (filterVal.retweetsFilter.length > 0) { retweetsField.value = filterVal.retweetsFilter; }
});


// SAVE BUTTON
saveButton.onclick = function() {

    // Format and save strings in storage
    if (retweetsField.value.length > 0)
    {
        retweetsField.value = retweetsField.value.replaceAll("@", "");
        chrome.storage.sync.set({ "retweetsFilter": retweetsField.value.split(',').map(item => item.trim()) }, function() { reloadTabs(); });
    }
    else { chrome.storage.sync.set({ "retweetsFilter": []}, function() { reloadTabs(); }); }
}


function reloadTabs() {

    // Refresh this page
    chrome.tabs.reload();

    // Get Twitter tab(s)
    let params = { url: "*://*.twitter.com/*" };
	chrome.tabs.query(params, gotTabs);
	
	// Send message to active Twitter tabs telling them to refresh
    function gotTabs(activeTabs) 
    {
        for (let i = 0; i < activeTabs.length; i++) 
        { 
            chrome.tabs.reload(activeTabs[i].id); 
        }
	}
}
