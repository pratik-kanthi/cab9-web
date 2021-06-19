(function (angular) {
    var module = angular.module('cab9.client.passengers');

    module.controller('PassengerItemDashboardController', passengerItemDashboardController);

    passengerItemDashboardController.$inject = ['$scope', '$UI', '$config', '$http', '$q','$filter','rData'];
    function passengerItemDashboardController($scope, $UI, $config, $http, $q, $filter, rData) {
        $scope.passenger = rData[0];
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
                    tickFormatter: function (val, axis) {
                        var d = $filter('date')(moment(val).toDate(), format);
                        return d;
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
                passengerId: $scope.item.Id,
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
                passengerId: $scope.item.Id,
                from: new moment().startOf('month').format(),
                to: new moment().startOf('day').format(),
                totalsOnly: true
            }
        }).success(function (data) {
            $scope.quickStats.month = data.Totals.CountBookings;
        });

        var thisPassengerStats = $http({
            url: $config.API_ENDPOINT + '/api/stats',
            method: 'GET',
            params: {
                passengerId: $scope.item.Id,
                from: new moment().subtract(2, "weeks").startOf('day').format(),
                to: new moment().startOf('day').format(),
                fillNulls: true
            }
        });

        var avgPassengerStats = $http({
            url: $config.API_ENDPOINT + '/api/stats',
            method: 'GET',
            params: {
                from: new moment().subtract(2, "weeks").startOf('day').format(),
                to: new moment().startOf('day').format(),
                fillNulls: true
            }
        });

        $q.all([thisPassengerStats, avgPassengerStats]).then(function (results) {
            var thisPassengerData = results[0].data;

            var avgPassengerData = results[1].data;
            var avgData = {
                label: 'Avg Passenger',
                data: []
            };
            var passengerData = {
                label: $scope.item.Firstname + ' ' + $scope.item.Surname,
                data: []
            };
            $scope.bookingGraph.data.push(avgData);
            $scope.bookingGraph.data.push(passengerData);

            for (var i = 0; i < thisPassengerData.Periods.length; i++) {
                var thisD = thisPassengerData.Periods[i];
                passengerData.data.push([new moment(thisD.Date).valueOf(), thisD.CountBookings]);
            }

            for (var i = 0; i < avgPassengerData.Periods.length; i++) {
                var avgD = avgPassengerData.Periods[i];
                avgData.data.push([new moment(avgD.Date).valueOf(), avgD.CountAssignedBookings / avgD.UniquePassengers]);
            }

            $scope.lastWeekData = results[0].data.Periods.reverse().slice(0, 7);
            $scope.quickStats.today = $scope.lastWeekData[0].CountBookings;
        }, function (error) {
            //TODO: Error
        });
    }
}(angular))