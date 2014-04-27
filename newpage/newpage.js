

document.addEventListener("DOMContentLoaded", function() {

    var d1 = new Date().getTime();

    chrome.topSites.get(function(topSites) {
        chrome.storage.local.get(null, function(data) {

            var d2 = new Date().getTime();
            console.log("till render", d2 - d1);

            var list = document.createElement("div")
            list.id = "list"

            topSites.forEach(function(site) {

                // stored or default value
                var stored = data[site.url] || {
                    baseColor: "grey",
                    keyColor: "darkGrey",
                    screenshot: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                };

                var favicon = new Image();
                favicon.className = "favicon"
                favicon.src = "chrome://favicon/" + site.url;

                var faviconContainer = document.createElement("span");
                faviconContainer.className = "height";
                faviconContainer.appendChild(favicon);

                var title = document.createElement("span");
                title.className = "title height";
                title.textContent = site.title;
                title.style.borderBottomColor = stored.baseColor;

                var url = document.createElement("span");
                url.className = "url";
                url.textContent = site.url

                var link = document.createElement("a")
                link.className = "elem";
                link.style.backgroundColor = "red";
                link.style.backgroundImage = "url(" + stored.screenshot + ")";

                link.href = site.url;
                link.addEventListener("click", function() {

                    // TODO check if screenshot is needed
                
                    chrome.tabs.getCurrent(function(currentTab) {
                        var bg = chrome.extension.getBackgroundPage();
                        bg.queryScreenshot(currentTab, site.url);
                    });

                });

                link.appendChild(faviconContainer);
                link.appendChild(title);
                link.appendChild(url);


                list.appendChild(link);
            });

            document.body.appendChild(list);

            var d3 = new Date().getTime();
            console.log("post render", d3 - d2)



//            var ct = new ColorThief();
//            $(".favicon").on("load", function() {
//
//                var _this = this
//
//                setTimeout(function() {
//
//                    var $this = $(_this);
//                    var color = new RainbowColor(ct.getColor($this[0]), 'rgb');
//                    var textColor = new RainbowColor('#FFFFFF', 'hex').blend(color, 0.20);
//
//
//
//                    $this.parent()
//                            .siblings(".title")
//                            .css({
//                                "border-bottom": "2px solid " + color.get('hex')
//                            });
//
//                    $this.parents(".elem").hover(function() {
//
//                        $(this).css({
//                            "box-shadow": "0px 0px 2px 2px " + textColor.get('hex')
//                        });
//
//                        $(".title", _this).css({
//                            "text-shadow": "0px 0px 1px" + textColor.get('hex')
//                        });
//
//                    }, function() {
//                        $(this).css({"box-shadow": "none"});
//                        $(".title", _this).css({"text-shadow": "none"});
//                    })
//
//                    console.log("load", new Date().getTime() - d4)
//                }, 0);
//            });


//            $(".elem").on("click", function(a) {
//                chrome.tabs.captureVisibleTab(function(dataUrl) {
//                    console.log(dataUrl);
//                });
//
//                var url = $(this).attr("href");
//
//                chrome.storage.local.get(url, function(element) {
//
//                    // TODO check if new screenshot is required
//                    console.log(element);
//                    console.log(chrome.runtime.lastError);
//
//                    chrome.tabs.getCurrent(function(currentTab) {
//                        var bg = chrome.extension.getBackgroundPage();
//                        bg.queryScreenshot(currentTab, url);
//                    });
//                });
//            });

            var d4 = new Date().getTime();
            console.log("post setup", d4 - d3)
        });
    });

});

