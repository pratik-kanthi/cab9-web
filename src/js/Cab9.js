! function(window, $) {
    "use strict";
    window.CAB9 = function() {
        this.VERSION = "1.0.0";
        this.AUTHOR = "e9ine";
        this.pageScrollElement = "html, body";
        this.$body = $("body");
    };


    CAB9.prototype.setUserOS = function() {
            var OSName = ""; - 1 != navigator.appVersion.indexOf("Win") && (OSName = "windows"), -1 != navigator.appVersion.indexOf("Mac") && (OSName = "mac"), -1 != navigator.appVersion.indexOf("X11") && (OSName = "unix"), -1 != navigator.appVersion.indexOf("Linux") && (OSName = "linux");
            this.$body.addClass(OSName);
        },
        CAB9.prototype.setUserAgent = function() {
            navigator.userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i) ? this.$body.addClass("mobile") : (this.$body.addClass("desktop"), navigator.userAgent.match(/MSIE 9.0/) && this.$body.addClass("ie9"))
        },

        CAB9.prototype.initFormGroupDefault = function() {
            $(".form-group").click(function() {
                $(this).find(":input").focus()
            }), $("body").on("focus", ".form-group :input", function() {
                $(".form-group").removeClass("focused"), $(this).parents(".form-group").addClass("focused");
            }), $("body").on("blur", ".form-group :input", function() {
                $(this).parents(".form-group").removeClass("focused");
            }), $(".form-group .checkbox, .form-group .radio").hover(function() {
                $(this).parents(".form-group").addClass("focused");
            }, function() {
                $(this).parents(".form-group").removeClass("focused");
            })
        }
    CAB9.prototype.initSidebarToggle = function() {
            $("body").on('click touchstart', "#sidebar-toggle", function() {
                $("html").toggleClass('sidebar-visible');
            });
            $("#sidebar-right-toggle").click(function() {
                $("html").addClass('right-sidebar-visible');
            });
            $("#sidebar-right i").click(function() {
                $("html").removeClass('right-sidebar-visible');
            });
        },
        CAB9.prototype.initFastClick = function() {
            $(function() {
                excludeNode: '^pac-'
            });
        };

    CAB9.prototype.initPace = function() {
        Pace.on('done', function() {});
    }
    CAB9.prototype.setTabs = function() {
        var _width = 0;
        $(".module-item .module-item-nav-bar .tab-container ul.nav-tabs li").each(function(index) {
            _width += $(this).width();
        });
        $(".module-item .module-item-nav-bar .tab-container").width(_width + 120);
    }
    CAB9.prototype.init = function() {
        this.initFormGroupDefault(),
            this.setUserOS(),
            this.setUserAgent(),
            this.initSidebarToggle(),
            this.initPace(),
            this.initFastClick();
    }
}(window, window.jQuery);

jQuery.fn.rotate = function(degrees) {
    $(this).css({
        '-webkit-transform': 'rotate(' + degrees + 'deg)',
        '-moz-transform': 'rotate(' + degrees + 'deg)',
        '-ms-transform': 'rotate(' + degrees + 'deg)',
        'transform': 'rotate(' + degrees + 'deg)'
    });
    return $(this);
};

try {
    google.load("search", "1");
} catch (e) {}

Array.prototype.diff = function(that, comparator) {
    return this.filter(function(thisOne) {
        return that.filter(function(thatOne) {
            return comparator(thisOne, thatOne)
        }).length == 0;
    });
}

Array.prototype.changes = function(that, comparator) {
    return {
        removed: this.diff(that, comparator),
        added: that.diff(this, comparator)
    };
}
Number.prototype.toRad = function() {
    return this * Math.PI / 180;
}

Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
}

$(document).on("wheel", "input[type=number]", function (e) {
   $(this).blur();
});


SlidingMarker.initializeGlobally();