(function () {
    var module = angular.module('cab9.common');
    module.service('CustomMarker', function () {
        return CustomMarker
    })

    function CustomMarker(latlng, map, imageSrc, clickEvent) {
        this.latlng_ = latlng;
        this.imageSrc = imageSrc;
        this.clickEvent = clickEvent;
        // Once the LatLng and text are set, add the overlay to the map.  This will
        // trigger a call to panes_changed which should in turn call draw.
        this.setMap(map);
    }
    CustomMarker.prototype = new google.maps.OverlayView();

    CustomMarker.prototype.hide = function () {
        if (this.div_) {
            this.div_.style.visibility = "hidden";
        }
    };

    CustomMarker.prototype.show = function () {
        if (this.div_) {
            this.div_.style.visibility = "visible";
        }
    };

    CustomMarker.prototype.draw = function () {
        // Check if the div has been created.
        var div = this.div_;
        if (!div) {
            // Create a overlay text DIV
            div = this.div_ = document.createElement('div');
            // Create the DIV representing our CustomMarker
            div.className = "customMarker"


            var img = document.createElement("img");
            img.src = this.imageSrc;
            div.appendChild(img);
            var me = this;
            google.maps.event.addDomListener(div, "click", function (event) {
                google.maps.event.trigger(me.clickEvent(me), "click");
            });

            // Then add the overlay to the DOM
            var panes = this.getPanes();
            panes.overlayImage.appendChild(div);
        }

        // Position the overlay 
        var point = this.getProjection().fromLatLngToDivPixel(this.latlng_);
        if (point) {
            div.style.left = point.x + 'px';
            div.style.top = point.y + 'px';
        }
    };

    CustomMarker.prototype.remove = function () {
        if (this.div_) {
            this.div_.parentNode.removeChild(this.div_);
            this.div_ = null;
            this.setMap(null)
        }
    };

    CustomMarker.prototype.getPosition = function () {
        return this.latlng_;
    };

    CustomMarker.prototype.setPosition = function (position) {
        this.latlng_ = position;
        var point = this.getProjection().fromLatLngToDivPixel(this.latlng_);
        if (point && this.div_) {
            this.div_.style.left = point.x + 'px';
            this.div_.style.top = point.y + 'px';
        }
    };
}());