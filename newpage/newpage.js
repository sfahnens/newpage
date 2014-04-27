"use strict";

document.addEventListener("DOMContentLoaded", function() {

    var d1 = new Date().getTime();

    chrome.topSites.get(function(topSites) {
        chrome.storage.local.get(null, function(data) {

            var d2 = new Date().getTime();
            console.log("till render", d2 - d1);

            var stylesheet = document.styleSheets[0];
            var list = document.createElement("div")
            list.id = "list"

            topSites.forEach(function(site, index) {

                // stored or default value
                var stored = data[site.url] || {
                    baseColor: "grey",
                    keyColor: "darkGrey",
                    screenshotUntouched: "",
                    screenshotBlended: ""
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
                title.setAttribute("alternative", site.title);

                stylesheet.addRule("#tile-" + index + " .title",
                        "border-bottom-color: " + stored.baseColor + ";")

                var url = document.createElement("span");
                url.className = "url";
                url.textContent = site.url

                var link = document.createElement("a")
                link.id = "tile-" + index;
                link.className = "elem";

                // background images
                if (typeof (stored.screenshotBlended) !== 'undefined') {
                    stylesheet.addRule("#tile-" + index,
                            "background-image: url(" + stored.screenshotBlended + ");");
                }
                if (typeof (stored.screenshotUntouched) !== 'undefined') {
                    stylesheet.addRule("#tile-" + index + ":hover",
                            "background-image: url(" + stored.screenshotUntouched + ");");
                }

                // extra hover
                stylesheet.addRule("#tile-" + index + ":hover",
                        "box-shadow: 0px 0px 3px 3px " + stored.keyColor + ";");
                stylesheet.addRule("#tile-" + index + ":hover",
                        "border-color: " + stored.baseColor + ";");

                link.href = site.url;
                link.addEventListener("click", function() {

                    // TODO maybe check if screenshot is needed

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
        });
    });

});

