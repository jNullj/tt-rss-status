function requestPermissions(protocol, domain, port, callback){
	// ask for permission for the new domain
	chrome.permissions.request({
	origins: [protocol +"://"+ domain +":"+ port+"/"]
	}, granted => {
		// The callback argument will be true if the user granted the permission.
		if (granted) {
			console.log('permission granted');
			alert("Settings saved");
			callback();
		} else {
			console.log('user denied permission');
			alert("Without permission to the site the app can not work");
			// no callback, dont make reqest as permission denied
		}
	});
}

function saveSettings(callback){
	// get values from form
	var protocol = document.getElementById('protocol').value;
	var domain = document.getElementById('domain').value;
	var port = document.getElementById('port').value;
	var interval = document.getElementById('interval').value;
	console.log('Got data from form');

	// set values to storage
	chrome.storage.sync.set({
					"domain": domain,
					"domain_path": document.getElementById('domain_path').value,
					"protocol": protocol,
					"tt_rss_username": document.getElementById('tt_rss_username').value,
					"port": port,
					"interval": interval
	}, callback);
}

// get settings from chrome storage into global parameters for updating feed data
function loadSettings(){
	chrome.storage.sync.get([
				'domain',
				'domain_path',
				'protocol',
				'tt_rss_username',
				'port',
				'interval']
				,result => {
					if (
						result.domain == undefined ||
						result.domain_path == undefined ||
						result.protocol == undefined ||
						result.tt_rss_username == undefined ||
						result.port == undefined ||
						result.interval == undefined
					){
						console.log('user submited empty fields');
						// inform user something is wrong
						alert("Some required settings are missing!");
					}else{
						document.getElementById('domain').value = result.domain;
						document.getElementById('domain_path').value = result.domain_path;
						document.getElementById('protocol').value = result.protocol;
						document.getElementById('tt_rss_username').value = result.tt_rss_username;
						document.getElementById('port').value = result.port;
						document.getElementById('interval').value = result.interval;
						console.log('loaded form values from storage');
					}
				})
}

// on page load
loadSettings();	// load settings in form

// listeners
// sumbit form and update settings
document.querySelector('#save_me').addEventListener('click', function(event) {
	saveSettings(	// save settings
		() => {
			var protocol = document.getElementById('protocol').value;
			var domain = document.getElementById('domain').value;
			var port = document.getElementById('port').value;
			requestPermissions( // then ask permission for new domain
				protocol,
				domain,
				port,
				() => {
					// after setting it all, reload count at indicator
					chrome.runtime.sendMessage({message: 'update_count'});
			});
	});
});
