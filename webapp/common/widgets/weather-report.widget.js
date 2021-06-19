(function() {
    var module = angular.module('cab9.widgets');

    module.directive('weatherReport', ['$UI', '$config', '$http', '$q', '$rootScope', '$filter', '$timeout',
        function($UI, $config, $http, $q, $rootScope, $filter, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/weather-report.tmpl.html',
                scope: {
                    filters: '='
                },
                link: function(scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    scope.refresh = recalculate;
                    scope.download = download;
                    scope.$watchCollection(
                        'filters',
                        function() {
                            if (updateDebounce) {
                                $timeout.cancel(updateDebounce);
                                updateDebounce = null;
                            }
                            updateDebounce = $timeout(recalculate, 500);
                        });


                    function recalculate() {
                        scope.deferred = $q.defer();
                        scope.weather = null;
                        var apiKey = '06f9ca9efaeb898189c736f7bbf7edaa';
                        var url = 'https://api.forecast.io/forecast/';

                        $(function() {
                            $.getJSON(url + apiKey + "/" + $rootScope.COMPANY.BaseLatitude + "," + $rootScope.COMPANY.BaseLongitude + "?units=si&callback=?", function(data) {
                                var skycons = new Skycons({ "color": "#fff" });
                                skycons.add("canvas-icon-today", data.currently.icon);
                                skycons.add("canvas-icon-tomorrow", data.daily.data[2].icon);
                                skycons.add("canvas-icon-dayafter", data.daily.data[3].icon);
                                skycons.add("canvas-icon-dayafter1", data.daily.data[4].icon);
                                scope.weather = data;

                                scope.weatherWithFormat = function(weather) {
                                    if(weather)
                                        return (Math.round(weather) + '°C');
                                }
                                scope.weather.now = Math.round(data.currently.temperature) + '°C';
                                scope.weather.todayMin = Math.round(data.daily.data[0].temperatureMin) + '°C';
                                scope.weather.daily.data.map(function(item){
                                    item._DateTime = new moment('1970-01-01').add(item.time, "seconds").format("dddd");
                                });
                                skycons.play();
                            });
                        });
                        $timeout(function() {
                            scope.deferred.resolve(true);
                        }, 1000)

                    }


                    function download() {
                        var summary = reports.getFileName(scope.filters);
                        CSV.download(dataset.data.map(function(d) {
                            return {
                                date: new moment.utc(d[0]).format('DD/MM/YYYY HH:mm'),
                                value: d[1]
                            }
                        }), 'user-stats' + summary);
                    }

                }
            };
        }
    ]);
}());
