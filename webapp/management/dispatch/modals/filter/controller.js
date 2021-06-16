(function() {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchBookingFilterModalController', DispatchBookingFilterModalController);
    module.controller('DispatchDriverFilterModalController', DispatchDriverFilterModalController);

    DispatchBookingFilterModalController.$inject = ['$scope', '$modalInstance', 'rFilters', '$timeout'];

    function DispatchBookingFilterModalController($scope, $modalInstance, rFilters, $timeout) {
        $scope.filters = rFilters;
        $scope.confirmFilters = confirmFilters;
        $scope.blockFilters = function () {
            var r = blockFilters();
            return r;
        };
        $scope.$safeApply = function (fn) {
            var phase = this.$root.$$phase;
            if (phase == '$apply' || phase == '$digest') {
                if (fn && (typeof (fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

        var filterOptions = [{
                Id: 1,
                Label: "-24hr",
                Seconds: -86400
            },
            {
                Id: 2,
                Label: "-12hr",
                Seconds: -43200
            },
            {
                Id: 3,
                Label: "-6hr",
                Seconds: -21600
            },
            {
                Id: 4,
                Label: "-4hr",
                Seconds: -14400
            },
            {
                Id: 5,
                Label: "-2hr",
                Seconds: -7200
            },
            {
                Id: 6,
                Label: "-1hr",
                Seconds: -3600
            },
            {
                Id: 7,
                Label: "Now",
                Seconds: 0
            },
            {
                Id: 8,
                Label: "+1hr",
                Seconds: 3600
            },
            {
                Id: 9,
                Label: "+2hrs",
                Seconds: 7200
            },
            {
                Id: 10,
                Label: "+4hrs",
                Seconds: 14400
            },
            {
                Id: 11,
                Label: "+6hrs",
                Seconds: 21600
            },
            {
                Id: 12,
                Label: "+12hrs",
                Seconds: 43200
            },
            {
                Id: 13,
                Label: "+1 day",
                Seconds: 86400
            },
            {
                Id: 14,
                Label: "+2 days",
                Seconds: 172800
            },
            {
                Id: 15,
                Label: "+3 days",
                Seconds: 259200
            },
            {
                Id: 16,
                Label: "+4 days",
                Seconds: 345600
            },
            {
                Id: 17,
                Label: "+5 days",
                Seconds: 432000
            },
            {
                Id: 18,
                Label: "+6 days",
                Seconds: 518400
            },
            {
                Id: 19,
                Label: "+7 days",
                Seconds: 604800
            },
            {
                Id: 20,
                Label: "+8 days",
                Seconds: 691200
            },
            {
                Id: 21,
                Label: "+9 days",
                Seconds: 777600
            },
            {
                Id: 22,
                Label: "+10 days",
                Seconds: 864000
            },
            {
                Id: 23,
                Label: "+11 days",
                Seconds: 950400
            },
            {
                Id: 24,
                Label: "+12 days",
                Seconds: 1036800
            },
            {
                Id: 25,
                Label: "+13 days",
                Seconds: 1123200
            },
            {
                Id: 26,
                Label: "+14 days",
                Seconds: 1209600
            },
            {
                Id: 27,
                Label: "+15 days",
                Seconds: 1296000
            },
            {
                Id: 28,
                Label: "+16 days",
                Seconds: 1382400
            },
            {
                Id: 29,
                Label: "+17 days",
                Seconds: 1468800
            },
            {
                Id: 30,
                Label: "+18 days",
                Seconds: 1555200
            },
            {
                Id: 31,
                Label: "+19 days",
                Seconds: 1641600
            },
            {
                Id: 32,
                Label: "+20 days",
                Seconds: 1728000
            },
            {
                Id: 33,
                Label: "+21 days",
                Seconds: 1814400
            },
            {
                Id: 34,
                Label: "+22 days",
                Seconds: 1900800
            },
            {
                Id: 35,
                Label: "+23 days",
                Seconds: 1987200
            },
            {
                Id: 36,
                Label: "+24 days",
                Seconds: 2073600
            },
            {
                Id: 37,
                Label: "+25 days",
                Seconds: 2160000
            },
            {
                Id: 38,
                Label: "+26 days",
                Seconds: 2246400
            },
            {
                Id: 39,
                Label: "+27 days",
                Seconds: 2332800
            },
            {
                Id: 40,
                Label: "+28 days",
                Seconds: 2419200
            },
            {
                Id: 41,
                Label: "+29 days",
                Seconds: 2505600
            },
            {
                Id: 42,
                Label: "+30 days",
                Seconds: 2592000
            }
        ]

        var skip = false;


        $scope.status = angular.copy($scope.filters.bookingStatuses);

        $scope.timeSlider = {
            minValue: _convertSecondsToPeriod($scope.filters.fromSpan),
            maxValue: _convertSecondsToPeriod($scope.filters.toSpan),
            options: {
                floor: 1,
                ceil: 42,
                step: 1,
                pushRange: true,
                draggableRange: true,
                ticksArray: [0, 6, 25],
                noSwitching: true,
                translate: function(value) {
                    return filterOptions.find(function(x) { return x.Id == value }).Label;
                }
            }
        };

        function setupModal() {
            $scope.$broadcast('rzSliderForceRender');
        }

        function blockFilters() {
            
            var fromSeconds = _convertPeriodToSeconds($scope.timeSlider.minValue);
            var toSeconds = _convertPeriodToSeconds($scope.timeSlider.maxValue);

            if(window.allow7Days.indexOf($scope.COMPANY.Id.toUpperCase()) > -1) {
                if((toSeconds - fromSeconds) > (192 * 60 * 60)) {
                    return (toSeconds - fromSeconds);
                } else {
                    return false;
                }
            }

            if ((toSeconds - fromSeconds) > (74 * 60 * 60)) {
                return (toSeconds - fromSeconds);
            } else {
                return false;
            }
        }
        var skipSliderCheck = true;

        $scope.$watch("timeSlider.maxValue", function(newvalue) {
            if (skipSliderCheck) {
                skipSliderCheck = false;
            } else {
                if (blockFilters()) {
                    var limit = 266400;
                    if(window.allow7Days.indexOf($scope.COMPANY.Id.toUpperCase()) > -1) {
                        limit = 691200;
                    }
                    var filtered = filterOptions.filter(function(x) { return x.Seconds >= (_convertPeriodToSeconds(newvalue) - limit) });
                    $scope.timeSlider.minValue = filtered[0].Id
                    skipSliderCheck = true;
                    $timeout(function () {
                        $scope.$broadcast('rzSliderForceRender');
                    });
                }
            }
        });

        $scope.$watch("timeSlider.minValue", function (newvalue) {
            if (skipSliderCheck) {
                skipSliderCheck = false;
            } else {
                if (blockFilters()) {
                    var limit = 266400;
                    if(window.allow7Days.indexOf($scope.COMPANY.Id.toUpperCase()) > -1) {
                        limit = 691200;
                    }
                    var filtered = filterOptions.filter(function (x) { return x.Seconds <= (_convertPeriodToSeconds(newvalue) + limit) });
                    $scope.timeSlider.maxValue = filtered[filtered.length - 1].Id
                    skipSliderCheck = true;
                    $timeout(function () {
                        $scope.$broadcast('rzSliderForceRender');
                    });
                }
            }
        });

        $timeout(function() {
            setupModal();
        }, 0);

        function confirmFilters() {
            $scope.filters.fromSpan = _convertPeriodToSeconds($scope.timeSlider.minValue);
            $scope.filters.toSpan = _convertPeriodToSeconds($scope.timeSlider.maxValue);
            $scope.filters.bookingStatuses = $scope.status;
            $modalInstance.close();
        }

        function _convertPeriodToSeconds(period) {
            return filterOptions.find(function(x) { return x.Id == period }).Seconds;
        }

        function _convertSecondsToPeriod(seconds) {
            return filterOptions.find(function(x) { return x.Seconds == seconds }).Id;
        }
    }

    DispatchDriverFilterModalController.$inject = ['$scope', '$modalInstance', 'rFilters', '$timeout'];

    function DispatchDriverFilterModalController($scope, $modalInstance, rFilters, $timeout) {
        $scope.filters = rFilters;
        $scope.confirmFilters = confirmFilters;

        $scope.status = angular.copy(rFilters.driverStatuses);

        function confirmFilters() {
            $scope.filters.driverStatuses = $scope.status;
            $modalInstance.close();
        }
    }

}())
