

document.addEventListener("DOMContentLoaded", function() {
    chrome.topSites.get(function(arr) {
        chrome.storage.local.get(null, function(data) {

            $("#list").render(arr, {
                favicon: {
                    src: function(params) {
                        return "chrome://favicon/" + this.url;
                    }
                },
                elem: {
                    href: function(params) {
                        return this.url;
                    }
                },
                thumbnail: {
                    src: function(params) {
                        return data[this.url];
                    }
                }
            });
            $(".elem").on("click", function(a) {
                chrome.tabs.captureVisibleTab(function(dataUrl) {
                    console.log(dataUrl);
                });

                var url = $(this).attr("href");

                chrome.storage.local.get(url, function(element) {

                    // TODO check if new screenshot is required
                    console.log(element);
                    console.log(chrome.runtime.lastError);

                    chrome.tabs.getCurrent(function(currentTab) {
                        var bg = chrome.extension.getBackgroundPage();
                        bg.queryScreenshot(currentTab, url);
                    });
                });
            });


        });
    });

});

function prepareScreenShot(url) {

    console.log("prepare screen")


}


