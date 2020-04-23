Twitter.isLoggedIn(function(items) {
  
  chrome.runtime.sendMessage({type: 'popupinit'});
  chrome.storage.local.get(['mediaId', 'dataURL', 'url'], function(items) {
      if (items.mediaId !== undefined) {
        
        $('.post-wrapper').show();
        $('.post-wrapper img').attr('src', items.dataURL);
        $('.post-wrapper textarea').val(items.url);
      } else {
        $('.post-wrapper').hide();
      }
  });
  var isLoggedIn = (items.oauth_token && items.oauth_token_secret) !== undefined;
  $('#anonymous').toggle(!isLoggedIn);
  $('#authorized').toggle(isLoggedIn);
  $('#selectarea').click(function() {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var tab = tabs[0];
        chrome.tabs.executeScript(tab.id, { file: "js/jquery.js" });
        chrome.tabs.executeScript(tab.id, { file: "js/oauth.js" });
        chrome.tabs.executeScript(tab.id, { file: "js/contentScript.js" });
        chrome.tabs.insertCSS(tab.id, { file: "css/contentStyle.css" });
        window.close();
    });
  });

  $('#login').click(function() {
    chrome.runtime.sendMessage({type: 'authenticate'});
  });

  $('#logout').click(function() {
    chrome.runtime.sendMessage({type: 'logout'});
    window.close();
  });

  $('.post-btn').click(function() {
    $(this).val("posting...");
    $(this).prop( "disabled", true );
    chrome.storage.local.get(['mediaId'], function(items) {
      chrome.runtime.sendMessage({type: 'postTweet', message: $('textarea').val(), mediaId: items.mediaId });
    });
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
  if (request.type === "postTweetComplete") {
      $('.post-wrapper').html('<div class="success-message">✔ Posted successfuly</div>')
  }
  return true;
});
