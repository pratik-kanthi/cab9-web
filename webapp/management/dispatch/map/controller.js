(function (angular) {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchMapController', DispatchMapController);

    DispatchMapController.$inject = ['$scope', '$config', 'rCompany', 'Google', '$timeout', 'Model', 'CustomMarker', '$http'];

    function DispatchMapController($scope, $config, rCompany, Google, $timeout, Model, CustomMarker, $http) {
        var company = rCompany[0];

        var bookingCluster;

        var trafficLayer;

        var heatmapLayer;

        var infoWindow;


        $scope.dispatchObj.map = {
            // google maps object
            mapObject: null,

            displayOptions: {
                //0 - Off, 1 - Scattered, 2 - Clustered
                bookings: 1,

                //0 - Off, 1 - Scattered, 2 - Clustered
                drivers: 1,
                traffic: false,
                heatmap: false
            },

            bookingMarkers: {},

            driverMarkers: {},
            partnerDriverMarkers: {},

            updatePartnerDriverMarkers: updatePartnerDriverMarkers,
            updateDriverMarkers: updateDriverMarkers,
            updateDriverMarker: updateDriverMarker,

            // function that draws route for a booking. pass cleaarRoute(null) to clear the
            // selected route.
            drawRoute: drawRoute,

            getMarkerForDriver: _getMarkerForDriver,

            updateBookingMarkers: updateBookingMarkers,

            updateFocus: updateFocus,
            toggleTrafficLayer: toggleTrafficLayer,

            select: select,

            selected: {
                bookingId: null,
                driverId: null
            }
        }

        var trafficLayer = null;

        var directionsRenderer = null;
        var routeMarkers = [];

        initMap();

        function initMap() {
            var center = new google.maps.LatLng(company.DispatchLatitude || 51.496384198223355, company.DispatchLongitude || -0.12875142186092202);

            $scope.dispatchObj.map.mapObject = new google.maps.Map(document.getElementById('dispatch-map'), {
                center: center,
                zoom: company.DispatchZoom || 11,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER
                },
                //styles: mapStyles,
                panControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                },
                mapTypeControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER
                },
            });
            //$scope.map.addListener('center_changed', onViewChanged);
            //$scope.map.addListener('zoom_changed', onViewChanged);
        }

        function updateFocus() {
            if ($scope.dispatchObj.map.selected.bookingId) {
                var booking = $scope.dispatchObj.bookings.items.filter(function (ds) {
                    return ds.Id == $scope.dispatchObj.map.selected.bookingId;
                })[0];
                var driver = null;
                var partnerDriver = null;
                if (booking && booking.DriverId) {
                    driver = $scope.dispatchObj.drivers.items.filter(function (ds) {
                        return ds.DriverId == booking.DriverId
                    })[0];
                }
                if (booking && booking.PartnerDriverId) {
                    partnerDriver = booking.PartnerDriver;
                }
                $scope.dispatchObj.map.select(booking, driver, partnerDriver);
            } else if ($scope.dispatchObj.map.selected.driverId) {
                var driver = $scope.dispatchObj.drivers.items.filter(function (ds) {
                    return ds.DriverId == $scope.dispatchObj.map.selected.driverId
                })[0];
                $scope.dispatchObj.map.select(null, driver);
            }
        }

        var pDriverMarker = null;

        function fetchPartnerDrivers() {
            $http
                .get($config.API_ENDPOINT + 'api/partners/drivers')
                .success(function (data) {
                    $scope.dispatchObj.partnerDrivers.items.length = 0;
                    $timeout(function () {
                        $scope.dispatchObj.partnerDrivers.items = data;
                        $scope
                            .dispatchObj
                            .map
                            .updatePartnerDriverMarkers();
                        $scope
                            .dispatchObj
                            .map
                            .updateFocus();
                    }, 0);
                })
        }

        function select(booking, driver, partnerDriver) {
            if (pDriverMarker != null) {
                pDriverMarker.setMap(null);
                pDriverMarker = null;
            }
            var bounds = new google.maps.LatLngBounds();

            //console.log("Selected: ", booking, driver);
            _clearRoute();

            $scope.dispatchObj.map.selected.bookingId = null;
            $scope.dispatchObj.map.selected.driverId = null;

            if (booking) {
                delete booking.$new;
                $scope.dispatchObj.map.selected.bookingId = booking.Id;
                $scope.loading = true;
                _getDirectionsForBooking(booking);
                angular.forEach(booking.BookingStops, function (bs) {
                    if (bs.Latitude && bs.Longitude) {
                        var position = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                        bounds.extend(position);
                    }
                });
                $scope.dispatchObj.partnerDrivers.items.length = 0;
                $scope
                    .dispatchObj
                    .map
                    .updatePartnerDriverMarkers();
            } else {
                fetchPartnerDrivers();
            }
            if (driver) {
                $scope.dispatchObj.map.selected.driverId = driver.DriverId;
                var marker = $scope.dispatchObj.map.driverMarkers[driver.DriverId];
                bounds.extend(marker.getPosition());
            } else if (booking) {
                $scope.dispatchObj.map.selected.driverId = booking.DriverId;
            }
            if (partnerDriver) {
                if (partnerDriver.LastKnownLatitude) {
                    pDriverMarker = new google.maps.Marker({
                        position: new google.maps.LatLng(partnerDriver.LastKnownLatitude, partnerDriver.LastKnownLongitude),
                        zIndex: google.maps.Marker.MAX_ZINDEX + 1,
                        icon: {
                            url: '/includes/images/car1.png',
                            scaledSize: new google.maps.Size(32, 42)
                        },
                        map: $scope.dispatchObj.map.mapObject
                    });
                    $scope.dispatchObj.map.selected.driverId = booking.PartnerDriverId;
                    bounds.extend(pDriverMarker.getPosition());
                }
            } else if (booking) {
                $scope.dispatchObj.map.selected.driverId = booking.DriverId;
            }

            if (booking) {
                $scope.dispatchObj.map.mapObject.fitBounds(bounds);
            } else if (driver) {
                var marker = $scope.dispatchObj.map.driverMarkers[driver.DriverId];
                if (marker) {
                    $scope.dispatchObj.map.mapObject.panTo(marker.getPosition());
                    $scope.dispatchObj.map.mapObject.setZoom(16);
                }
            } else {
                var center = new google.maps.LatLng(company.DispatchLatitude || 51.496384198223355, company.DispatchLongitude || -0.12875142186092202);

                $scope.dispatchObj.map.mapObject.setCenter(center);
                $scope.dispatchObj.map.mapObject.setZoom(company.DispatchZoom || 11);
            }

            updateBookingMarkers();
            updateDriverMarkers();
        }

        function updateBookingMarkers() {
            var newMarkers = {};
            angular.forEach($scope.dispatchObj.bookings.items, function (b) {
                if ($scope.dispatchObj.map.bookingMarkers[b.Id]) {
                    var existing = $scope.dispatchObj.map.bookingMarkers[b.Id];
                    var pickup = b.BookingStops[0];
                    if (pickup && pickup.Latitude && pickup.Longitude) {
                        existing.setPosition(new google.maps.LatLng(pickup.Latitude, pickup.Longitude));
                        existing.setVisible(false) //(!$scope.dispatchObj.map.selected.bookingId || $scope.dispatchObj.map.selected.bookingId == b.Id);
                    }
                    newMarkers[b.Id] = existing;
                    delete $scope.dispatchObj.map.bookingMarkers[b.Id];
                } else {
                    newMarkers[b.Id] = _getMarkerForBooking(b);
                }
            });

            angular.forEach($scope.dispatchObj.map.bookingMarkers, function (value, key) {
                if (value)
                    value.setMap(null);
            });

            $scope.dispatchObj.map.bookingMarkers = newMarkers;
        }

        function updateDriverMarkers() {
            var newMarkers = {};

            //update/create markers
            angular.forEach($scope.dispatchObj.drivers.items, function (shift) {
                var marker = updateDriverMarker(shift, true);
                newMarkers[shift.DriverId] = marker;
            });

            //remove old markers
            angular.forEach($scope.dispatchObj.map.driverMarkers, function (value, key) {
                if (value)
                    value.setMap(null);
            });



            $scope.dispatchObj.map.driverMarkers = newMarkers;
        }

        function updatePartnerDriverMarkers() {
            var newMarkers = {};
            //update/create markers
            $scope.dispatchObj.partnerDrivers.items.map(function (item) {
                var marker = updatePartnerDriverMarker(item, true);
                newMarkers[item.DriverId] = marker;
            });

            for (var p in $scope.dispatchObj.map.partnerDriverMarkers) {
                if (!newMarkers[p] && $scope.dispatchObj.map.partnerDriverMarkers[p]) {
                    $scope.dispatchObj.map.partnerDriverMarkers[p].remove();
                }
            }
            $scope.dispatchObj.map.partnerDriverMarkers = newMarkers;
        }

        function updateDriverMarker(s, remove) {
            if ($scope.dispatchObj.map.driverMarkers[s.DriverId]) {
                var existing = $scope.dispatchObj.map.driverMarkers[s.DriverId];
                if (s.LastKnownLatitude && s.LastKnownLongitude) {
                    existing.setIcon({
                        url: $config.API_ENDPOINT + 'api/imagegen?driverId=' + s.DriverId + "&status=" + s.DriverStatus + "&callsign=" + s.DriverCallsign,
                        scaledSize: new google.maps.Size(45, 58)
                    });
                    existing.setPosition(new google.maps.LatLng(s.LastKnownLatitude, s.LastKnownLongitude));
                    existing.setVisible((!$scope.dispatchObj.map.selected.bookingId || !$scope.dispatchObj.map.selected.driverId || $scope.dispatchObj.map.selected.driverId == s.DriverId));
                }
                if (remove) {
                    delete $scope.dispatchObj.map.driverMarkers[s.DriverId];
                }
                return existing;
            } else {
                var marker = _getMarkerForDriver(s);
                if (!remove) {
                    $scope.dispatchObj.map.driverMarkers[s.DriverId] = marker;
                }
                return marker;
            }
        }

        function updatePartnerDriverMarker(s, remove) {
            if ($scope.dispatchObj.map.partnerDriverMarkers[s.DriverId]) {
                var existing = $scope.dispatchObj.map.partnerDriverMarkers[s.DriverId];
                if (s.LastKnownLatitude && s.LastKnownLongitude) {
                    existing.setPosition(new google.maps.LatLng(s.LastKnownLatitude, s.LastKnownLongitude));
                    existing.setOptions({
                        visible: (!$scope.dispatchObj.map.selected.bookingId)
                    })
                }
                return existing;
            } else {
                var marker = new CustomMarker(new google.maps.LatLng(s.LastKnownLatitude, s.LastKnownLongitude), $scope.dispatchObj.map.mapObject, window.formatImage(s.LogoUrl, s.CompanyName));
                marker.setOptions({
                    visible: (!$scope.dispatchObj.map.selected.bookingId)
                })
                return marker;
            }
        }

        var mapDisplayInitializing = true;
        $scope.$watch('dispatchObj.map.displayOptions', function (newValue, oldvalue) {
            if (mapDisplayInitializing) {
                $timeout(function () {
                    mapDisplayInitializing = false;
                });
            } else {
                if (newValue.bookings != oldvalue.bookings) {
                    switch (Number(newValue.bookings)) {
                        case 0:
                            plotMarkers(null);
                            _clearBookingCluster();
                            break;
                        case 1:
                            plotMarkers($scope.dispatchObj.bookings.items);
                            _clearBookingCluster();
                            break;
                        case 2:
                            plotMarkers(null);
                            _showBookingCluster();
                            break;
                        default:
                            break;
                    }
                }
                //toggleTrafficLayer(newValue.traffic);
                toggleHeatmapLayer(newValue.heatmap);
            }
        }, true);

        function drawRoute(booking) {
            if (booking == null) {
                _clearRoute();
                _showBookingMarkers();
            } else {
                _clearRoute();
                _hideBookingMarkers();
                _getDirectionsForBooking(booking);
            }
        }

        function toggleTrafficLayer(showLayer) {
            $scope.dispatchObj.map.displayOptions.traffic = showLayer;
            if (showLayer) {
                trafficLayer = new google.maps.TrafficLayer();
                trafficLayer.setMap($scope.dispatchObj.map.mapObject);
            } else {
                if (trafficLayer) {
                    trafficLayer.setMap(null);
                    trafficLayer = null;
                }
            }
        }

        function _getMarkerForBooking(booking) {
            var pickup = booking.BookingStops[0];
            if (pickup && pickup.Latitude && pickup.Longitude) {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(pickup.Latitude, pickup.Longitude),
                    zIndex: google.maps.Marker.MAX_ZINDEX + 1,
                    title: '' + booking.LocalId,
                    icon: {
                        url: '/includes/images/marker-pink.png',
                        scaledSize: new google.maps.Size(28, 28)
                    },
                    visible: false, //(!$scope.dispatchObj.map.selected.bookingId || $scope.dispatchObj.map.selected.bookingId == booking.Id),
                    map: $scope.dispatchObj.map.mapObject
                });

                marker.addListener('click', function () {
                    _setInfoWindow(booking, 'booking');
                });
                return marker;
            } else {
                return null;
            }
        }

        function _getMarkerForDriver(shift) {
            if (shift && shift.LastKnownLatitude && shift.LastKnownLongitude && shift.DriverStatus != 'Offline') {
                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(shift.LastKnownLatitude, shift.LastKnownLongitude),
                    title: shift.DriverCallsign,
                    icon: {
                        url: $config.API_ENDPOINT + 'api/imagegen?driverId=' + shift.DriverId + "&status=" + shift.DriverStatus + "&callsign=" + shift.DriverCallsign,
                        scaledSize: new google.maps.Size(45, 58)
                    },
                    visible: (!$scope.dispatchObj.map.selected.bookingId || !$scope.dispatchObj.map.selected.driverId || $scope.dispatchObj.map.selected.driverId == shift.DriverId),
                    map: $scope.dispatchObj.map.mapObject
                });
                marker.addListener('click', function () {
                    _setInfoWindow(shift, 'driver');
                });
                return marker;
            } else {
                return null;
            }
        }

        function _setInfoWindow(obj, type) {
            if (infoWindow == null) {
                infoWindow = new google.maps.InfoWindow({
                    content: '',
                });
            }
            if (obj == null) {
                infoWindow.setMap(null);
            }
            if (type == 'booking') {
                infoWindow.setContent('' +
                    '<div class="infowindow booking">' +
                    '<b>Id:</b> ' + obj.LocalId + '<br />' +
                    '<b>From:</b> ' + obj._FromSummary + '<br />' +
                    '<b>To:</b> ' + obj._ToSummary + '<br />' +
                    '<b>Status:</b> ' + obj.BookingStatus + '<br />' +
                    '</div>');
                infoWindow.open($scope.dispatchObj.map.mapObject, $scope.dispatchObj.map.bookingMarkers[obj.Id]);
            } else if (type == 'driver') {
                infoWindow.setContent('' +
                    '<div class="infowindow driver">' +
                    '<b>Driver:</b> ' + obj.Firstname + ' ' + obj.Surname + '<br />' +
                    '<b>Callsign:</b> ' + obj.Callsign + '<br />' +
                    '<b>Status:</b> ' + obj.DriverStatus + '<br />' +
                    '</div>');
                infoWindow.open($scope.dispatchObj.map.mapObject, $scope.dispatchObj.map.driverMarkers[obj.Id]);
            }
        }

        function _clearRoute() {
            if (directionsRenderer) {
                directionsRenderer.setMap(null);
                directionsRenderer = null;
            }

            for (var i = 0; i < routeMarkers.length; i++) {
                routeMarkers[i].setMap(null)
            }
            routeMarkers.length = 0;
        }

        function _getDirectionsForBooking(booking) {
            Model.Booking.query().where("Id eq guid'" + booking.Id + "'").select('EncodedRoute').execute().then(function (result) {
                if (result[0].EncodedRoute) {
                    var decodedPath = google.maps.geometry.encoding.decodePath(result[0].EncodedRoute);
                    if (directionsRenderer == null) {
                        directionsRenderer = new google.maps.Polyline({
                            map: $scope.dispatchObj.map.mapObject,
                            path: decodedPath,
                            geodesic: true,
                            strokeColor: '#63C4E1',
                            strokeOpacity: 0.8,
                            strokeWeight: 6
                        });
                    } else {
                        directionsRenderer.setPath(decodedPath);
                        directionsRenderer.setMap($scope.dispatchObj.map.mapObject);
                    }
                }
            });
            var first = true;
            angular.forEach(booking.BookingStops, function (bs) {
                if (bs.Latitude && bs.Longitude) {
                    var position = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                    var marker = new google.maps.Marker({
                        position: position,
                        visible: true,
                        icon: {
                            url: (first) ? '/includes/images/marker-pink.png' : '/includes/images/marker.png',
                            scaledSize: new google.maps.Size(28, 28)
                        },
                        map: $scope.dispatchObj.map.mapObject,
                        zIndex: 1000
                    });
                    routeMarkers.push(marker);
                }
                first = false;
            });
        }

        function _hideDriverMarkers() {
            $scope.dispatchObj.drivers.items.map(function (m) {
                if (m.$marker) {
                    m.$marker.setVisible(false);
                }
            });
        }

        function _showDriverMarkers() {
            $scope.dispatchObj.drivers.items.map(function (m) {
                if (m.$marker) {
                    m.$marker.setVisible(true);
                }
            });
            _setMapBoundsToMarkers($scope.dispatchObj.drivers.items);
        }

        function _hideBookingMarkers() {
            $scope.dispatchObj.bookings.items.map(function (m) {
                if (m.$marker)
                    m.$marker.setVisible(false);
            });
        }

        function _showBookingMarkers() {
            $scope.dispatchObj.bookings.items.map(function (m) {
                if (m.$marker) {
                    m.$marker.setVisible(true);
                }
            });
            _setMapBoundsToMarkers($scope.dispatchObj.bookings.items);
        }

        function _setMapBoundsToMarkers(bookings) {
            var center = new google.maps.LatLng(company.DispatchLatitude || 51.496384198223355, company.DispatchLongitude || -0.12875142186092202);
            $scope.dispatchObj.map.mapObject.setCenter(center);
            $scope.dispatchObj.map.mapObject.setZoom(company.DispatchZoom || 11);
        }

        function _showBookingCluster() {
            plotMarkers(null);
            _clearBookingCluster();
            bookingCluster = new MarkerClusterer($scope.dispatchObj.map.mapObject,
                $scope.dispatchObj.bookings.items.map(function (m) {
                    return m.$marker;
                }).filter(function (m) {
                    return !!m
                }), {
                    averageCenter: true,
                    gridSize: 80,
                    ignoreHidden: true,
                    minimumClusterSize: 1,
                    maxZoom: 13
                });
        }

        function _clearBookingCluster() {
            if (bookingCluster) {
                bookingCluster.clearMarkers();
                bookingCluster = null;
            }
        }

        function toggleHeatmapLayer(showLayer) {
            if (showLayer) {
                if (heatmapLayer) {
                    heatmapLayer.setMap(null);
                    heatmapLayer = null;
                }
                heatmapLayer = new google.maps.visualization.HeatmapLayer({
                    data: $scope.dispatchObj.bookings.items.map(function (m) {
                        return {
                            location: m.$marker.getPosition(),
                            weight: 1
                        }
                    }).filter(function (m) {
                        return !!m
                    }),
                    dissipating: true,
                    radius: 50,
                    opacity: 0.75
                });
                heatmapLayer.setMap($scope.dispatchObj.map.mapObject);
            } else {
                if (heatmapLayer) {
                    heatmapLayer.setMap(null);
                    heatmapLayer = null;
                }
            }
        }
    }
})(angular);