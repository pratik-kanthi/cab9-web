(function (angular) {
    var module = angular.module('cab9.driver.vehicles');

    module.controller('VehicleItemDashboardController', vehicleItemDashboardController);

    vehicleItemDashboardController.$inject = ['$scope', '$modal', '$UI', '$config', '$http', '$q'];

    function vehicleItemDashboardController($scope, $modal, $UI, $config, $http, $q) {
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
                    tickFormatter: function (val, axis) {
                        var d = new Date(val);
                        return d.getUTCDate() + "/" + (d.getUTCMonth() + 1);
                    },
                    minTickSize: [1, "day"],

                },
                yaxis: {
                    ticks: 3,
                    tickDecimals: 0
                },
            },
            data: []
        };

        var quickStatsWeek = $http({
            url: $config.API_ENDPOINT + '/api/stats',
            method: 'GET',
            params: {
                vehicleId: $scope.item.Id,
                from: new moment().startOf('isoweek').format(),
                to: new moment().startOf('day').format(),
                totalsOnly: true
            }
        }).success(function (data) {
            $scope.quickStats.week = data.Totals.CountBookings;
        });

        var quickStatsMonth = $http({
            url: $config.API_ENDPOINT + '/api/stats',
            method: 'GET',
            params: {
                vehicleId: $scope.item.Id,
                from: new moment().startOf('month').format(),
                to: new moment().startOf('day').format(),
                totalsOnly: true
            }
        }).success(function (data) {
            $scope.quickStats.month = data.Totals.CountBookings;
        });

        var thisVehicleStats = $http({
            url: $config.API_ENDPOINT + '/api/stats',
            method: 'GET',
            params: {
                vehicleId: $scope.item.Id,
                from: new moment().subtract(2, "weeks").startOf('day').format(),
                to: new moment().startOf('day').format(),
                fillNulls: true
            }
        });

        var avgVehicleStats = $http({
            url: $config.API_ENDPOINT + '/api/stats',
            method: 'GET',
            params: {
                from: new moment().subtract(2, "weeks").startOf('day').format(),
                to: new moment().startOf('day').format(),
                fillNulls: true
            }
        });

        $q.all([thisVehicleStats, avgVehicleStats]).then(function (results) {
            var thisVehicleData = results[0].data;

            var avgVehicleData = results[1].data;
            var avgData = {
                label: 'Avg Vehicle',
                data: []
            };
            var vehicleData = {
                label: $scope.item.Make + ' ' + $scope.item.Model,
                data: []
            };
            $scope.bookingGraph.data.push(avgData);
            $scope.bookingGraph.data.push(vehicleData);

            for (var i = 0; i < thisVehicleData.Periods.length; i++) {
                var thisD = thisVehicleData.Periods[i];
                vehicleData.data.push([new moment(thisD.Date).valueOf(), thisD.CountBookings]);
            }

            for (var i = 0; i < avgVehicleData.Periods.length; i++) {
                var avgD = avgVehicleData.Periods[i];
                avgData.data.push([new moment(avgD.Date).valueOf(), avgD.CountAssignedBookings / avgD.UniqueVehicles]);
            }

            $scope.lastWeekData = results[0].data.Periods.reverse().slice(0, 7);
            $scope.quickStats.today = $scope.lastWeekData[0].CountBookings;
        }, function (error) {
            //TODO: Error
        });
    }
}(angular))