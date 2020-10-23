// BACKGROUND SCRIPT

// onInstalled
chrome.runtime.onInstalled.addListener (function() {
	
	// Set default state values in storage
	chrome.storage.sync.set({"state": {"likeState": "NONE", "commentState": "NONE", "retweetState": "NONE"}}, function() {});
	chrome.storage.sync.set({"likeSwitch": {"checked": false}}, function() {});
	chrome.storage.sync.set({"commentSwitch": {"checked": false}}, function() {});
	chrome.storage.sync.set({"followedSwitch": {"checked": false}}, function() {});
	chrome.storage.sync.set({"retweetSwitch": {"checked": false}}, function() {});
	chrome.storage.sync.set({"retweetsFilter": []}, function() {});
	
	// Using declarativeContent API, when page changes check if host is www.twitter.com, if so activate extension button
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		chrome.declarativeContent.onPageChanged.addRules([{
			
			// Use PageStateMatcher to check pageUrl
			conditions: [new chrome.declarativeContent.PageStateMatcher({
				pageUrl: {hostPrefix: "twitter.", hostSuffix: ".com", schemes: ["http", "https"]}
			})],
			
			// Show page action from manifest
			actions: [new chrome.declarativeContent.ShowPageAction()]
		}]);
	});
});

// onUpdated
chrome.tabs.onUpdated.addListener(function (tabId , info) {

	// After tab is finished loading, send message to CS to check if we need to hide any rogue elements (asynchronous is fuuun)
	if (info.status === 'complete') 
	{
		chrome.tabs.sendMessage(tabId, {command: "manualHideCheck"});
	}
  });