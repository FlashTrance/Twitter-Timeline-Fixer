// EXTENSION POPUP

// Popup elements
let hideLikes = document.getElementById("hideLikes");
let hideComments = document.getElementById("hideComments");
let hideFollowed = document.getElementById("hideFollowed");
let hideRetweets = document.getElementById("hideRetweets");
let filterButton = document.getElementById("user-filter-button");
let helpButton = document.getElementById("help-button");

// Get/set switch states from Chrome storage
chrome.storage.sync.get("likeSwitch", function(switchState) {
	hideLikes.checked = switchState.likeSwitch.checked;
});
chrome.storage.sync.get("commentSwitch", function(switchState) {
	hideComments.checked = switchState.commentSwitch.checked;
});
chrome.storage.sync.get("followedSwitch", function(switchState) {
	hideFollowed.checked = switchState.followedSwitch.checked;
});
chrome.storage.sync.get("retweetSwitch", function(switchState) {
	hideRetweets.checked = switchState.retweetSwitch.checked;
});


// SWITCHES
// onClick hideLikes switch
hideLikes.onclick = function() {
		
	// Save switch state settings
	chrome.storage.sync.set({"likeSwitch": {"checked": hideLikes.checked}}, function() 
	{ 
		// Set message based on switch state
		let msg = {command: ""};
		if (hideLikes.checked === true) { msg = { command: "hideLikes"}; } 
		else if (hideLikes.checked === false) { msg = { command: "showLikes"}; }

		sendMessageToContentScript(msg);
	});
}

// onClick hideComments switch
hideComments.onclick = function() {
		
	// Save switch state settings
	chrome.storage.sync.set({"commentSwitch": {"checked": hideComments.checked}}, function() 
	{
		// Set message based on switch state
		let msg = {command: ""};
		if (hideComments.checked === true) { msg = { command: "hideComments"}; } 
		else if (hideComments.checked === false) { msg = { command: "showComments"}; }
		
		sendMessageToContentScript(msg);
	});
}

// onClick hideFollowed switch
hideFollowed.onclick = function() {
		
	// Save switch state settings
	chrome.storage.sync.set({"followedSwitch": {"checked": hideFollowed.checked}}, function() 
	{
		// Set message based on switch state
		let msg = {command: ""};
		if (hideFollowed.checked === true) { msg = { command: "hideFollowed"}; } 
		else if (hideFollowed.checked === false) { msg = { command: "showFollowed"}; }
		
		sendMessageToContentScript(msg);
	});
}

// onClick hideRetweets switch
hideRetweets.onclick = function() {
		
	// Save switch state settings
	chrome.storage.sync.set({"retweetSwitch": {"checked": hideRetweets.checked}}, function() 
	{
		// Set message based on switch state
		let msg = {command: ""};
		if (hideRetweets.checked === true) { msg = { command: "hideRetweets"}; } 
		else if (hideRetweets.checked === false) { msg = { command: "showRetweets"}; }
		
		sendMessageToContentScript(msg);
	});
}


// BUTTONS
// onClick "Set Retweet Filter" Button
filterButton.onclick = function() {
	window.open("./user-filters.html");
}

// onClick "Help" Button
helpButton.onclick = function() {
	window.open("./help.html");
}


// OTHER FUNCTIONS
function sendMessageToContentScript(msg) {
	// Get current tab
	let params = {url: "*://*.twitter.com/*"};
	chrome.tabs.query(params, gotTabs);
	
	// Send message to content script
	function gotTabs(activeTabs) 
	{
		for (let i = 0; i < activeTabs.length; i++) { chrome.tabs.sendMessage(activeTabs[i].id, msg); }
	}
}