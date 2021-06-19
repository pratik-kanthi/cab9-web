(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorksharePartnerLiveController', WorksharePartnerLiveController);

    WorksharePartnerLiveController.$inject = ['$scope', '$config', '$http', '$timeout', 'rCompanyProfile', 'rProfile'];

    function WorksharePartnerLiveController($scope, $config, $http, $timeout, rCompanyProfile, rProfile) {
        $scope.companyProfile = rCompanyProfile;
        $scope.profile = rProfile;
        $scope.mapBounds = new google.maps.LatLngBounds();
        $scope.drivers = [];
        $scope.fetching = true;
        getPartnerBookings();

        function getPartnerBookings() {
            $http({
                url: $config.API_ENDPOINT + 'api/partners/' + $scope.companyProfile.TenantId + '/bookings',
                method: 'GET'
            }).then(function successCallback(response) {
                $scope.bookingStops = response.data;
                if ($scope.companyProfile.ShowLiveDrivers && $scope.profile.ShowLiveDrivers) {
                    getPartnerLocationDetails();
                } else {
                    setupMap();
                }
                $scope.fetching = false;
            }, function errorCallback(error) {
                $scope.fetching = false;
                swal("Get Partner Locations", error.data.ExceptionMessage, "error");
            });
        }

        function getPartnerLocationDetails() {
            $scope.drivers.length = 0;
            $http({
                url: $config.API_ENDPOINT + 'api/partners/' + $scope.companyProfile.TenantId + '/driver-locations',
                method: 'GET'
            }).then(function successCallback(response) {
                $scope.drivers = response.data;
                setupMap();
            }, function errorCallback(error) {
                swal("Get Partner Locations", error.data.ExceptionMessage, "error");
            });
        }

        function setupMap() {
            $scope.markers = [];
            var bounds = new google.maps.LatLngBounds();
            angular.forEach($scope.drivers, function (driver) {
                marker = {
                    id: driver.Id,
                    coords: {
                        latitude: driver.LastKnownLatitude,
                        longitude: driver.LastKnownLongitude
                    },
                    mapOptions: {
                        icon: {
                            url: '/includes/images/car1.png',
                            scaledSize: new google.maps.Size(32, 42),
                        },
                        title: $scope.companyProfile.Name,
                        zIndex: google.maps.Marker.MAX_ZINDEX + 1,
                    }
                }
                bounds.extend(new google.maps.LatLng(driver.LastKnownLatitude, driver.LastKnownLongitude))
                $scope.markers.push(marker);
            });
            $scope.mapBounds = {
                northeast: {
                    latitude: bounds.getNorthEast().lat(),
                    longitude: bounds.getNorthEast().lng(),
                },
                southwest: {
                    latitude: bounds.getSouthWest().lat(),
                    longitude: bounds.getSouthWest().lng(),
                }
            }
            // setup map 
            $scope.map = {
                center: {
                    latitude: $scope.companyProfile.BaseLatitude || 54.3781,
                    longitude: $scope.companyProfile.BaseLongitude || -1.5360
                },
                zoom: 9,
                heatLayerCallback: function (layer) {
                    var heatLayer = new HeatLayer(layer);
                },
                showHeat: true,
                styles: [{
                    "featureType": "water",
                    "elementType": "geometry",
                    "stylers": [{
                        "color": "#193341"
                    }]
                }, {
                    "featureType": "landscape",
                    "elementType": "geometry",
                    "stylers": [{
                        "color": "#2c5a71"
                    }]
                }, {
                    "featureType": "road",
                    "elementType": "geometry",
                    "stylers": [{
                        "color": "#29768a"
                    }, {
                        "lightness": -37
                    }]
                }, {
                    "featureType": "poi",
                    "elementType": "geometry",
                    "stylers": [{
                        "color": "#406d80"
                    }]
                }, {
                    "featureType": "transit",
                    "elementType": "geometry",
                    "stylers": [{
                        "color": "#406d80"
                    }]
                }, {
                    "elementType": "labels.text.stroke",
                    "stylers": [{
                        "visibility": "on"
                    }, {
                        "color": "#3e606f"
                    }, {
                        "weight": 2
                    }, {
                        "gamma": 0.84
                    }]
                }, {
                    "elementType": "labels.text.fill",
                    "stylers": [{
                        "color": "#ffffff"
                    }]
                }, {
                    "featureType": "administrative",
                    "elementType": "geometry",
                    "stylers": [{
                        "weight": 0.6
                    }, {
                        "color": "#1a3541"
                    }]
                }, {
                    "elementType": "labels.icon",
                    "stylers": [{
                        "visibility": "off"
                    }]
                }, {
                    "featureType": "poi.park",
                    "elementType": "geometry",
                    "stylers": [{
                        "color": "#2c5a71"
                    }]
                }]
            };
        }

        function HeatLayer(layer) {
            var data = [];
            angular.forEach($scope.bookingStops, function (stop) {
                var latLong = new google.maps.LatLng(stop.Latitude, stop.Longitude);
                data.push({
                    location: latLong,
                    weight: 1
                });
            })
            var pointArray = new google.maps.MVCArray(data);
            layer.setData(pointArray);
            layer.setOptions({
                dissipating: true,
                radius: 50,
                opacity: 0.75
            });
        };
    }
}(angular));