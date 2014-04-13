
function queryScreenshot(currentTab, url) {
    console.log("query screenshot", url);

    var _this = this;

    this.listener = function(tabId, changedProps) {

        // handle only this tab
        if (tabId !== currentTab.id) {
            return;
        }

        // handle only complete events
        if (changedProps.status !== "complete") {
            return;
        }

        // wait some time to settle things
        setTimeout(function() {
            chrome.tabs.captureVisibleTab(function(dataUrl) {
                console.log(url);

                var o = {};
                o[url] = dataUrl;

                chrome.storage.local.set(o, function() {
                    console.log("screenshot saved");
                });
            });
        }, 1000);


    };

    chrome.tabs.onUpdated.addListener(listener);
}