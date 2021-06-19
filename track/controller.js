(function(window, angular) {
    var configModule = angular.module('Cab9Tracking.config', []);
    configModule.constant('$config', {
        API_ENDPOINT: window.endpoint,
        SIGNALR_ENDPOINT: window.signalREndpoint,
        RESOURCE_ENDPOINT: window.resourceEndpoint
    });
    configModule.constant('GoogleDirections', {});

    var app = angular.module("Cab9Tracking", [
        "Cab9Tracking.config",
        "framework.services.signalr",
        "framework.services.currency",
        "framework.filters.utility"
    ]);

    app.config(appConfig);
    app.run(appRun);
    app.controller("TrackingController", trackingController);

    appConfig.$inject = ['$locationProvider', '$httpProvider', 'SignalRProvider'];

    function appConfig($locationProvider, $httpProvider, SignalRProvider) {
        $locationProvider.html5Mode(true);
        SignalRProvider.setEndpoint(window.signalREndpoint + '/signalr/hubs');
        SignalRProvider.setHub('locationHub');
        SignalRProvider.registerEvent('updateDriverLocation');
        SignalRProvider.registerEvent('updateBookingInfo');
        SignalRProvider.registerEvent('updateBookingInfoPatch');
    }

    appRun.$inject = ["$rootScope", "$timeout", 'SignalR', '$location', 'Localisation'];

    function appRun($rootScope, $timeout, SignalR, $location, Localisation) {
        var code = '';
        if ($location.path() && $location.path().length > 2) {
            code = $location.path().substring(1);
            console.log('From Path Param:' + code);
        } else {
            code = $location.search().b;
            console.log('From Query Param:' + code);
        }
        $rootScope.code = code;
        SignalR.setQueryValue('track', code);
        SignalR.start();
        SlidingMarker.initializeGlobally();

        moment.tz.setDefault("Europe/London");
        Localisation.timeZone().setTimeZone("Europe/London");
    }

    trackingController.$inject = ["$scope", "$timeout", "$interval", "$http", "$rootScope", 'Localisation'];

    var mapStyles = [{ "featureType": "water", "stylers": [{ "saturation": 43 }, { "lightness": -11 }, { "hue": "#0088ff" }] }, { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "hue": "#ff0000" }, { "saturation": -100 }, { "lightness": 99 }] }, { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#808080" }, { "lightness": 54 }] }, { "featureType": "landscape.man_made", "elementType": "geometry.fill", "stylers": [{ "color": "#ece2d9" }] }, { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#ccdca1" }] }, { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#767676" }] }, { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] }, { "featureType": "poi", "stylers": [{ "visibility": "on" }] }, { "featureType": "landscape.natural", "elementType": "geometry.fill", "stylers": [{ "visibility": "on" }, { "color": "#EBE5E0" }] }, { "featureType": "poi.park", "stylers": [{ "visibility": "on" }] }, { "featureType": "poi.sports_complex", "stylers": [{ "visibility": "on" }] }];

    function trackingController($scope, $timeout, $interval, $http, $rootScope, Localisation) {
        var currentLocationMarker;
        $scope.markers = [];
        $scope.map = null;
        $scope.$eta = null;
        $scope.booking = null;
        $scope.mapFit = false;

        var url = window.endpoint;
        var minZoomLevel = 12;
        var geo = new google.maps.Geocoder();

        var code = $rootScope.code;

        var infowindow = new google.maps.InfoWindow({
            content: ''
        });

        $scope.$on('SIGNALR_updateDriverLocation', function(event, args) {
            $scope.driverMarker.setPosition(new google.maps.LatLng(args[0].Latitude, args[0].Longitude));
            if ($scope.mapFit != true) {

                if ($scope.booking.BookingStatus == "InProgress" && $scope.booking.AsDirected == false) {
                    getETA([$scope.driverMarker, $scope.dropMarker]);
                    //fitMapToPoints([$scope.pickupMarker, $scope.driverMarker, $scope.dropMarker]);
                } else if ($scope.booking.BookingStatus == "OnRoute" || $scope.booking.BookingStatus == "Arrived") {
                    getETA([$scope.driverMarker, $scope.pickupMarker]);
                    //fitMapToPoints([$scope.pickupMarker, $scope.driverMarker]);
                }
            }
            $scope.mapFit = true;
        });

        $scope.fetchEta = $interval(function() {
            if ($scope.booking.BookingStatus == "InProgress" && $scope.booking.AsDirected == false) {
                getETA([$scope.driverMarker, $scope.dropMarker]);
            } else if ($scope.booking.BookingStatus == "OnRoute" || $scope.booking.BookingStatus == "Arrived") {
                getETA([$scope.driverMarker, $scope.pickupMarker]);
            }
        }, 5000);

        $scope.$on('SIGNALR_updateBookingInfo', function(event, args) {
            fetchBookingDetails();
        })

        $scope.$on('SIGNALR_updateBookingInfoPatch', function(event, args) {
            fetchBookingDetails();
        })

        function infoWindowFormat(data) {
            var _template = '';
            _template += '<div class="marker-info"><strong class="brand-primary">' + data.name + '</strong><br /><span class="brand-secondary">' + data.address1 + ", " + data.town_city + ", " + data.postcode + '</span></div>';
            return _template;
        }

        fetchBookingDetails();

        function fetchBookingDetails() {
            $('#track #loading').show();
            $http({
                method: 'GET',
                url: window.endpoint + 'api/bookings/info?code=' + code
            }).then(function successCallback(response) {
                if (response.data) {
                    $scope.booking = response.data;
                    if ($scope.booking.Driver != null) {
                        $scope.booking.Driver.ImageUrl = formatDriverImage($scope.booking.Driver);
                    }
                    $scope.booking.Company.LogoUrl = window.endpoint + $scope.booking.Company.LogoUrl;

                    if ($scope.booking.Company.DefaultTimezone) {
                        moment.tz.setDefault($scope.booking.Company.DefaultTimezone);
                        Localisation.timeZone().setTimeZone($scope.booking.Company.DefaultTimezone);
                    }

                    setupMap();
                    manageBookingStatus($scope.booking.BookingStatus);
                    
                } else {
                    $('#track #loading').hide();
                    $('#track #not-found').show();
                }
            }, function errorCallback(response) {});
        }

        function setupMap() {
            var mapCenter = new google.maps.LatLng($scope.booking.BookingStops[0].Latitude, $scope.booking.BookingStops[0].Longitude);

            $scope.map = new google.maps.Map(document.getElementById('map-div'), {
                center: mapCenter,
                zoom: 14,
                disableDefaultUI: true,
                styles: mapStyles
            });

            $scope.map.setOptions({ maxZoom: 15 });
            setupBooking();
        }

        function setupBooking() {

            //setup driver marker
            $scope.driverMarker = new SlidingMarker({
                map: $scope.map,
                icon: {
                    url: '../includes/images/car1.png',
                    scaledSize: new google.maps.Size(32, 42)
                }
            });

            if ($scope.booking.Driver) {
                $scope.driverMarker.setPosition(new google.maps.LatLng($scope.booking.Driver.LastKnownLatitude, $scope.booking.Driver.LastKnownLongitude));
            }

            //setup drop marker
            if ($scope.booking && $scope.booking.BookingStops && $scope.booking.BookingStops.length > 1) {
                $scope.dropMarker = new google.maps.Marker({
                    map: $scope.map,
                    icon: {
                        url: '../includes/images/dropoff.png',
                        scaledSize: new google.maps.Size(48, 54)
                    },
                    position: new google.maps.LatLng($scope.booking.BookingStops[$scope.booking.BookingStops.length - 1].Latitude, $scope.booking.BookingStops[$scope.booking.BookingStops.length - 1].Longitude)
                });
            }

            //setup pickup marker
            $scope.pickupMarker = new google.maps.Marker({
                map: $scope.map,
                icon: {
                    url: '../includes/images/pickup.png',
                    scaledSize: new google.maps.Size(48, 54)
                },
                position: new google.maps.LatLng($scope.booking.BookingStops[0].Latitude, $scope.booking.BookingStops[0].Longitude)
            });

            if ($scope.booking.BookingStatus == "InProgress" && $scope.booking.AsDirected == false) {
                    getETA([$scope.driverMarker, $scope.dropMarker]);
                    //fitMapToPoints([$scope.pickupMarker, $scope.driverMarker, $scope.dropMarker]);
                } else if ($scope.booking.BookingStatus == "OnRoute" || $scope.booking.BookingStatus == "Arrived") {
                    getETA([$scope.driverMarker, $scope.pickupMarker]);
                    //fitMapToPoints([$scope.pickupMarker, $scope.driverMarker]);
                }

            //setup other stops marker
            if ($scope.booking && $scope.booking.BookingStops && $scope.booking.BookingStops.length > 2) {
                for (i = 1; i < $scope.booking.BookingStops.length; i++) {
                    var _marker = new google.maps.Marker({
                        map: $scope.map,
                        icon: {
                            url: '../includes/images/dropoff.png',
                            scaledSize: new google.maps.Size(48, 54)
                        },
                        position: new google.maps.LatLng($scope.booking.BookingStops[i].Latitude, $scope.booking.BookingStops[i].Longitude)
                    });
                }
            }

            if ($scope.booking.PartnerDriver) {
                var pd = $scope.booking.PartnerDriver;
                $scope.driverMarker.setPosition(new google.maps.LatLng(pd.LastKnownLatitude, pd.LastKnownLongitude));

                if ($scope.booking.BookingStatus == "InProgress" && $scope.booking.AsDirected == false) {
                    getETA([$scope.driverMarker, $scope.dropMarker]);
                } else if ($scope.booking.BookingStatus == "OnRoute" || $scope.booking.BookingStatus == "Arrived") {
                    getETA([$scope.driverMarker, $scope.pickupMarker]);
                }
            }

            $('#track #loading').hide();
        }

        function formatDriverImage(driver) {
            if (driver && driver.ImageUrl) {
                if (driver.ImageUrl.slice(0, 4) == 'http') {
                    return driver.ImageUrl;
                } else {
                    return window.resourceEndpoint + driver.ImageUrl;
                }
            } else {
                return window.endpoint + 'api/imagegen?text=' + (driver.Callsign || '').replace(/ /g, "+");
            }
        }

        function fitMapToPoints(points) {
            var bounds = new google.maps.LatLngBounds();
            angular.forEach(points, function(p) {
                if (p && p.position) {
                    bounds.extend(p.position);
                }
            });
            $scope.map.fitBounds(bounds);
        }

        function fitMapToJourney() {
            var bounds = new google.maps.LatLngBounds();
            for (i = 0; i < $scope.booking.BookingStops.length; i++) {
                if ($scope.booking.BookingStops[i].Latitude && $scope.booking.BookingStops[i].Longitude) {
                    bounds.extend(new google.maps.LatLng($scope.booking.BookingStops[i].Latitude, $scope.booking.BookingStops[i].Longitude));
                }
            }
            $scope.map.fitBounds(bounds);
        }

        function getETA(points) {
            var pointsUrl = "";
            angular.forEach(points, function(p) {
                if (p && p.position)
                    pointsUrl += "point=" + p.position.lat() + ',' + p.position.lng() + '&'
            });
            $http({
                method: 'GET',
                url: 'https://directions.cab9.co/route?' + pointsUrl + 'vehicle=car'
            }).then(function successCallback(response) {
                $scope.$eta = Math.round(((response.data.paths[0].time * 1.1) / 1000) / 60);
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
        }

        function drawRoute(encodedPolyline) {
            var decodedPath = google.maps.geometry.encoding.decodePath(encodedPolyline);
            var decodedLevels = decodeLevels("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
            var _p = new google.maps.Polyline({
                path: decodedPath,
                levels: decodedLevels,
                strokeColor: "#63C4E1",
                strokeOpacity: 0.8,
                strokeWeight: 6,
                map: $scope.map
            });

            var bounds = new google.maps.LatLngBounds();
            angular.forEach(decodedPath, function(p) {
                bounds.extend(p);
            });
            $scope.map.fitBounds(bounds);
        }

        function decodeLevels(encodedLevelsString) {
            var decodedLevels = [];

            for (var i = 0; i < encodedLevelsString.length; ++i) {
                var level = encodedLevelsString.charCodeAt(i) - 63;
                decodedLevels.push(level);
            }

            return decodedLevels;
        }

        function manageBookingStatus(bookingStatus) {
            if (bookingStatus == "Incoming" || bookingStatus == "PreAllocated" || bookingStatus == "Allocated") {
                $scope.booking.$BookingStatus = "New Booking";
                $scope.booking.$JourneyLabel = "Pickup From";
                $scope.booking.$JourneyString = $scope.booking.BookingStops[0].StopSummary;
                if ($scope.booking.AsDirected) {
                    fitMapToPoints([$scope.pickupMarker, $scope.driverMarker]);
                } else {
                    fitMapToPoints([$scope.pickupMarker, $scope.dropMarker]);
                }
            }
            if (bookingStatus == "OnRoute") {
                $scope.booking.$BookingStatus = "Driver En-Route";
                $scope.booking.$JourneyLabel = "Pickup From";
                $scope.booking.$JourneyString = $scope.booking.BookingStops[0].StopSummary;
                fitMapToPoints([$scope.pickupMarker, $scope.driverMarker]);
            } else if (bookingStatus == "Arrived") {
                $scope.booking.$BookingStatus = "Driver Arrived"
                $scope.booking.$JourneyLabel = "Pickup From";
                $scope.booking.$JourneyString = $scope.booking.BookingStops[0].StopSummary;
                fitMapToPoints([$scope.pickupMarker, $scope.driverMarker]);
            } else if (bookingStatus == "InProgress") {
                $scope.booking.$BookingStatus = "Journey Progress"
                var ns = $scope.booking.BookingStops.length - 1;
                $scope.booking.$JourneyLabel = "Dropoff At";
                $scope.booking.$JourneyString = $scope.booking.BookingStops[ns].StopSummary;
                if ($scope.booking.AsDirected) {
                    fitMapToPoints([$scope.pickupMarker, $scope.driverMarker]);
                } else {
                    fitMapToPoints([$scope.pickupMarker, $scope.dropMarker, $scope.driverMarker]);
                }
            } else if (bookingStatus == "Completed") {
                $scope.booking.$BookingStatus = "Journey Completed"
                var ns = $scope.booking.BookingStops.length - 1;
                $scope.booking.$JourneyLabel = "Dropoff At";
                $scope.booking.$JourneyString = $scope.booking.BookingStops[ns].StopSummary;
                fitMapToJourney();
                $scope.$eta = null;
            }
        }

    }

})(window, angular);