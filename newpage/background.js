
function queryScreenshot(currentTab, url) {
    if (typeof(url) === 'undefined') {
        return;
    }

    console.log("query screenshot", currentTab.id, url);


    var worker = {
        /*
         * wait for tab complete event
         */
        _tabLoaded: null,
        tabLoaded: function() {
            worker._tabLoaded = $.Deferred(function() {
                console.log(".. register tab loaded listener");
                chrome.tabs.onUpdated.addListener(worker._tabLoadedListener);
            });
            return worker._tabLoaded;
        },
        _tabLoadedListener: function(tabId, changedProps) {

            // handle only this tab
            if (tabId !== currentTab.id) {
                return;
            }

            // handle only complete events
            if (changedProps.status !== "complete") {
                return;
            }

            chrome.tabs.onUpdated.removeListener(worker._tabLoadedListener);
            worker._tabLoaded.resolve();
        },
        /*
         * wait for everything to settle
         */
        wait: function() {
            console.log(".. wait")

            var timeout = $.Deferred();
            setTimeout(function() {
                timeout.resolve();
            }, 1000);
            return timeout;
        },
        /*
         * make a screenshot (make sure it is of the chosen page) 
         */
        makeAndValidateScreenshot: function() {
            console.log(".. make screenshot and validate");
            var screenshot = $.Deferred();

            chrome.tabs.captureVisibleTab(currentTab.windowId, function(dataUrl) {
                chrome.tabs.query({
                    active: true,
                    highlighted: true,
                    windowId: currentTab.windowId
                }, function(tabs) {

                    if (tabs.length !== 1) {
                        console.log("something weird happened, abort");
                        return;
                    }

                    if (tabs[0].id !== currentTab.id) {
                        console.log("user switched tab, abort");
                        return;
                    }

                    if (tabs[0].url.lastIndexOf("chrome://", 0) === 0) {
                        console.log("user went back to the new tabs page, abort");
                        return;
                    }

                    screenshot.resolveWith({}, [dataUrl]);
                });
            });
            return screenshot;
        },
        /*
         * url -> image object
         */
        loadImage: function(src) {
            console.log(".. load image");
            var load = $.Deferred();

            var image = new Image();
            image.src = src;
            image.onload = function() {
                load.resolve(image, [image]);
            };

            return load;
        },
        /*
         * scale and clip a screenshot
         */
        processScreenshot: function(image) {
            console.log(".. process screenshot");
            var process = $.Deferred();

            var scale = 420 / image.width;
            var canvas = downScaleImage(image, scale);
            var clipped = clip(canvas, 420, 75);

            // clone the canvas to preserve an untouched copy
            var cloned = document.createElement('canvas');
            var context = cloned.getContext('2d');
            cloned.width = clipped.width;
            cloned.height = clipped.height;
            context.drawImage(clipped, 0, 0);

            Caman(clipped, function() {
                //this.brightness(25);
                //this.sepia(25);
                
                this.saturation(-50);
                this.contrast(-15);
                //this.exposure(25);
                
                //this.greyscale()
                
                this.render(function() {
                    process.resolveWith(clipped, [cloned, clipped]);
                });
            });

            return process;
        },
        /**
         * prepare store dataformat
         */
        prepareStoreScreenshot: function(untouched, blended) {
            console.log(".. prepare store screenshot");
            return {
                screenshotUntouched: untouched.toDataURL(),
                screenshotBlended: blended.toDataURL()
            };
        },
        /*
         * get colors
         */
        processFavicon: function(image) {
            console.log(".. process favion");

            var colorThief = new ColorThief();
            var baseColor = new RainbowColor(colorThief.getColor(image), 'rgb');
            var keyColor = new RainbowColor('#FFFFFF', 'hex').blend(baseColor, 0.20);

            return {
                baseColor: baseColor.get('hex'),
                keyColor: keyColor.get('hex')
            };
        },
        storeInfo: function(screenshot, favicon) {
            console.log(".. store Info")
            var payload = $.extend({}, screenshot, favicon)

            var o = {};
            o[url] = payload;

            chrome.storage.local.set(o, function() {
                console.log("info stored");
            });
        }
    }

    worker.tabLoaded()
            .then(worker.wait)
            .then(worker.makeAndValidateScreenshot)
            .then(function(screenshotUrl) {

                var processScreenshot = worker
                        .loadImage(screenshotUrl)
                        .then(worker.processScreenshot)
                        .then(worker.prepareStoreScreenshot);

                var processFavicon = worker
                        .loadImage("chrome://favicon/" + url)
                        .then(worker.processFavicon);

                $.when(processFavicon, processScreenshot)
                        .then(worker.storeInfo);
            });
}


function clip(canvas, width, height) {
    var clipped = document.createElement('canvas');
    clipped.width = width;
    clipped.height = height;
    var clippedContext = clipped.getContext('2d');
    clippedContext.drawImage(canvas, 0, 0)

    return clipped;
}


// --------------------------------
// image scaling from http://stackoverflow.com/a/19144434
// --------------------------------

// scales the image by (float) scale < 1
// returns a canvas containing the scaled image.
function downScaleImage(img, scale) {
    var imgCV = document.createElement('canvas');
    imgCV.width = img.width;
    imgCV.height = img.height;
    var imgCtx = imgCV.getContext('2d');
    imgCtx.drawImage(img, 0, 0);
    return downScaleCanvas(imgCV, scale);
}

// scales the canvas by (float) scale < 1
// returns a new canvas containing the scaled image.
function downScaleCanvas(cv, scale) {
    if (!(scale < 1) || !(scale > 0))
        throw ('scale must be a positive number <1 ');
    var sqScale = scale * scale; // square scale = area of source pixel within target
    var sw = cv.width; // source image width
    var sh = cv.height; // source image height
    var tw = Math.ceil(sw * scale); // target image width
    var th = Math.ceil(sh * scale); // target image height
    var sx = 0, sy = 0, sIndex = 0; // source x,y, index within source array
    var tx = 0, ty = 0, yIndex = 0, tIndex = 0; // target x,y, x,y index within target array
    var tX = 0, tY = 0; // rounded tx, ty
    var w = 0, nw = 0, wx = 0, nwx = 0, wy = 0, nwy = 0; // weight / next weight x / y
    // weight is weight of current source point within target.
    // next weight is weight of current source point within next target's point.
    var crossX = false; // does scaled px cross its current px right border ?
    var crossY = false; // does scaled px cross its current px bottom border ?
    var sBuffer = cv.getContext('2d').
            getImageData(0, 0, sw, sh).data; // source buffer 8 bit rgba
    var tBuffer = new Float32Array(3 * sw * sh); // target buffer Float32 rgb
    var sR = 0, sG = 0, sB = 0; // source's current point r,g,b
    /* untested !
     var sA = 0;  //source alpha  */

    for (sy = 0; sy < sh; sy++) {
        ty = sy * scale; // y src position within target
        tY = 0 | ty; // rounded : target pixel's y
        yIndex = 3 * tY * tw; // line index within target array
        crossY = (tY != (0 | ty + scale));
        if (crossY) { // if pixel is crossing botton target pixel
            wy = (tY + 1 - ty); // weight of point within target pixel
            nwy = (ty + scale - tY - 1); // ... within y+1 target pixel
        }
        for (sx = 0; sx < sw; sx++, sIndex += 4) {
            tx = sx * scale; // x src position within target
            tX = 0 | tx; // rounded : target pixel's x
            tIndex = yIndex + tX * 3; // target pixel index within target array
            crossX = (tX != (0 | tx + scale));
            if (crossX) { // if pixel is crossing target pixel's right
                wx = (tX + 1 - tx); // weight of point within target pixel
                nwx = (tx + scale - tX - 1); // ... within x+1 target pixel
            }
            sR = sBuffer[sIndex    ]; // retrieving r,g,b for curr src px.
            sG = sBuffer[sIndex + 1];
            sB = sBuffer[sIndex + 2];
            /* !! untested : handling alpha !!
             sA = sBuffer[sIndex + 3];
             if (!sA) continue;
             if (sA != 0xFF) {
             sR = (sR * sA) >> 8;  // or use /256 instead ??
             sG = (sG * sA) >> 8;
             sB = (sB * sA) >> 8;
             }
             */
            if (!crossX && !crossY) { // pixel does not cross
// just add components weighted by squared scale.
                tBuffer[tIndex    ] += sR * sqScale;
                tBuffer[tIndex + 1] += sG * sqScale;
                tBuffer[tIndex + 2] += sB * sqScale;
            } else if (crossX && !crossY) { // cross on X only
                w = wx * scale;
                // add weighted component for current px
                tBuffer[tIndex    ] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                // add weighted component for next (tX+1) px                
                nw = nwx * scale
                tBuffer[tIndex + 3] += sR * nw;
                tBuffer[tIndex + 4] += sG * nw;
                tBuffer[tIndex + 5] += sB * nw;
            } else if (crossY && !crossX) { // cross on Y only
                w = wy * scale;
                // add weighted component for current px
                tBuffer[tIndex    ] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                // add weighted component for next (tY+1) px                
                nw = nwy * scale
                tBuffer[tIndex + 3 * tw    ] += sR * nw;
                tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                tBuffer[tIndex + 3 * tw + 2] += sB * nw;
            } else { // crosses both x and y : four target points involved
// add weighted component for current px
                w = wx * wy;
                tBuffer[tIndex    ] += sR * w;
                tBuffer[tIndex + 1] += sG * w;
                tBuffer[tIndex + 2] += sB * w;
                // for tX + 1; tY px
                nw = nwx * wy;
                tBuffer[tIndex + 3] += sR * nw;
                tBuffer[tIndex + 4] += sG * nw;
                tBuffer[tIndex + 5] += sB * nw;
                // for tX ; tY + 1 px
                nw = wx * nwy;
                tBuffer[tIndex + 3 * tw    ] += sR * nw;
                tBuffer[tIndex + 3 * tw + 1] += sG * nw;
                tBuffer[tIndex + 3 * tw + 2] += sB * nw;
                // for tX + 1 ; tY +1 px
                nw = nwx * nwy;
                tBuffer[tIndex + 3 * tw + 3] += sR * nw;
                tBuffer[tIndex + 3 * tw + 4] += sG * nw;
                tBuffer[tIndex + 3 * tw + 5] += sB * nw;
            }
        } // end for sx 
    } // end for sy

// create result canvas
    var resCV = document.createElement('canvas');
    resCV.width = tw;
    resCV.height = th;
    var resCtx = resCV.getContext('2d');
    var imgRes = resCtx.getImageData(0, 0, tw, th);
    var tByteBuffer = imgRes.data;
    // convert float32 array into a UInt8Clamped Array
    var pxIndex = 0; //  
    for (sIndex = 0, tIndex = 0; pxIndex < tw * th; sIndex += 3, tIndex += 4, pxIndex++) {
        tByteBuffer[tIndex] = Math.ceil(tBuffer[sIndex]);
        tByteBuffer[tIndex + 1] = Math.ceil(tBuffer[sIndex + 1]);
        tByteBuffer[tIndex + 2] = Math.ceil(tBuffer[sIndex + 2]);
        tByteBuffer[tIndex + 3] = 255;
    }
// writing result to canvas.
    resCtx.putImageData(imgRes, 0, 0);
    return resCV;
}