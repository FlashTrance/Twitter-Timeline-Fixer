// CONTENT SCRIPT

// TWITTER ARTICLE DATA (aka the secret sauce)
const SMALL_ICON_CLASS = "r-111h2gw r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1xzupcd";
const SMALL_ICON_CLASS_ALT = "r-111h2gw r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-meisx5";
const ARTICLE_DIV_CLASS = "div.css-1dbjc4n.r-1ila09b.r-qklmqi.r-1adg3ll.r-1ny4l3l";
const ARTICLE_REPLY_DIV_CLASS = "div.css-1dbjc4n.r-1adg3ll.r-1ny4l3l";
const LIKED_TWEET_DATA = "M12 21.638h-.014C9.403";
const REPLY_TWEET_DATA = "M14.046";
const FOLLOWED_TWEET_DATA = "M12.225 12.165c-1.356";
const RETWEET_DATA = "M23.615";

// INTERVAL DATA
var hideCommentHandle;
var cur_repeats = 0;
const MAX_REPEATS = 10;


// CHROME STORAGE
// Get pop-up switch values
var likesCheck = false, commentsCheck = false, followedCheck = false, retweetsCheck = false;
chrome.storage.sync.get("likeSwitch", function(switchState) {
	likesCheck = switchState.likeSwitch.checked;
	if (likesCheck) { hideLikes(true); }
});
chrome.storage.sync.get("commentSwitch", function(switchState) {
	commentsCheck = switchState.commentSwitch.checked;
	if (commentsCheck) { hideComments(true); }
});
chrome.storage.sync.get("followedSwitch", function(switchState) {
	followedCheck = switchState.followedSwitch.checked;
	if (followedCheck) { hideFollowed(true); }
});


// Get retweet filter data first
chrome.storage.sync.get("retweetsFilter", function(filterVal) {
	retweetsFilter = filterVal.retweetsFilter;
	
	chrome.storage.sync.get("retweetSwitch", function(switchState) {
		retweetsCheck = switchState.retweetSwitch.checked;
		if (retweetsCheck) { hideRetweets(true); }
	});
});


// ARRIVE.JS LISTENER
// Using arrive.js library w/ JQuery to hide matching Twitter articles as soon as they are loaded into the DOM
$(document).arrive("article", function(articleData) {

	// Get SVG class to make sure this is a Timeline SVG rather than a Notification SVG
	let svg_class = $(articleData).find("svg").attr("class");
	if (svg_class !== undefined && (svg_class == SMALL_ICON_CLASS.toString() || svg_class == SMALL_ICON_CLASS_ALT.toString()))
	{
		// Get SVG data to check what type of article this is
		let svg_data = $(articleData).find("path").attr("d");
	
		// HIDE OTHERS' LIKES
		if (likesCheck == true) 
		{ 
			// Check if this SVG belongs to a Liked tweet, and if so, hide the whole article
			if (svg_data !== undefined && svg_data.startsWith(LIKED_TWEET_DATA))
			{
				$(articleData).closest(ARTICLE_DIV_CLASS).hide();
			}
		}
	
		// HIDE OTHERS' REPLIES
		if (commentsCheck == true) 
		{
			// Check if this SVG belongs to a Reply tweet, and if so, hide the whole article
			if (svg_data !== undefined && svg_data.startsWith(REPLY_TWEET_DATA))
			{
				// Get references to what we want to hide so we know when to stop the timer
				var reply_div = $(articleData).closest(ARTICLE_REPLY_DIV_CLASS).parent().next();
				var parent_div = $(articleData).closest(ARTICLE_REPLY_DIV_CLASS);
	
				hideCommentHandle = setInterval(hideReplyTimer, 200, reply_div, parent_div);
			}
		} 
	
		// HIDE "FOLLOWED BY" TWEETS
		if (followedCheck == true) 
		{ 
			// Check if this SVG belongs to a Retweet, and if so, hide the whole article
			if (svg_data !== undefined && svg_data.startsWith(FOLLOWED_TWEET_DATA))
			{
				$(articleData).closest(ARTICLE_DIV_CLASS).hide();	
			}
		} 
	
		// HIDE OTHERS' RETWEETS
		if (retweetsCheck == true) 
		{ 
			// Check if this SVG belongs to a Retweet
			if (svg_data !== undefined && svg_data.startsWith(RETWEET_DATA))
			{
				// If no filter is applied, just hide the Retweet
				if (retweetsFilter.length == 0) { $(articleData).closest(ARTICLE_DIV_CLASS).hide(); }
	
				else
				{
					// If user has any handles in the Retweet Filter, get the Twitter handle of the Retweeter and check if it's listed
					let twitter_handle = $(articleData).find("a").attr("href");
					twitter_handle = twitter_handle.slice(1, twitter_handle.length);
	
					if (retweetsFilter.includes(twitter_handle)) { $(articleData).closest(ARTICLE_DIV_CLASS).hide(); }	
				}
			}
		} 
	}
});


// receivedMessage()
// Listen for messages from popup + background script
chrome.runtime.onMessage.addListener(receivedMessage);
function receivedMessage(message, sender, sendResponse) {

	// POPUP MESSAGES
	// Hide Likes switch toggled
	if 		(message.command == "hideLikes") { likesCheck = true; hideLikes(true); }
	else if (message.command == "showLikes") { likesCheck = false; hideLikes(false); }
	
	// Hide Comments switch toggled
	else if (message.command == "hideComments") { commentsCheck = true; hideComments(true); }
	else if (message.command == "showComments") { commentsCheck = false; hideComments(false); }

	// Hide Followed By switch toggled
	else if (message.command == "hideFollowed") { followedCheck = true; hideFollowed(true); }
	else if (message.command == "showFollowed") { followedCheck = false; hideFollowed(false); }
	
	// Hide Retweets switch toggled
	else if (message.command == "hideRetweets") { retweetsCheck = true; hideRetweets(true); }
	else if (message.command == "showRetweets") { retweetsCheck = false; hideRetweets(false); }

	// On tab loaded, hide any marked elements that might not have been caught
	else if (message.command == "manualHideCheck")
	{
		if (likesCheck)    { hideLikes(true); }
		if (commentsCheck) {hideComments(true);}
		if (followedCheck) {hideFollowed(true);}
		if (retweetsCheck) {hideRetweets(true);}
	}
}


// POPUP FUNCTIONS (These run only once each time a switch is toggled)
// hideLikes()
function hideLikes(hideVal) {

	// The SVG images at the top of tweets define what type of tweet it is (retweet, reply, like, etc.). This is one way we can
	// find all the SVG images for each article on a Twitter timeline.
	let article_refs = $("article");
	let svg_data = "", svg_class = "";
	article_refs.each( function(index, data)
	{
		svg_data = $(data).find("path").attr("d");
		svg_class = $(data).find("svg").attr("class");

		// Check if this SVG belongs to a Liked tweet, and if so, hide the whole article
		if (svg_data !== undefined && svg_class !== undefined && (svg_class == SMALL_ICON_CLASS.toString() || svg_class == SMALL_ICON_CLASS_ALT.toString()) && svg_data.startsWith(LIKED_TWEET_DATA))
		{
			// Note: We're using "closest" to make sure we hide the whole div the article is contained in. Otherwise, there are some
			// extra div lines that show up on the page.
			if (hideVal === true) { $(data).closest(ARTICLE_DIV_CLASS).hide(); }
			else 				  { $(data).closest(ARTICLE_DIV_CLASS).show(); }		
		}
	});
}

// hideComments()
function hideComments(hideVal) {
	
	// Find all the SVG images for each article on a Twitter timeline.
	let article_refs = $("article");
	let svg_data = "", svg_class = "";
	article_refs.each( function(index, data)
	{
		svg_data = $(data).find("path").attr("d");
		svg_class = $(data).find("svg").attr("class");

		// Check if this SVG belongs to a Reply tweet, and if so, hide the whole article
		if (svg_data !== undefined &&  svg_class !== undefined && (svg_class == SMALL_ICON_CLASS.toString() || svg_class == SMALL_ICON_CLASS_ALT.toString()) && svg_data.startsWith(REPLY_TWEET_DATA))
		{
			if (hideVal === true) 
			{ 
				// We need to hide both the main article and the one right after it, which is the reply
				$(data).closest(ARTICLE_REPLY_DIV_CLASS).hide(); 
				$(article_refs[index+1]).closest(ARTICLE_DIV_CLASS).parent().hide();
			}
			else 
			{ 
				// We need to show both the main article and the one right after it, which is the reply
				$(data).closest(ARTICLE_REPLY_DIV_CLASS).show(); 
				$(article_refs[index+1]).closest(ARTICLE_DIV_CLASS).parent().show();
			}	
		}
	});
}

// hideFollowed()
function hideFollowed(hideVal) {
	
	// Find all the SVG images for each article on a Twitter timeline.
	let article_refs = $("article");
	let svg_data = "", svg_class = "";
	article_refs.each( function(index, data)
	{
		svg_data = $(data).find("path").attr("d");
		svg_class = $(data).find("svg").attr("class");

		// Check if this SVG belongs to a tweet by someone a user we follow is following, and if so, hide the article.
		if (svg_data !== undefined && svg_class !== undefined && (svg_class == SMALL_ICON_CLASS.toString() || svg_class == SMALL_ICON_CLASS_ALT.toString()) && svg_data.startsWith(FOLLOWED_TWEET_DATA))
		{
			if (hideVal === true) { $(data).closest(ARTICLE_DIV_CLASS).hide(); }
			else 				  { $(data).closest(ARTICLE_DIV_CLASS).show(); }		
		}
	});
}

// hideRetweets()
function hideRetweets(hideVal) {
	
	// Find all the SVG images for each article on a Twitter timeline.
	let article_refs = $("article");
	let svg_data = "", svg_class = "";
	article_refs.each( function(index, data)
	{
		svg_data = $(data).find("path").attr("d");
		svg_class = $(data).find("svg").attr("class");

		// Check if this SVG belongs to a Retweet
		if (svg_data !== undefined && svg_class !== undefined && (svg_class == SMALL_ICON_CLASS.toString() || svg_class == SMALL_ICON_CLASS_ALT.toString()) && svg_data.startsWith(RETWEET_DATA))
		{
			// If no filter is applied, just hide the Retweet
			if (hideVal == true && retweetsFilter.length == 0) { $(data).closest(ARTICLE_DIV_CLASS).hide(); }

			else if (hideVal == true)
			{
				// If user has any handles in the Retweet Filter, get the Twitter handle of the Retweeter and check if it's listed
				let twitter_handle = $(data).find("a").attr("href");
				twitter_handle = twitter_handle.slice(1, twitter_handle.length);

				if (retweetsFilter.includes(twitter_handle)) { $(data).closest(ARTICLE_DIV_CLASS).hide(); }	
			}

			else { $(data).closest(ARTICLE_DIV_CLASS).show(); }	
		}
	});
}


// hideReplyTimer()
// Hiding the article + reply for these is very inconsistent because of how Twitter loads its articles, so using an interval to help
// ensure we catch them.
function hideReplyTimer(reply_div, parent_div)
{
	// Keep running this function until we're sure they're hidden
	cur_repeats += 1;
	if ((reply_div.is(":hidden") && parent_div.is(":hidden")) || cur_repeats >= MAX_REPEATS)
	{
		clearInterval(hideCommentHandle);
		cur_repeats = 0;
	}

	// This method seems to work best to hide them consistently
	hideComments(true);
}
