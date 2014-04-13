

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

            var ct = new ColorThief();
            $(".favicon").on("load", function(e) {

                var $this = $(this);
                var color = new RainbowColor(ct.getColor($this[0]), 'rgb');


                var textColor = new RainbowColor('#FFFFFF', 'hex').blend(color, 0.20);


                $this.parent()
                        .siblings(".title")
                        .css({
                            "border-bottom": "2px solid " + color.get('hex')
                        });

                $this.parents(".elem").hover(function() {

                    $(this).css({
                        "box-shadow": "0px 0px 2px 2px " + textColor.get('hex')
                    });

                    $(".title", this).css({
                        "text-shadow": "0px 0px 1px" + textColor.get('hex')
                    });

                }, function() {
                    $(this).css({"box-shadow": "none"});
                    $(".title", this).css({"text-shadow": "none"});
                })


                $this.parent()
                        .parent()

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


