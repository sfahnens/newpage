

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
            
            var colorThief = new ColorThief();
            $(".favicon").on("load", function(e) {         
                
                var $this = $(this);
                var color = colorThief.getColor($this[0]);
                
                
                
                var rgb = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")"
                var border = "2px solid " + rgb;
                
                $this.parent().siblings(".title").css({"border-bottom": border});
                
               console.log( $this.parent().css("border"))
                
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


