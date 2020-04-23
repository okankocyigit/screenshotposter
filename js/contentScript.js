var overlayId = 'screenshotposter__overlay';

var overlay;
var liveSelection;
var creatingRectangle = false;
var x1 = 0;
var y1 = 0;
var x2 = 0;
var y2 = 0;
initOverlay();

function initOverlay() {
    if (document.getElementById(overlayId)) {
        console.error("Screens Extension: Select overlay already present. Please reload the page.");
        return;
    }

    overlay = document.createElement("div");
    overlay.setAttribute('id', overlayId);

    overlayHint = document.createElement("div");
    overlayHint.setAttribute('id', 'screenshotposter__overlay__hint');
    overlayHint.innerHTML = 'Drag to capture a page snippet.<hr/>Press <kbd>Esc</kbd> or click to cancel.';
    overlay.appendChild(overlayHint);

    liveSelection = document.createElement("div");
    liveSelection.setAttribute('id', 'screenshotposter__overlay__selection');
    overlay.appendChild(liveSelection);

    document.body.appendChild(overlay);
    overlay.addEventListener('mousedown', startSelectionRect);
    overlay.addEventListener('mousemove', moveSelectionRect);
    overlay.addEventListener('mouseup', endSelectionRect);

    window.addEventListener('blur', exitAndCleanUp);
    window.addEventListener('keyup', handleEscKey);
}

function exitAndCleanUp(slowly) {
    window.removeEventListener('blur', exitAndCleanUp);
    window.removeEventListener('keyup', handleEscKey);
    overlay.style.opacity = '0';
    setTimeout(function() {
        overlay.remove();
    }, slowly ? 1000 : 1);
}

function reCalc() {
    var x3 = Math.min(x1,x2);
    var x4 = Math.max(x1,x2);
    var y3 = Math.min(y1,y2);
    var y4 = Math.max(y1,y2);
    liveSelection.style.left = x3 + 'px';
    liveSelection.style.top = y3 + 'px';
    liveSelection.style.width = x4 - x3 + 'px';
    liveSelection.style.height = y4 - y3 + 'px';
}

function startSelectionRect(evt){
    x1 = evt.clientX;
    y1 = evt.clientY;
    liveSelection.style.left = x1 + 'px';
    liveSelection.style.top = y1 + 'px';
    liveSelection.style.width = '0px';
    liveSelection.style.height = '0px';
    creatingRectangle = true;
    overlay.style.background = 'transparent';
    liveSelection.style.visibility = 'visible';
}

function moveSelectionRect(evt){
    if (creatingRectangle){
        x2 = evt.clientX;
        y2 = evt.clientY;
        reCalc();
        overlayHint.style.display = 'none';
    }
}

function endSelectionRect(evt){
    overlay.style.background = 'rgba(0,0,0,0)';
    liveSelection.style.visibility = 'hidden';
    var coords = liveSelection.getBoundingClientRect();
    if (coords.width >= 3 && coords.height >= 3) {
        chrome.runtime.sendMessage({
            type            : "capture",
            left            : coords.left,
            top             : coords.top,
            width           : coords.width,
            height          : coords.height,
            clientWidth     : document.documentElement.clientWidth, 
            clientHeight    : document.documentElement.clientHeight,
            innerWidth      : window.innerWidth
        }, function(response) {
            exitAndCleanUp(true);
        });
    } else {
        exitAndCleanUp();
    }
}

function handleEscKey(e){
    if (e.keyCode === 27) {
        exitAndCleanUp();
    };
}