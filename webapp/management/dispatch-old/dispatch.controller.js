(function (angular) {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchController', DispatchController);
    module.controller('DispatchNewBookingController', DispatchNewBookingController);
    module.controller('DispatchBookingDetailsController', DispatchBookingDetailsController);

    DispatchController.$inject = ['$scope', '$state', '$timeout', '$location', '$filter', '$controller', 'Google', 'rBookings', 'rDrivers', '$modal', 'Model', 'SignalR'];

    function DispatchController($scope, $state, $timeout, $location, $filter, $controller, Google, rBookings, rDrivers, $modal, Model, SignalR) {

        $controller('ThreePanelController', {
            $scope: $scope
        });
        $scope.map = null;
        var directionsService = null;
        var directionsRenderer = null;

        $scope.bookingSearch = {
            $: ''
        };
        $scope.driverSearch = {
            $: ''
        };
        $scope.bookingSearchFn = bookingSearchFn;
        $scope.toggleBookingStatus = toggleBookingStatus;
        $scope.activeStatus = activeStatus;
        $scope.filteredBookingsStatuses = [1, 10, 20, 40, 80, 30];

        $scope.driverOrder = driverOrderFn;

        SignalR.server.startLocations();
        console.log("Locations Started");

        $scope.$on('$destroy', function () {
            SignalR.server.stopLocations();
            console.log("Locations Stopped");
        });

        $scope.selected = {
            booking: null,
            routeMarkers: [],
            directions: null,
            directionsIndex: 0,
            driver: null,
            driverMarker: null
        };

        $scope.verticalSlider = {
            show: false,
            value: 3,
            opacity: 0.6,
            options: {
                floor: 1,
                ceil: 6,
                vertical: true,
                translate: function (value) {
                    switch (value) {
                        case 6:
                            return "< 15mins";
                        case 5:
                            return "< 1hr";
                        case 4:
                            return "< 6hr";
                        case 3:
                            return "< 12hrs";
                        case 2:
                            return "1 day";
                        case 1:
                            return "2 days"
                    }
                }
            }
        };

        $scope.$watch('verticalSlider.value', function () {
            var x = new moment();
            switch ($scope.verticalSlider.value) {
                case 6:
                    x.add(15, 'minutes');
                    break;
                case 5:
                    x.add(1, 'hour');
                    break;
                case 4:
                    x.add(6, 'hours');
                    break;
                case 3:
                    x.add(12, 'hours');
                    break;
                case 2:
                    x.add(24, 'hours');
                    break;
                case 1:
                    x.add(48, 'hours');
                    break;
            }
            Model.Booking
                .query()
                .include('BookingStops,Client,LeadPassenger,Driver,Vehicle')
                .where('BookedDateTime', 'ge', "datetimeoffset'" + new moment().subtract(2, 'hours').format() + "'")
                .where('BookedDateTime', 'le', "datetimeoffset'" + x.format() + "'")
                .trackingEnabled()
                .execute().then(function (data) {
                    angular.forEach(bookingMarkers, function (b) {
                        b.setMap(null);
                    });
                    bookingMarkers.length = 0;
                    $scope.bookings = data;
                    angular.forEach(data, function (b) {
                        b.BookingStops = (b.BookingStops && b.BookingStops.length > 1) ? $filter('orderBy')(b.BookingStops, 'StopOrder') : b.BookingStops;
                        var marker = null;
                        var pickup = b.BookingStops[0];
                        if (pickup && pickup.Latitude && pickup.Longitude) {
                            b.$marker = true;
                            marker = new google.maps.Marker({
                                position: new google.maps.LatLng(pickup.Latitude, pickup.Longitude),
                                animation: null,
                                visible: false,
                                icon: '/includes/images/user.png',
                                map: null
                            });
                        }
                        bookingMarkers.push(marker);
                    });
                    $scope.bookingMarkerMode = 5;
                    $timeout(function () {
                        $scope.bookingMarkerMode = 1;
                    }, 0);
                    if (data.length) {
                        fit(true, false);
                    }
                });
        });

        $scope.showDirectionsPanel = false;
        $scope.clearDirections = clearDirections;
        $scope.setDirectionsRouteIndex = setDirectionsRouteIndex;
        $scope.viewStep = viewStep;
        $scope.unselect = unselect;
        $scope.getRouteDirections = getRouteDirections;
        $scope.bookingSelected = bookingSelected;

        $scope.drivers = rDrivers;
        $scope.driverMarkerMode = 1;
        var driverMarkers = [];
        var driverCluster = null;
        $scope.toggleDriverMarkerMode = toggleDriverMarkerMode;

        $scope.bookings = rBookings.map(function (i) {
            i.$timestamp = new moment(i.BookedDateTime).valueOf();
            return i;
        });
        $scope.bookingMarkerMode = 1;
        var bookingMarkers = [];
        var bookingCluster = null;

        $scope.fit = fit;

        var trafficLayer = null;
        $scope.trafficLayerVisibile = false;

        var heatmapLayer = null;
        $scope.heatmapLayerVisible = false;

        var debounceViewChange = null;

        $scope.openOfferModel = openOfferModel;
        $scope.select = select;

        initMap();
        setupDriverMarkers();
        setupBookingMarkers();

        function initMap() {
            var search = $location.search();
            var center = new google.maps.LatLng(parseFloat(search.lat) || 55.4083, parseFloat(search.lng) || -2.1494);

            $scope.map = new google.maps.Map(document.getElementById('dispatch-map'), {
                center: center,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER
                },
                panControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                },
                mapTypeControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER
                },
                zoom: parseInt(search.z) || 13,
                styles: [{
                    "featureType": "landscape",
                    "stylers": [{
                        "hue": "#FFBB00"
                    }, {
                        "saturation": 43.400000000000006
                    }, {
                        "lightness": 37.599999999999994
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "road.highway",
                    "stylers": [{
                        "hue": "#FFC200"
                    }, {
                        "saturation": -61.8
                    }, {
                        "lightness": 45.599999999999994
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "road.arterial",
                    "stylers": [{
                        "hue": "#FF0300"
                    }, {
                        "saturation": -100
                    }, {
                        "lightness": 51.19999999999999
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "road.local",
                    "stylers": [{
                        "hue": "#FF0300"
                    }, {
                        "saturation": -100
                    }, {
                        "lightness": 52
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "water",
                    "stylers": [{
                        "hue": "#0078FF"
                    }, {
                        "saturation": -13.200000000000003
                    }, {
                        "lightness": 2.4000000000000057
                    }, {
                        "gamma": 1
                    }]
                }, {
                    "featureType": "poi",
                    "stylers": [{
                        "hue": "#00FF6A"
                    }, {
                        "saturation": -1.0989010989011234
                    }, {
                        "lightness": 11.200000000000017
                    }, {
                        "gamma": 1
                    }]
                }]
            });
            $scope.map.addListener('center_changed', onViewChanged);
            $scope.map.addListener('zoom_changed', onViewChanged);

            $timeout(function () {
                var search = $location.search();
                if (search['bmm']) {
                    $scope.bookingMarkerMode = Number(search['bmm']);
                } else {
                    $scope.bookingMarkerMode = 1;
                }
                if (search['dmm']) {
                    $scope.driverMarkerMode = Number(search['dmm']);
                } else {
                    $scope.driverMarkerMode = 1;
                }
                if (search['tr'] == 'true') {
                    toggleTrafficLayer()
                }
                if (search['hm'] == 'true') {
                    toggleHeatmapLayer()
                }
                fit(true, false);
            }, 0);
        }

        function setupDriverMarkers() {
            angular.forEach(rDrivers, function (d) {
                var marker = null;
                if (d.LastKnownLatitude && d.LastKnownLongitude) {
                    d.$marker = true;
                    marker = new google.maps.Marker({
                        position: new google.maps.LatLng(d.LastKnownLatitude, d.LastKnownLongitude),
                        animation: null,
                        visible: true,
                        icon: '/includes/images/car1.png',
                        map: $scope.map
                    });
                }
                driverMarkers.push(marker);
            });
        }

        function setupBookingMarkers() {
            angular.forEach(rBookings, function (b) {
                b.BookingStops = (b.BookingStops && b.BookingStops.length > 1) ? $filter('orderBy')(b.BookingStops, 'StopOrder') : b.BookingStops;
                var marker = null;
                var pickup = b.BookingStops[0];
                if (pickup && pickup.Latitude && pickup.Longitude) {
                    b.$marker = true;
                    marker = new google.maps.Marker({
                        position: new google.maps.LatLng(pickup.Latitude, pickup.Longitude),
                        animation: null,
                        visible: false,
                        icon: '/includes/images/user.png',
                        map: null
                    });
                }
                bookingMarkers.push(marker);
            });
        }

        function bookingSelected(b) {
            $scope.selected.booking = null;
            $scope.selected.booking = b;
            select(b, null);
        }

        $scope.$watch("selected.booking", function (newval) {
            if (!newval) {
                unselect();
            }
        });

        $scope.$watch("driverMarkerMode", function (newval) {
            toggleDriverMarkerMode(Number(newval));
        });

        $scope.$watch("bookingMarkerMode", function (n, oldval) {
            switch (Number(n)) {
                case 0:
                    if (bookingCluster) {
                        bookingCluster.clearMarkers();
                        bookingCluster = null;
                    }
                    angular.forEach(bookingMarkers, function (m) {
                        if (m) {
                            m.setMap(null);
                            m.setVisible(false);
                        }
                    });
                    break;
                case 1:
                    if (bookingCluster) {
                        bookingCluster.clearMarkers();
                        bookingCluster = null;
                    }
                    angular.forEach(bookingMarkers, function (m) {
                        if (m) {
                            m.setMap($scope.map);
                            m.setVisible(true);
                        }
                    });
                    break;
                case 2:
                    angular.forEach(bookingMarkers, function (m) {
                        if (m) {
                            m.setMap($scope.map);
                            m.setVisible(true);
                        }
                    });
                    bookingCluster = new MarkerClusterer($scope.map, bookingMarkers.filter(function (m) {
                        return !!m
                    }), {
                        averageCenter: true,
                        gridSize: 80,
                        ignoreHidden: true,
                        minimumClusterSize: 1,
                        maxZoom: 13
                    });
                    break;
                default:
                    break;

            }
            $location.search('bmm', $scope.bookingMarkerMode);
        });

        $scope.$watch("mapFit", function (newval) {
            switch (Number(newval)) {
                case 1:
                    fit(true, false);
                case 2:
                    fit(false, true);
                case 3:
                    fit(true, true);
                default:
                    break;
            }
        });

        $scope.$watch("showHelper", function (newval) {
            $timeout(function () {
                var mapCenter = $scope.map.getCenter();
                google.maps.event.trigger($scope.map, 'resize');
                $scope.map.setCenter(mapCenter);
            }, 0);
        });

        function toggleDriverMarkerMode(setTo) {
            $scope.driverMarkerMode = setTo || ++$scope.driverMarkerMode;
            if ($scope.driverMarkerMode > 2) {
                $scope.driverMarkerMode = 0;
            }

            switch ($scope.driverMarkerMode) {
                case 0:
                    driverCluster.clearMarkers();
                    driverCluster = null;
                case 1:
                    angular.forEach(driverMarkers, function (m) {
                        if (m) {
                            m.setMap($scope.map);
                            m.setVisible(true);
                        }
                    });
                    break;
                case 2:
                    driverCluster = new MarkerClusterer($scope.map, driverMarkers.filter(function (m) {
                        return !!m
                    }), {
                        averageCenter: true,
                        gridSize: 80,
                        ignoreHidden: true,
                        minimumClusterSize: 1,
                        maxZoom: 13
                    });
                    break;
                default:
                    break;

            }
            $location.search('dmm', $scope.driverMarkerMode);
        }

        function fit(bookings, drivers) {
            var bounds = new google.maps.LatLngBounds();
            var doFit = false;
            if (bookings) {
                angular.forEach(bookingMarkers, function (bm) {
                    if (bm) {
                        doFit = true;
                        bounds.extend(bm.getPosition());
                    }
                });
            }
            if (drivers) {
                angular.forEach(driverMarkers, function (dm) {
                    if (dm) {
                        doFit = true;
                        bounds.extend(dm.getPosition());
                    }
                });
            }
            if (doFit)
                $scope.map.fitBounds(bounds);
        }

        function bookingSearchFn(item) {

            var i = 0;
            switch (item.BookingStatus) {
                case 'Cancelled':
                    i = -1;
                    break;
                case 'Incoming':
                    i = 1;
                    break;
                case 'Allocated':
                    i = 10;
                    break;
                case 'OnRoute':
                    i = 20;
                    break;
                case 'Arrived':
                    i = 30;
                    break;
                case 'InProgress':
                    i = 40;
                    break;
                case 'Clearing':
                    i = 80;
                    break;
                case 'Completed':
                    i = 100;
                    break;
            }

            return $scope.filteredBookingsStatuses.indexOf(i) != -1;
        }

        function activeStatus(value) {
            var index = $scope.filteredBookingsStatuses.indexOf(value);
            return index != -1;
        }

        function toggleBookingStatus(value, value1, value2) {
            var index = $scope.filteredBookingsStatuses.indexOf(value);
            if (index != -1) {
                $scope.filteredBookingsStatuses.splice(index, 1);
            } else {
                $scope.filteredBookingsStatuses.push(value);
            }

            if (value1) {
                var index = $scope.filteredBookingsStatuses.indexOf(value1);
                if (index != -1) {
                    $scope.filteredBookingsStatuses.splice(index, 1);
                }
            } else {
                $scope.filteredBookingsStatuses.push(value1);
            }

            if (value2) {
                var index = $scope.filteredBookingsStatuses.indexOf(value2);
                if (index != -1) {
                    $scope.filteredBookingsStatuses.splice(index, 1);
                }
            } else {
                $scope.filteredBookingsStatuses.push(value2);
            }
        }

        //$scope.$watch('trafficLayerVisibile', function (newval) {
        //    if (newval) {
        //        trafficLayer = new google.maps.TrafficLayer();
        //        trafficLayer.setMap($scope.map);
        //    } else {
        //        if (trafficLayer) {
        //            trafficLayer.setMap(null);
        //            trafficLayer = null;
        //        }
        //    }
        //    $location.search('tr', String($scope.trafficLayerVisibile));
        //});

        $scope.$watch('heatmapLayerVisible', function (newval) {
            if (newval) {
                var heatmapData = [];
                angular.forEach(bookingMarkers, function (bm) {
                    if (bm) {
                        heatmapData.push({
                            location: bm.getPosition(),
                            weight: 1
                        });
                    }
                });
                heatmapLayer = new google.maps.visualization.HeatmapLayer({
                    data: heatmapData,
                    dissipating: true,
                    radius: 50,
                    opacity: 0.75
                });
                heatmapLayer.setMap($scope.map);
            } else {
                if (heatmapLayer) {
                    heatmapLayer.setMap(null);
                    heatmapLayer = null;
                }
            }
            $location.search('hm', String($scope.heatmapLayerVisible));
        });

        function onViewChanged() {
            if (debounceViewChange) {
                $timeout.cancel(debounceViewChange);
                debounceViewChange = null;
            }
            debounceViewChange = $timeout(function () {
                var center = $scope.map.getCenter();
                //$location.search('lat', center.lat());
                //$location.search('lng', center.lng());
                //$location.search('z', $scope.map.getZoom());
            }, 500);
        }

        function unselect() {
            if ($scope.selected.routeMarkers.length) {
                angular.forEach($scope.selected.routeMarkers, function (rm) {
                    rm.setMap(null);
                });
                $scope.selected.routeMarkers.length = 0;
            }
            if ($scope.selected.directions) {
                clearDirections();
            }
            if ($scope.selected.driverMarker) {
                if ($scope.driverMarkerMode == 0) {
                    $scope.selected.driverMarker.setVisible(false);
                    $scope.selected.driverMarker.setMap(null);
                }
            }
            $scope.selected = {
                booking: null,
                routeMarkers: [],
                directions: null,
                directionsIndex: 0,
                driver: null,
                driverMarker: null
            };
            $scope.showHelper = false;
            fit(true, false);
            $scope.trafficLayerVisibile = false;
        }

        function select(booking, driver) {
            unselect();
            if (booking) {
                $scope.selected.booking = booking;
                $scope.showHelper = true;
                var index = $scope.bookings.indexOf(booking);
                var marker = bookingMarkers[index];
                if (marker) {
                    $scope.selected.bookingMarker = marker;
                    $timeout(function () {
                        var first = true;
                        var bounds = new google.maps.LatLngBounds();
                        var routePoints = [];
                        angular.forEach(booking.BookingStops, function (bs) {
                            if (bs.Latitude && bs.Longitude) {
                                var position = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                                var marker = new google.maps.Marker({
                                    position: position,
                                    animation: 1,
                                    visible: true,
                                    icon: (first) ? '/includes/images/user.png' : '/includes/images/userTo.png',
                                    map: $scope.map,
                                    zIndex: 1000
                                });
                                routePoints.push(position);
                                $scope.selected.routeMarkers.push(marker);
                                bounds.extend(position);
                            }
                            first = false;
                        });

                        if ($scope.selected.routeMarkers.length > 1) {
                            $scope.map.fitBounds(bounds);
                            getRouteDirections(routePoints);
                        } else if ($scope.selected.routeMarkers.length == 1) {
                            $scope.map.panTo($scope.selected.routeMarkers[0].getPosition());
                            $scope.map.setZoom(14);
                        }
                    }, 1000);
                }
                $state.go("dispatch.bookings.details", {
                    Id: booking.Id
                });
            }
            if (driver) {
                $scope.selected.driver = driver;
                var index = $scope.drivers.indexOf(driver);
                var marker = driverMarkers[index];
                if (marker) {
                    $scope.selected.driverMarker = marker;
                    $scope.map.panTo(marker.getPosition());
                    $scope.map.setZoom(16);
                    $timeout(function () {
                        $scope.selected.driverMarker.setVisible(true);
                        $scope.selected.driverMarker.setMap($scope.map);
                    }, 1000);
                }
            }
        }



        function getRouteDirections(route) {
            clearDirections();
            Google.Maps.Directions.route(route).then(function (result) {
                $scope.selected.directions = result;
                $scope.trafficLayerVisibile = false;
                if (directionsRenderer == null) {
                    directionsRenderer = new google.maps.DirectionsRenderer({
                        suppressInfoWindows: true,
                        suppressMarkers: true,
                        directions: result,
                        panel: document.getElementById('google-directions'),
                        map: $scope.map,
                        polylineOptions: {
                            strokeColor: "#63C4E1",
                            strokeOpacity: 0.8,
                            strokeWeight: 6
                        }
                    });
                }
                $scope.selected.directionsIndex = 0;
            });
        }

        function clearDirections() {
            $scope.selected.directions = null;
            if (directionsRenderer) {
                directionsRenderer.setMap(null);
                directionsRenderer = null;
            }
        }

        function viewStep(step) {
            $scope.map.panTo(step.start_location);
            $scope.map.setZoom(17);
        }

        function setDirectionsRouteIndex(index) {
            directionsRenderer.setRouteIndex(index);
            $scope.selected.directionsIndex = index;
        }

        $scope.panel.onPanelResize = function () {
            $timeout(function () {
                google.maps.event.trigger($scope.map, 'resize');
            }, 600);
        }

        function openOfferModel(b) {
            $modal.open({
                template: '' +
                    '<div>' +
                    '<div form-for="offer" schema="BookingOffer" class="modal-body">' +
                    '<div field-for="DriverId" display="Choose Driver:" select-from="drivers"></div>' +
                    '</div>' +
                    '<div class="modal-footer">' +
                    '<a class="btn btn-success" ng-click="assign()">Assign</a>' +
                    '<a class="btn btn-wanring" ng-click="$dismiss()">Close</a>' +
                    '</div>' +
                    '</div>',
                resolve: {
                    rBooking: function () {
                        return b;
                    },
                    rDrivers: function () {
                        return rDrivers;
                    }
                },
                controller: ['$scope', '$modalInstance', 'Model', 'rBooking', 'rDrivers', function ($scope, $modalInstance, Model, rBooking, rDrivers) {
                    $scope.drivers = rDrivers.map(function (d) {
                        return {
                            Id: d.Id,
                            Name: d._Fullname,
                            Description: d.Callsign
                        };
                    });
                    $scope.offer = new Model.BookingOffer();
                    $scope.offer.BookingId = rBooking.Id;

                    $scope.assign = function () {
                        $scope.offer.$save().then(function (result) {
                            $modalInstance.close(result.data);
                        })
                    }
                }]
            }).result.then(function (offer) {
                var booking = $scope.bookings.filter(function (b) {
                    return b.Id == offer.BookingId;
                })[0];
                booking.$offer = offer;
            });
        };

        function driverOrderFn(d) {
            switch (d.DriverStatus) {
                case 'Available':
                    return 0;
                case 'Clearing':
                    return 1;
                case 'OnJob':
                    return 2;
                case 'OnBreak':
                    return 3;
                default:
                    return 4;
            }
        }

        $scope.$on('SIGNALR_updateDriverStatus', function (event, args) {
            var update = args[0];
            var found = $scope.drivers.filter(function (d) {
                return d.Id == update.Id
            })[0];

            if (found) {
                found.DriverStatus = update.DriverStatus;
                found.$commit(true);
                $scope.$apply();
            }
        });

        $scope.$on('SIGNALR_updateBookingStatus', function (event, args) {
            var update = args[0];
            var found = $scope.bookings.filter(function (d) {
                return d.Id == update.Id
            })[0];

            if (found) {
                found.BookingStatus = update.BookingStatus;
                found.$commit(true);
                $scope.$apply();
            }
        });

        $scope.$on('SIGNALR_updateBooking', function (event, args) {
            var update = new Model.Booking(args[0]);
            var found = $scope.bookings.filter(function (d) {
                return d.Id == update.Id
            })[0];

            if (found) {
                angular.copy(found, update);
                found.$commit(true);
                $scope.$apply();
            } else {
                $scope.bookings.push(update);
                $scope.$apply();

                update.BookingStops = (update.BookingStops && update.BookingStops.length > 1) ? $filter('orderBy')(update.BookingStops, 'StopOrder') : update.BookingStops;
                var marker = null;
                var pickup = update.BookingStops[0];
                if (pickup && pickup.Latitude && pickup.Longitude) {
                    update.$marker = true;
                    marker = new google.maps.Marker({
                        position: new google.maps.LatLng(pickup.Latitude, pickup.Longitude),
                        animation: null,
                        visible: false,
                        icon: '/includes/images/user.png',
                        map: null
                    });
                }
                bookingMarkers.push(marker);
                $scope.bookingMarkerMode = 5;
                $timeout(function () {
                    $scope.bookingMarkerMode = 1;
                }, 0);
            }
        });

        $scope.$on('SIGNALR_updateBookingOffer', function (event, args) {
            var update = args[0];
            var found = $scope.bookings.filter(function (d) {
                return d.Id == update.BookingId
            })[0];
            if (found) {
                found.$offer = update;
                if (update.Accepted) {
                    found.DriverId = update.DriverId;
                    found.Driver = $scope.drivers.filter(function (d) {
                        return d.Id == update.DriverId
                    })[0];
                    found.$commit(false);
                }
                $scope.$apply();
            }
        });

        $scope.$on('SIGNALR_updateDriverLocation', function (event, args) {
            var update = args[0];
            var found = $scope.drivers.filter(function (d) {
                return d.Id == update.DriverId
            })[0];

            if (found) {
                found.LastKnownLatitude = update.Latitude;
                found.LastKnownLongitude = update.Longitude;
                found.$commit(true);

                if ($scope.selected.driver == found) {
                    $scope.map.panTo(new google.maps.LatLng(update.Latitude, update.Longitude));
                }

                var index = $scope.drivers.indexOf(found);
                var marker = driverMarkers[index];
                if (marker) {
                    marker.setPosition(new google.maps.LatLng(update.Latitude, update.Longitude));
                } else {
                    found.$marker = true;
                    marker = new google.maps.Marker({
                        position: new google.maps.LatLng(found.LastKnownLatitude, found.LastKnownLongitude),
                        animation: null,
                        visible: ($scope.driverMarkerMode == 0) ? false : true,
                        icon: '/includes/images/car1.png',
                        map: ($scope.driverMarkerMode == 0) ? null : $scope.map
                    });
                    driverMarkers[index] = marker;
                }
                $scope.$apply();
            }
        });
    }

    DispatchNewBookingController.$inject = ['$scope', '$http', '$config', '$timeout', '$tenantConfig', 'Model', 'rClients', 'rPassengers', 'rVehicleTypes', 'rVehicleClasses', 'rBookingRequirements', 'Localisation', '$filter', 'rCurrencies'];

    function DispatchNewBookingController($scope, $http, $config, $timeout, $tenantConfig, Model, rClients, rPassengers, rVehicleTypes, rVehicleClasses, rBookingRequirements, Localisation, $filter, rCurrencies) {
        var currentQuote = null;
        var copied = false;

        $scope.newbookings = [];
        $scope.selected.booking = {};
        $scope.filteredPassengers = $scope.passengers = rPassengers;
        $scope.filteredClients = $scope.clients = rClients;
        $scope.vehicleTypes = rVehicleTypes;
        $scope.vehicleClasses = rVehicleClasses;
        $scope.bookingRequirements = rBookingRequirements;
        $scope.repeatBooking = repeatBooking;
        $scope.paxMode = {
            value: false,
            selected: true,
            history: [],
            stops: []
        }

        $scope.currencies = rCurrencies;
        var currencyObj = Localisation.currency();

        $scope.discount = {
            type: 'amount'
        };

        //Initialise New Booking Object
        $scope.startNew = startNew;

        //Generate a booking Quote
        $scope.getQuote = getQuote;

        //Create a Booking
        $scope.book = book;

        //Cancel Exiting Booking
        $scope.cancel = cancel;

        //Add a Booking Stop
        $scope.addStop = addStop;

        $scope.addTime = addTime;

        //Fetch Passenger Profile
        $scope.fetchPassengerProfile = fetchPassengerProfile;

        $scope.$watch('selected.booking.LeadPassengerId', fetchPassengerProfile);

        $timeout(function () {
            var currentMarkerStatus = $scope.bookingMarkerMode;
            $scope.$parent.bookingMarkerMode = 0;
        }, 0);

        function startNew() {
            var b = $scope.selected.booking = new Model.Booking();

            b.BookingSource = 'PHONE';
            b.BookingStops.length = 0;

            var stop = new Model.BookingStop();
            stop.id = idCounter++;

            b.BookingStops.push(stop);
            b.VehicleClassId = $tenantConfig.defaultVehicleClass;
            b.VehicleTypeId = $tenantConfig.defaultVehicleType;
            b.Pax = 1;
            b.Bax = 0;

            b.TaxId = $scope.COMPANY.DefaultTaxId;

            if ($scope.COMPANY.ChauffeurModeActive == true) {
                b.ChauffeurMode = true;
            }

            var dt = new moment.tz(Localisation.timeZone().getTimeZone());
            dt.subtract(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes')

            b.BookedDateTime = dt.toDate();
            b.Time = dt.startOf('minute').toDate();
            b.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
            b.EstimatedCost = 0;
        }

        function getQuote() {
            $http.post($config.API_ENDPOINT + '/api/quote', $scope.selected.booking)
                .success(function (result) {
                    result.FinalCost = result.FinalCost.toFixed(2);
                    if ($scope.selectedBooking.CurrencyId != $scope.COMPANY.DefaultCurrencyId) {
                        //if ($scope.selectedBooking.EstimatedCost == $scope.selectedBooking.ActualCost) {
                        //    $scope.selectedBooking.ActualCost = $filter('Convert')(result.FinalCost);
                        //}
                        $scope.selectedBooking.EstimatedCost = $filter('Convert')(result.FinalCost);
                        $scope.selectedBooking.ActualCost = $filter('Convert')(result.FinalCost);
                        $scope.selectedBooking.DriverExclusions = $filter('Convert')(result.DriverExclusion);
                        $scope.selectedBooking.DriverCost = $filter('Convert')(result.DriverCost);
                        $scope.EstimatedCost = result.FinalCost;
                        $scope.ActualCost = result.FinalCost;
                        $scope.DriverCost = result.DriverCost;
                        $scope.DriverExclusions = result.DriverExclusion;
                    } else {
                        //if ($scope.selectedBooking.EstimatedCost == $scope.selectedBooking.ActualCost) {
                        //    $scope.selectedBooking.ActualCost = result.FinalCost;
                        //}
                        $scope.selectedBooking.EstimatedMins = result.EstimatedMins;

                        $scope.selectedBooking.EstimatedCost = result.FinalCost;
                        $scope.selectedBooking.ActualCost = result.FinalCost;
                        $scope.selectedBooking.DriverExclusions = result.DriverExclusion;
                        $scope.selectedBooking.DriverCost = result.DriverCost;
                        $scope.EstimatedCost = result.FinalCost;
                        $scope.ActualCost = result.FinalCost;
                        $scope.DriverCost = result.DriverCost;
                        $scope.DriverExclusions = result.DriverExclusion;
                    }
                }).error(function (error) {
                    console.log(error);
                });
        }

        function getRouteBetween(points) {
            $scope.getRouteDirections(points);
        }

        function addStop($index) {
            var stop = new Model.BookingStop();
            stop.id = idCounter++;
            $scope.selected.booking.BookingStops.splice($index + 1, 0, stop);
        }

        function addTime(min) {
            var dt = new moment.tz(Localisation.timeZone().getTimeZone());
            dt.subtract(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes');

            dt.add(min, "minutes");

            $scope.selected.booking.BookedDateTime = dt.toDate();
            $scope.selected.booking.Time = dt.startOf('minute').toDate();
        }

        $scope.$watch("selected.booking.AsDirected", function (newValue) {
            if (copied) {
                copied = false;
                return;
            }
            if (newValue) {
                $scope.selected.booking.BookingStops.length--;
            } else {
                var stop = new Model.BookingStop();
                stop.id = idCounter++;
                $scope.selected.booking.BookingStops.push(stop);
            }
        });

        $scope.$watch("selected.booking.LeadPassengerId", function (newvalue) {
            var b = $scope.selected.booking;
            if (newvalue) {
                b.ClientId = $scope.passengers.filter(function (item) {
                    return item.Id == newvalue;
                })[0].ClientId;
            } else {
                b.ClientId = null;
                $scope.filteredPassengers = $scope.passengers
            }
        });

        var initializing = true
        $scope.$watch("selected.booking.ClientId", function (newvalue) {
            if (initializing) {
                $timeout(function () {
                    initializing = false;
                });
            } else {
                var b = $scope.selected.booking;
                $scope.filteredPassengers = $scope.passengers.filter(function (item) {
                    return item.ClientId == newvalue;
                });
            }

            if ($scope.selected.booking.ClientId) {
                var client = $scope.clients.filter(function (c) {
                    return c.Id == $scope.selected.booking.ClientId
                })[0];
                if (client)
                    $scope.selected.booking.CurrencyId = client.DefaultCurrencyId;
            } else {
                $scope.selected.booking.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
            }
        }, true);

        var markers = [];
        $scope.$watch('selected.booking.BookingStops', function (newvalue) {
            if ($scope.selected.booking.AsDirected) {

            } else if ($scope.selected.booking.BookingStops.length < 2) {
                $scope.selected.booking.EstimatedCost = 0;
                $scope.selected.booking.validStops = false;
                return;
            }

            var canQuote = true;

            angular.forEach($scope.selected.booking.BookingStops, function (bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    canQuote = false;
                } else {
                    var pos = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                    if (!markers[$index]) {
                        markers[$index] = new google.maps.Marker({
                            position: pos,
                            visible: true,
                            icon: ($index == 0) ? '/includes/images/user.png' : '/includes/images/userTo.png',
                            map: $scope.map,
                            zIndex: 1000
                        });
                    } else {
                        markers[$index].setPosition(pos);
                    }
                    if ($index == 0 && $scope.selected.booking.BookingStops.length < 3) {
                        $scope.map.panTo(pos);
                        $scope.map.setZoom(15);
                    }
                }
            });

            if (canQuote) {
                getRouteBetween($scope.selected.booking.BookingStops.map(function (p) {
                    return new google.maps.LatLng(p.Latitude, p.Longitude);
                }));
                $scope.selected.booking.validStops = true;
                getQuote();
            } else {
                //$scope.selected.directions.setDirections(null);
                $scope.selected.booking.EstimatedCost = 0;
                $scope.selected.booking.ActualCost = 0;
                $scope.selected.booking.Discount = 0;
                $scope.selected.booking.validStops = false;
            }

        }, true);

        $scope.$on('$destroy', function () {
            angular.forEach(markers, function (m) {
                m.setMap(null);
            });
            $scope.$parent.bookingMarkerMode = currentMarkerStatus;
        });

        $scope.$watchGroup(['selected.booking.BookingStops.length', 'selected.booking.ClientId', 'selected.booking.VehicleTypeId', 'selected.booking.ChauffeurMode', 'selected.booking.EstimatedMins'], function () {
            if (currentQuote) {
                $timeout.cancel(currentQuote)
                currentQuote = null;
            }

            if ($scope.setupComplete == true) {
                currentQuote = $timeout(getQuote, 500);
            }
        });

        $scope.$watch('selected.booking.ClientId', function () {
            if ($scope.selected.booking.ClientId) {
                var client = $scope.clients.filter(function (c) {
                    return c.Id == $scope.selected.booking.ClientId
                })[0];
                if (client)
                    $scope.selected.booking.CurrencyId = client.DefaultCurrencyId;
            }
        }, true);

        $scope.$watch('selected.booking.CurrencyId', function () {
            currencyObj.setCurrent($scope.selected.booking.CurrencyId);
            var found = $scope.currencies.filter(function (c) {
                return c.Id == $scope.selected.booking.CurrencyId;
            })[0];
            $scope.selected.booking.CurrencyRate = found.CurrentRate;
            $scope.symbol = found.Prepend;
            $scope.selected.booking.Currency = found;
            $scope.selected.booking.ActualCost = (($scope.ActualCost || 0) * found.CurrentRate).toFixed(2)
            $scope.selected.booking.EstimatedCost = (($scope.EstimatedCost || 0) * found.CurrentRate).toFixed(2)

            if ($scope.selected.booking.DriverCost)
                $scope.selected.booking.DriverCost = (($scope.DriverCost || $scope.selected.booking.DriverCost) * found.CurrentRate).toFixed(2)
            if ($scope.selected.booking.InvoiceCost)
                $scope.selected.booking.InvoiceCost = (($scope.InvoiceCost || $scope.selected.booking.InvoiceCost) * found.CurrentRate).toFixed(2)
            if ($scope.discount.type == "amount") {
                $scope.selected.booking.Discount = (($scope.Discount || $scope.selected.booking.Discount) * found.CurrentRate).toFixed(2)
            }
            $scope.setupComplete = true;
        });

        $scope.$watch('selected.booking.BookingStops', function () {
            if ($scope.selected.booking.BookingStops.length < 2) {
                $scope.selected.booking.EstimatedCost = 0;
                $scope.selected.booking.validStops = false;
                return;
            }

            var canQuote = true;
            angular.forEach($scope.selected.booking.BookingStops, function (bs) {
                if (!bs.Latitude || !bs.Longitude) {
                    canQuote = false;
                }
            });
            if (canQuote) {
                $scope.selected.booking.validStops = true;
                getQuote();
            } else {
                $scope.selected.booking.EstimatedCost = 0;
                $scope.selected.booking.validStops = false;
            }
        }, true);

        function repeatBooking(booking) {
            copied = true;
            $scope.selected.booking.BookingStops = angular.copy(booking.BookingStops).map(function (s) {
                s.Id = null;
                s.BookingId = null;
                s.Booking = null;
                s.$copied = true;
                return s;
            });
            $scope.selected.booking.AsDirected = booking.AsDirected;
        }

        function fetchPassengerProfile(id) {
            $scope.paxMode.selected = null;
            if (id) {
                Model.Passenger.query().where('Id', 'eq', "guid'" + id + "'").execute().then(function (d) {
                    $scope.paxMode.selected = d[0];
                });
                Model.Booking.query().where("LeadPassengerId", 'eq', "guid'" + id + "'").include('BookingStops').orderBy('BookedDateTime desc').top(5).execute().then(function (d) {
                    $scope.paxMode.history = d;
                });

                Model.BookingStop.query().where("Booking/LeadPassengerId", 'eq', "guid'" + id + "'").execute().then(function (d) {
                    var hash = {};
                    $scope.paxMode.stops.length = 0;
                    angular.forEach(d, function (i) {
                        hash[i._FullAddress] = i;
                    });

                    angular.forEach(hash, function (value) {
                        $scope.paxMode.stops.push(value);
                    });
                });
            }
        }

        function book(booking) {

            var time = new moment($scope.selected.booking.Time).add(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes')
            var bdt = new moment($scope.selected.booking.BookedDateTime).format("YYYY-MM-DD") + "T" + time.format("HH:mm") + moment.tz(Localisation.timeZone().getTimeZone()).format('Z');

            if ($scope.discount.type != "amount") {
                $scope.discount.type = 'amount';
                var discount = ($scope.selected.booking.ActualCost * $scope.selected.booking.Discount) / 100;
                $scope.selected.booking.Discount = Math.round(discount * 100) / 100;
            }

            var b = $scope.selected.booking;

            var booking = {
                BookingStatus: 'Incoming',
                BookingSource: 'Manual',
                BookedDateTime: bdt,
                Bax: b.Bax,
                Pax: b.Pax,
                EstimatedCost: b.EstimatedCost,
                ActualCost: b.ActualCost,
                DriverCost: b.DriverCost,
                InvoiceCost: b.InvoiceCost,
                VehicleClassId: b.VehicleClassId,
                VehicleTypeId: b.VehicleTypeId,
                DriverId: b.DriverId,
                VehicleId: b.VehicleId,
                ClientId: b.ClientId,
                BookingStops: $scope.selected.booking.BookingStops.map(function (b, i) {
                    b.StopOrder = i + 1;
                    return b;
                }),
                PassengerNotes: b.PassengerNotes,
                DriverNotes: b.DriverNotes,
                OfficeNotes: b.OfficeNotes,
                AutoDispatch: (!b.DriverId),
                AsDirected: b.AsDirected,
                EncodedRoute: b.EncodedRoute,
                CurrencyId: b.CurrencyId,
                CurrencyRate: currencyObj.getCurrent().CurrentRate,
                TaxId: b.TaxId,
                Discount: b.Discount,
                ChauffeurMode: b.ChauffeurMode,
                EstimatedMins: b.EstimatedMins,
                EstimatedDuration: b.EstimatedDuration,
                EstimatedDistance: b.EstimatedDistance
            };

            if ($scope.paxMode.value) {
                if (!b._LeadPassenger) {
                    swal('Invalid', 'Please add passenger details.', 'error');
                    return;
                }
                var split = b._LeadPassenger.split(' ');
                booking.LeadPassenger = {
                    Firstname: split[0],
                    Surname: split.slice(1).join(' '),
                    Mobile: b._LeadPassengerNumber,
                    ClientId: b.ClientId
                };
            } else {
                if (!b.LeadPassengerId) {
                    swal('Invalid', 'Please add passenger details.', 'error');
                    return;
                }
                booking.LeadPassengerId = b.LeadPassengerId;
            }

            if (booking.CurrencyId) {
                if ($scope.COMPANY.DefaultCurrencyId != booking.CurrencyId) {
                    booking.ActualCost = $filter('Convert')(booking.ActualCost, $scope.COMPANY.DefaultCurrencyId, booking.CurrencyId);
                    booking.EstimatedCost = $filter('Convert')(booking.EstimatedCost, $scope.COMPANY.DefaultCurrencyId, booking.CurrencyId);
                    if (booking.DriverCost)
                        booking.DriverCost = $filter('Convert')(booking.DriverCost, $scope.COMPANY.DefaultCurrencyId, booking.CurrencyId);
                    if (booking.InvoiceCost)
                        booking.InvoiceCost = $filter('Convert')(booking.InvoiceCost, $scope.COMPANY.DefaultCurrencyId, booking.CurrencyId);
                }
            }

            $http.post($config.API_ENDPOINT + 'api/bookings', booking)
                .success(function (data) {
                    swal("Success", "Booking Saved", "success");
                })
                .error(function () {
                    swal("Error", "Something didn't work, please check input and try again", "error");
                })
        }


        function cancel(booking) {
            $scope.startNew();
        }

        $scope.startNew();
    }

    DispatchBookingDetailsController.$inject = ['$scope', '$state', '$http', '$config', '$timeout', '$tenantConfig', 'Model', 'rClients', 'rPassengers', 'rVehicleTypes', 'rVehicleClasses', 'rBookingRequirements', 'Localisation', '$filter', 'rCurrencies'];

    function DispatchBookingDetailsController($scope, $state, $http, $config, $timeout, $tenantConfig, Model, rClients, rPassengers, rVehicleTypes, rVehicleClasses, rBookingRequirements, Localisation, $filter, rCurrencies) {
        $scope.viewMode = 'EDIT';
        setupBooking();

        function setupBooking() {
            var b = $scope.selected.booking;

            var dt = new moment(b.BookedDateTime);
            //dt.subtract(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes')

            b.BookedDateTime = dt.toDate();
            b.Time = dt.startOf('minute').toDate();
            //b.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
            // b.EstimatedCost = 0;
        }

        $scope.save = saveBooking;
        $scope.cancel = cancel;

        function saveBooking() {
            var old = $scope.selected.booking.BookedDateTime;
            var oldTime = $scope.selected.booking.Time;
            var time = new moment($scope.selected.booking.Time); //.add(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes')
            var bdt = new moment($scope.selected.booking.BookedDateTime).format("YYYY-MM-DD") + "T" + time.format("HH:mm") + moment.tz(Localisation.timeZone().getTimeZone()).format('Z');

            var b = angular.copy($scope.selected.booking);
            b.BookedDateTime = bdt;
            delete b['Currency'];
            delete b['Client'];
            delete b['Time'];
            delete b['Vehicle'];
            delete b['LeadPassenger'];

            console.log(b);

            $http.put($config.API_ENDPOINT + 'api/bookings/dispatch', b, {
                params: {
                    Id: b.Id
                }
            }).success(function () {
                swal("Booking Updated", "This Booking has been updated", "success");
                angular.extend($scope.selected.booking, b);
            }).error(function () {
                swal("Error", "Something didn't work, please check input and try again", "error");
            });

        }

        function cancel() {
            $scope.selected.booking.$rollback(false);
            $scope.selected.booking = null;
        }
    }
})(angular);