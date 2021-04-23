// defaults
//
// domain = "rss.example.com"
// domain_path = "/exmple/"
// protocol = "https"
// api_unread_path = "public.php?op=getUnread&login="
// tt_rss_username = "admin"
// port = "443"
// interval = 60*5

var domain;
var domain_path;
var protocol;
var api_unread_path = "public.php?op=getUnread&login=";
var tt_rss_username;
var port;
var interval = "5";
var task_timer;

// get settings from chrome storage into global parameters for updating feed data
function loadSettings(callback){
	chrome.storage.sync.get(['domain',
				'domain_path',
				'protocol',
				'tt_rss_username',
				'port',
				'interval']
				,result => {
					domain = result.domain;
					domain_path = result.domain_path;
					protocol = result.protocol;
					tt_rss_username = result.tt_rss_username;
					port = result.port;
					interval = result.interval;
					console.log('Loaded settings from storage');
					callback();
				})
}

// checks if all settings are set
function settingsExists(){
	if (	// if one of the settings required is undefined return false
		domain == undefined ||
		domain_path == undefined ||
		protocol == undefined ||
		tt_rss_username == undefined ||
		port == undefined ||
		interval == undefined
	) { return false }
	else { return true }
}

function updateUnread(callback){
	if (!settingsExists()) {
		console.log('updateUnread stopped, missing settings');
		return;
	} // if user didnt finish setup dont make a request
	request = new XMLHttpRequest();
	url = protocol +"://"+ domain +":"+ port + domain_path + api_unread_path + tt_rss_username;
	request.open("GET", url);
	request.send();
	request.onreadystatechange = function() {
		if (request.readyState == 4 && request.status == 200) {
			count = request.responseText;
			chrome.browserAction.setBadgeText({text: count});
			if(callback){
				callback();
			}
		}
	};
}

// when clicked take me to my RSS
chrome.browserAction.onClicked.addListener(clicked_me)
function clicked_me(){
	 // if user didnt finish setup, ask to complete
	if (!settingsExists()) {
		chrome.tabs.create({url: "options.html"});
	}else{
		// if setup is done, bring user to his RSS feed
		// console.log(protocol +"://"+ domain +":"+ port + domain_path);
		chrome.tabs.create({url: protocol +"://"+ domain +":"+ port + domain_path});
	}
}

function update_interval(period) {
        if (period != undefined){
        	//clearInterval(task_timer);
        	//task_timer = setInterval(updateUnread, 1000*60*period);
					chrome.alarms.clear("rss_update_alarm");
					chrome.alarms.create("rss_update_alarm",{periodInMinutes:period});
					console.log('updated alarm rss_update_alarm interval:', period, 'm');
        }
};

function onAlarm(alarm) {
  console.log('alarm fired is:', alarm);
  if (alarm && alarm.name == 'rss_update_alarm') {
    loadSettings(() => {
			updateUnread();
		});
  } else {
    console.log('Unkown alarm was called:',alarm);
  }
}
chrome.alarms.onAlarm.addListener(onAlarm);

chrome.runtime.onMessage.addListener(function(msg, sender, resp) {
	switch (msg.message) {
		case 'update_count':
			loadSettings(function() {
				updateUnread(function() {
					update_interval(parseInt(interval));
				});
			});
			break;
		default:
			console.log('Warrning: wrong message recived: ' + msg.message);
			break;
	}
	resp({'message':'done'});
});

chrome.runtime.onStartup.addListener(() => {
	loadSettings(function() {
		updateUnread(function() {
			update_interval(parseInt(interval));
		});
	});
});

// after install direct user to change settings
chrome.runtime.onInstalled.addListener(details => {
	if(details.reason == chrome.runtime.OnInstalledReason.INSTALL) {
		chrome.tabs.create({url: "options.html"});
	}
});
