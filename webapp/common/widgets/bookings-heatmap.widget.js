(function() {
    var module = angular.module('cab9.widgets');

    module.directive('bookingsHeatmap', ['$UI', '$config', '$http', '$q', '$filter', '$rootScope', '$timeout',
        function($UI, $config, $http, $q, $filter, $rootScope, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/bookings-heatmap.tmpl.html',
                scope: {
                    filters: '='
                },
                link: function(scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    scope.refresh = recalculate;
                    scope.map = null;

                    setTimeout(function() {
                        scope.map = new google.maps.Map(document.getElementById('heatmap-div'), {
                            center: new google.maps.LatLng($rootScope.COMPANY.BaseLatitude, $rootScope.COMPANY.BaseLongitude),
                            zoom: 12,
                            zoomControl: false,
                            streetViewControlOptions: {
                                position: google.maps.ControlPosition.RIGHT_TOP
                            },
                            styles: [{ "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#193341" }] }, { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#2c5a71" }] }, { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#29768a" }, { "lightness": -37 }] }, { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#406d80" }] }, { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#406d80" }] }, { "elementType": "labels.text.stroke", "stylers": [{ "visibility": "on" }, { "color": "#3e606f" }, { "weight": 2 }, { "gamma": 0.84 }] }, { "elementType": "labels.text.fill", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "weight": 0.6 }, { "color": "#1a3541" }] }, { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#2c5a71" }] }]
                        });
                    }, 1000);

                    scope.$watchCollection(
                        'filters',
                        function() {
                            if (updateDebounce) {
                                $timeout.cancel(updateDebounce);
                                updateDebounce = null;
                            }
                            updateDebounce = $timeout(recalculate, 1000);
                        });


                    function recalculate() {
                        scope.deferred = $q.defer()
                        $http({
                            url: $config.API_ENDPOINT + 'api/bookings',
                            method: 'GET',
                            params: {
                                $filter: "BookedDateTime ge datetimeoffset'" + scope.filters.from + "' and BookedDateTime le datetimeoffset'" + scope.filters.to + "'",
                                $select: 'BookingStops/Longitude,BookingStops/Latitude',
                                $expand: 'BookingStops',
                            }
                        }).then(function(result) {
                            var heatmapData = [];

                            var bounds = new google.maps.LatLngBounds();

                            for (i = 0; i < result.data.length; i++) {
                                var _book = result.data[i];
                                if (_book.BookingStops[0] && _book.BookingStops[0].Latitude && _book.BookingStops[0].Longitude) {
                                    heatmapData.push({
                                        location: new google.maps.LatLng(_book.BookingStops[0].Latitude, _book.BookingStops[0].Longitude),
                                        weight: 1
                                    });
                                    bounds.extend(new google.maps.LatLng(_book.BookingStops[0].Latitude, _book.BookingStops[0].Longitude));
                                }
                            }

                            var _heatMapLayer = new google.maps.visualization.HeatmapLayer({
                                data: heatmapData,
                                dissipating: true,
                                radius: 50,
                                opacity: 0.75
                            });
                            _heatMapLayer.setMap(scope.map);
                            //scope.map.fitBounds(bounds);
                        });

                        scope.deferred.resolve(true);
                    }

                }
            };
        }
    ]);
}());