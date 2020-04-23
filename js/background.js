var ssp = ssp ? ssp : {};
ssp.background = {

    _badgeInterval  : null,
    _badgeText      : '',

    setBadgeText : function(text) {
        ssp.background._badgeText = text;
        chrome.browserAction.setBadgeText({ text : ssp.background._badgeText });
    },

    startBadgeBlink : function() {
        if (ssp.background._badgeInterval) {
            clearInterval(ssp.background._badgeInterval);
        }
        ssp.background._badgeInterval = window.setInterval(function() {
            ssp.background.setBadgeText(ssp.background._badgeText === '' ? '1' : '');
        }, 500);
        ssp.background.setBadgeText('1');
        chrome.browserAction.setBadgeBackgroundColor({ color:'#de1d14' });
    },

    stopBadgeBlink : function() {
        if (ssp.background._badgeInterval) {
            clearInterval(ssp.background._badgeInterval);
            ssp.background._badgeInterval = null;
        }
        ssp.background.setBadgeText('');
    },

    captureScreen : function(callback) {
		chrome.tabs.getCurrent(function(tabId) {
			chrome.tabs.captureVisibleTab(tabId, {format: 'png', quality: 100}, function(dataUrl) {
		        var img = new Image;
		        img.onload = function() {
		            callback(img, img.width, img.height);
		        };
		        img.src = dataUrl;
	        });
		});
	}
};

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    if (request.type === "capture") {
        ssp.background.captureScreen(function (img, imgWidth, imgHeight) {
            var scale = request.innerWidth / imgWidth;
            var dx = request.left * -1;
            var dy = request.top * -1;
            var dw = imgWidth * scale;
            var dh = imgHeight * scale;
            var canvas = document.createElement('canvas');
            canvas.width = request.width;
            canvas.height = request.height;
            canvas.getContext("2d").drawImage(img, dx, dy, dw, dh);
            var dataUrl = canvas.toDataURL();

            Twitter.uploadMedia(dataUrl.replace('data:image/png;base64,', ''), function(media_id_string) {
                ssp.background.startBadgeBlink();
                chrome.storage.local.set({ 'dataURL': dataUrl, 'url': sender.url, 'mediaId': media_id_string });
            });

            callback();
        });
    } else if (request.type === "auth") {
        callback();
        var params = Twitter.deparam(request.session);
        Twitter.api('oauth/access_token', 'POST', params, function (res) {
            Twitter.setOAuthTokens(Twitter.deparam(res), function () {});
        });
    } else if (request.type === "popupinit") {
        ssp.background.stopBadgeBlink();
    } else if (request.type === "postTweet") {
        Twitter.update(request.message, request.mediaId, function(response) {
            chrome.runtime.sendMessage({type: 'postTweetComplete'});
            chrome.storage.local.remove(['dataURL','mediaId','url']);
        });
    } else if (request.type === "authenticate") {
        Twitter.authenticate();
    } else if (request.type === "logout") {
        Twitter.logout();
    }
    return true;
});