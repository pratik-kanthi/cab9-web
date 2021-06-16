(function(angular) {
    var module = angular.module('cab9.drivers');

    module.controller('DriverItemDashboardController', driverItemDashboardController);

    driverItemDashboardController.$inject = ['$scope', '$UI', '$config', '$http', '$q', '$filter', 'rData'];

    function driverItemDashboardController($scope, $UI, $config, $http, $q, $filter, rData) {
        $scope.driver = rData[0];
        $scope.dispayMode = 'VIEW';
        var format = $scope.DATETIME_FORMAT.replace(/[.|/|-][y|Y][y|Y]*/g, '');
        $scope.quickStats = {
            today: "-",
            week: "-",
            month: "-"
        };
        $scope.bookingGraph = {
            options: {
                series: {
                    lines: {
                        show: true,
                        lineWidth: 2,
                        fill: true,
                        fillColor: {
                            colors: [{
                                opacity: 0.4
                            }, {
                                opacity: 0.4
                            }]
                        }
                    },
                    points: {
                        show: true,
                        lineWidth: 2
                    },
                    shadowSize: 0
                },
                grid: {
                    hoverable: true,
                    clickable: true,
                    tickColor: "#eee",
                    borderWidth: 0
                },
                colors: [$UI.COLOURS.lighterGrey, $UI.COLOURS.brandPrimary],
                xaxis: {
                    mode: "time",
                    tickFormatter: function(val, axis) {
                        var d = $filter('date')(moment(val).toDate(), format);
                        return d;
                    },
                    minTickSize: [1, "day"],
                },
                yaxis: {
                    min: 0,
                    minTickSize: 1,
                    ticks: 3,
                    tickDecimals: 0
                },
            },
            data: []
        };

        var quickStatsWeek = $http({
            url: $config.API_ENDPOINT + '/api/reports/booking',
            method: 'GET',
            params: {
                driverIds: "'" + $scope.item.Id + "'",
                from: new moment().startOf('isoweek').format(),
                to: new moment().startOf('day').format(),
                periodLength: 'ww'
            }
        }).success(function(data) {
            $scope.quickStats.week = data.Totals.TotalBookings;
        });

        var quickStatsMonth = $http({
            url: $config.API_ENDPOINT + '/api/reports/booking',
            method: 'GET',
            params: {
                driverIds: "'" + $scope.item.Id + "'",
                from: new moment().startOf('month').format(),
                to: new moment().startOf('day').format(),
                periodLength: 'mm'
            }
        }).success(function(data) {
            $scope.quickStats.month = data.Totals.TotalBookings;
        });

        var thisDriverStats = $http({
            url: $config.API_ENDPOINT + '/api/stats',
            method: 'GET',
            params: {
                driverId: $scope.item.Id,
                from: new moment().subtract(2, "weeks").startOf('day').format(),
                to: new moment().startOf('day').format(),
                fillNulls: true
            }
        });

        var avgDriverStats = $http({
            url: $config.API_ENDPOINT + '/api/stats',
            method: 'GET',
            params: {
                from: new moment().subtract(2, "weeks").startOf('day').format(),
                to: new moment().startOf('day').format(),
                fillNulls: true
            }
        });

        $q.all([thisDriverStats, avgDriverStats]).then(function(results) {
            var thisDriverData = results[0].data;

            var avgDriverData = results[1].data;
            var avgData = {
                label: 'Avg Driver',
                data: []
            };
            var driverData = {
                label: $scope.item.Firstname + ' ' + $scope.item.Surname,
                data: []
            };
            $scope.bookingGraph.data.push(avgData);
            $scope.bookingGraph.data.push(driverData);

            for (var i = 0; i < thisDriverData.Periods.length; i++) {
                var thisD = thisDriverData.Periods[i];
                driverData.data.push([new moment(thisD.Date).valueOf(), thisD.CountBookings]);
            }

            for (var i = 0; i < avgDriverData.Periods.length; i++) {
                var avgD = avgDriverData.Periods[i];
                avgData.data.push([new moment(avgD.Date).valueOf(), avgD.CountAssignedBookings / avgD.UniqueDrivers]);
            }

            $scope.lastWeekData = results[0].data.Periods.reverse().slice(0, 7);
            $scope.quickStats.today = $scope.lastWeekData[0].CountBookings;
        }, function(error) {
            //TODO: Error
        });
    }
}(angular));
