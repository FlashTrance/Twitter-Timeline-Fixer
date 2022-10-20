// CONTENT SCRIPT

// TWITTER ARTICLE DATA (default values assume Dim BG)
var ARTICLE_DIV_CLASS = "div.css-1dbjc4n.r-1ila09b.r-qklmqi.r-1adg3ll.r-1ny4l3l";
var ARTICLE_REPLY_DIV_CLASS = "div.css-1dbjc4n.r-1adg3ll.r-1ny4l3l";
const REPLY_DIV_CLASS_STRING = "css-1dbjc4n r-1adg3ll r-1ny4l3l";
const LIKED_TWEET_DATA = "M20.884 13.19c-1.351";
const REPLY_TWEET_DATA = "M1.751 10c0-4.42 3.584-8";
const FOLLOWED_TWEET_DATA = "M17.863 13.44c1.477";
const FOLLOW_TOPIC_DATA = "M12 1.75c-5.11 0-9.25";
const RETWEET_DATA = "M4.75 3.79l4.603 4.3-1.706 1.82L6";


// BODY BG COLORS
const DIM_BG = ["#15202B", "rgb(21, 32, 43)"];
const DEFAULT_BG = ["#FFFFFF", "rgb(255, 255, 255)"];
const LIGHTS_OUT_BG = ["#15202B", "rgb(0, 0, 0)"];


// INTERVAL DATA
var hideCommentHandle;
var cur_repeats = 0;
const MAX_REPEATS = 10;


// CHROME STORAGE
// Get pop-up switch values
var likesCheck = false, commentsCheck = false, followedCheck = false, topicCheck = false, retweetsCheck = false;
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
chrome.storage.sync.get("topicSwitch", function(switchState) {
	topicCheck = switchState.topicSwitch.checked;
	if (topicCheck) { hideTopic(true); }
});


// Get retweet filter data first
chrome.storage.sync.get("retweetsFilter", function(filterVal) {
	retweetsFilter = filterVal.retweetsFilter;
	
	chrome.storage.sync.get("retweetSwitch", function(switchState) {
		retweetsCheck = switchState.retweetSwitch.checked;
		if (retweetsCheck) { hideRetweets(true); }
	});
});


// ARRIVE.JS LISTENER - ARTICLES
// Using arrive.js library w/ JQuery to hide matching Twitter articles as soon as they are loaded into the DOM
$(document).arrive("article", function(articleData) 
{
	if (!location.href.includes("notification"))
	{
		// Check if body bg style is something besides DIM, so we can set article data appropriately
		bodyData = $(document).find("body");
		if (LIGHTS_OUT_BG.includes($(bodyData).css("background-color")))
		{
			ARTICLE_DIV_CLASS = "div.css-1dbjc4n.r-1igl3o0.r-qklmqi.r-1adg3ll.r-1ny4l3l";
			//ARTICLE_REPLY_DIV_CLASS = "css-1dbjc4n r-1adg3ll r-1ny4l3l";
		}
		else if (DEFAULT_BG.includes($(bodyData).css("background-color")))
		{
			ARTICLE_DIV_CLASS = "div.css-1dbjc4n.r-j5o65s.r-qklmqi.r-1adg3ll.r-1ny4l3l";
			//ARTICLE_REPLY_DIV_CLASS = "css-1dbjc4n r-1adg3ll r-1ny4l3l";
		}
		else
		{
			ARTICLE_DIV_CLASS = "div.css-1dbjc4n.r-1ila09b.r-qklmqi.r-1adg3ll.r-1ny4l3l";
			//ARTICLE_REPLY_DIV_CLASS = "div.css-1dbjc4n.r-1adg3ll.r-1ny4l3l";
		}

		// Get SVG data to check what type of article this is
		let svg_data = $(articleData).find("path").attr("d");
		console.log(svg_data);
		if (svg_data !== undefined)
		{
			// HIDE OTHERS' LIKES
			if (likesCheck == true) 
			{ 
				// Check if this SVG belongs to a Liked tweet, and if so, hide the whole article
				if (svg_data.startsWith(LIKED_TWEET_DATA))
				{
					$(articleData).closest(ARTICLE_DIV_CLASS).hide();
				}
			}
		
			// HIDE OTHERS' REPLIES
			if (commentsCheck == true) 
			{
				// Check if this SVG belongs to a Reply tweet, and if so, hide the whole article
				if (svg_data.length < 400 && svg_data.startsWith(REPLY_TWEET_DATA))
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
				// Check if this SVG belongs to a Followed By tweet, and if so, hide the whole article
				if (svg_data.startsWith(FOLLOWED_TWEET_DATA))
				{
					$(articleData).closest(ARTICLE_DIV_CLASS).hide();	
				}
			} 

			// HIDE "FOLLOW TOPIC" TWEETS
			if (topicCheck == true)
			{
				// Check if this SVG belongs to a Follow Topic tweet, and if so, hide the whole article
				if (svg_data.startsWith(FOLLOW_TOPIC_DATA))
				{
					$(articleData).closest(ARTICLE_DIV_CLASS).hide();	
				}
			}
		
			// HIDE OTHERS' RETWEETS
			if (retweetsCheck == true) 
			{ 
				// Check if this SVG belongs to a Retweet
				if (svg_data.startsWith(RETWEET_DATA))
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
	}
	
});


// receivedMessage()
// Listen for messages from popup + background script
chrome.runtime.onMessage.addListener(receivedMessage);
function receivedMessage(message, sender, sendResponse) 
{
	// POPUP MESSAGES
	// Hide Likes switch toggled
	if 		(message.command == "hideLikes") { likesCheck = true; if (!location.href.includes("notification")) { hideLikes(true); } }
	else if (message.command == "showLikes") { likesCheck = false; hideLikes(false); }
	
	// Hide Comments switch toggled
	else if (message.command == "hideComments") { commentsCheck = true; if (!location.href.includes("notification")) { hideComments(true); } }
	else if (message.command == "showComments") { commentsCheck = false; hideComments(false); }

	// Hide Followed By switch toggled
	else if (message.command == "hideFollowed") { followedCheck = true; if (!location.href.includes("notification")) { hideFollowed(true); } }
	else if (message.command == "showFollowed") { followedCheck = false; hideFollowed(false); }

	// Hide Follow Topic switch toggled
	else if (message.command == "hideTopic") { topicCheck = true; if (!location.href.includes("notification")) { hideTopic(true); } }
	else if (message.command == "showTopic") { topicCheck = false; hideTopic(false); }

	// Hide Retweets switch toggled
	else if (message.command == "hideRetweets") { retweetsCheck = true; if (!location.href.includes("notification")) { hideRetweets(true); }; }
	else if (message.command == "showRetweets") { retweetsCheck = false; hideRetweets(false); }

	// On tab loaded, hide any marked elements that might not have been caught
	else if (message.command == "manualHideCheck" && !location.href.includes("notification"))
	{
		if (likesCheck)    { hideLikes(true); }
		if (commentsCheck) { hideComments(true); }
		if (followedCheck) { hideFollowed(true); }
		if (topicCheck)	   { hideTopic(true); }
		if (retweetsCheck) { hideRetweets(true); }
	}
}


// POPUP FUNCTIONS (These run only once each time a switch is toggled)
// hideLikes()
function hideLikes(hideVal) 
{
	// The SVG images at the top of tweets define what type of tweet it is (retweet, reply, like, etc.). This is one way we can
	// find all the SVG images for each article on a Twitter timeline.
	let article_refs = $("article");
	let svg_data = "";
	article_refs.each( function(index, data)
	{
		svg_data = $(data).find("path").attr("d");

		// Check if this SVG belongs to a Liked tweet, and if so, hide the whole article
		if (svg_data !== undefined && svg_data.startsWith(LIKED_TWEET_DATA))
		{
			// Note: We're using "closest" to make sure we hide the whole div the article is contained in. Otherwise, there are some
			// extra div lines that show up on the page.
			if (hideVal === true) { $(data).closest(ARTICLE_DIV_CLASS).hide(); }
			else 				  { $(data).closest(ARTICLE_DIV_CLASS).show(); }		
		}
	});
}

// hideComments()
function hideComments(hideVal) 
{
	// Find all the SVG images for each article on a Twitter timeline.
	let article_refs = $("article");
	let svg_data = "";
	article_refs.each( function(index, data)
	{
		svg_data = $(data).find("path").attr("d");

		// Check if this SVG belongs to a Reply tweet, and if so, hide the whole article
		if (svg_data !== undefined && svg_data.length < 400 && svg_data.startsWith(REPLY_TWEET_DATA))
		{
			if (hideVal === true) 
			{ 
				// Hide the main reply article
				$(data).closest(ARTICLE_REPLY_DIV_CLASS).hide(); 

				// Hide all reply children
				for (i=1; i<10; i++) // Assuming Twitter won't be so heinous as to show more than 9 replies...
				{
					if ($(article_refs[index+i]).parent().parent()[0].className.toString() == REPLY_DIV_CLASS_STRING) 
					{ 
						$(article_refs[index+i]).parent().parent().hide(); 
					}
					else { $(article_refs[index+i]).parent().parent().hide(); break; } // This is the last reply in the thread
				}
			}
			else 
			{ 
				// Show the main reply article and all children
				$(data).closest(ARTICLE_REPLY_DIV_CLASS).show(); 
				for (i=1; i<10; i++)
				{
					if ($(article_refs[index+i]).parent().parent()[0].className.toString() == REPLY_DIV_CLASS_STRING) 
					{ 
						$(article_refs[index+i]).parent().parent().show(); 
					}
					else { $(article_refs[index+i]).parent().parent().show(); break; }
				}
			}	
		}
	});
}

// hideFollowed()
function hideFollowed(hideVal) 
{
	// Find all the SVG images for each article on a Twitter timeline.
	let article_refs = $("article");
	let svg_data = "";
	article_refs.each( function(index, data)
	{
		svg_data = $(data).find("path").attr("d");

		// Check if this SVG belongs to a tweet by someone a user we follow is following, and if so, hide the article.
		if (svg_data !== undefined && svg_data.startsWith(FOLLOWED_TWEET_DATA))
		{
			if (hideVal === true) { $(data).closest(ARTICLE_DIV_CLASS).hide(); }
			else 				  { $(data).closest(ARTICLE_DIV_CLASS).show(); }		
		}
	});
}

// hideTopic()
function hideTopic(hideVal) 
{
	// Find all the SVG images for each article on a Twitter timeline.
	let article_refs = $("article");
	let svg_data = "";
	article_refs.each( function(index, data)
	{
		svg_data = $(data).find("path").attr("d");

		// Check if this SVG belongs to a tweet by someone a user we follow is following, and if so, hide the article.
		if (svg_data !== undefined && svg_data.startsWith(FOLLOW_TOPIC_DATA))
		{
			if (hideVal === true) { $(data).closest(ARTICLE_DIV_CLASS).hide(); }
			else 				  { $(data).closest(ARTICLE_DIV_CLASS).show(); }		
		}
	});
}

// hideRetweets()
function hideRetweets(hideVal) 
{
	// Find all the SVG images for each article on a Twitter timeline.
	let article_refs = $("article");
	let svg_data = "";
	article_refs.each( function(index, data)
	{
		svg_data = $(data).find("path").attr("d");

		// Check if this SVG belongs to a Retweet
		if (svg_data !== undefined && svg_data.startsWith(RETWEET_DATA))
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
