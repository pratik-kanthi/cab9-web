(function(angular) {
    var module = angular.module('cab9.common');

    module.controller('DriverTrackingController', driverTrackingController);

    driverTrackingController.$inject = ['$scope', '$config', 'Google', 'SignalR', '$timeout', '$interval', '$http', 'rBooking'];

    function driverTrackingController($scope, $config, Google, SignalR, $timeout, $interval, $http, rBooking) {
        $scope.booking = rBooking[0];
        var mapObject = null;

        function getEta() {
            var b = $scope.booking
            if (b.BookingStatus == 'OnRoute') {
                $http.get('http://directions.cab9.co/route?point=' + b.Driver.LastKnownLatitude + ',' + b.Driver.LastKnownLongitude + '&point=' + b.BookingStops[0].Latitude + ',' + b.BookingStops[0].Longitude + '&vehicle=car')
                    .then(function(result) {
                        $scope.eta = Math.round(((result.data.paths[0].time * 1.1) / 1000) / 60);
                    });
            } else if (b.BookingStatus == 'Arrived') {
                $scope.eta = "0";
            } else if (b.BookingStatus == 'InProgress') {
                if (!b.AsDirected)
                    $http.get('http://directions.cab9.co/route?point=' + b.Driver.LastKnownLatitude + ',' + b.Driver.LastKnownLongitude + '&point=' + b.BookingStops[b.BoookingStops.length - 1].Latitude + ',' + b.BookingStops[b.BoookingStops.length - 1].Longitude + '&vehicle=car')
                    .then(function(result) {
                        $scope.eta = Math.round(((result.data.paths[0].time * 1.1) / 1000) / 60);
                    });
            } else if (b.BookingStatus == 'Completed') {
                $scope.eta = "0";
            }
        }

        $interval(getEta, 60000);

        $timeout(function() {
            SignalR.server.startLocations();
        }, 1000);
        $scope.$on('$destroy', function() {
            SignalR.server.stopLocations();
        });

        $scope.$on('SIGNALR_updateDriverLocation', onUpdateDriverLocation);
        // $scope.$on('SIGNALR_updateBooking', onUpdateBooking);

        var routeMarkers = [];
        $timeout(function() {
            initMap();
        }, 0);

        function initMap() {
            mapObject = L.map('mapid').setView([51.496384198223355, -0.12875142186092202], 11);
            L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic291bXlha2FudGhpIiwiYSI6ImNpdHdsMnQyMjAwOHQydG84endtZDE5N28ifQ.7eTer7TOkCSNj_M3Qaehfw', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                maxZoom: 18,
                id: '256',
                accessToken: 'pk.eyJ1Ijoic291bXlha2FudGhpIiwiYSI6ImNpdHdsMnQyMjAwOHQydG84endtZDE5N28ifQ.7eTer7TOkCSNj_M3Qaehfw'
            }).addTo(mapObject);

            _getBookingMarkers($scope.booking);
        }


        function _getBookingMarkers(booking) {
            var bounds = [];
            angular.forEach(booking.BookingStops, function(bs, index) {
                if (bs.Latitude && bs.Longitude) {
                    if (index == 0) {
                        var pickUpIcon = L.icon({
                            iconUrl: '/includes/images/pickup@1x.png',
                            iconRetinaUrl: '/includes/images/pickup@2x.png',
                            iconSize: [50, 50]

                        });
                        L.marker([bs.Latitude, bs.Longitude], { icon: pickUpIcon }).addTo(mapObject).bindPopup('<p>' + bs.StopSummary + '</p>');
                    } else if (index == booking.BookingStops.length - 1) {
                        var dropOffIcon = L.icon({
                            iconUrl: '/includes/images/dropoff@1x.png',
                            iconRetinaUrl: '/includes/images/dropoff@2x.png',
                            iconSize: [50, 50]
                        });
                        L.marker([bs.Latitude, bs.Longitude], { icon: dropOffIcon }).addTo(mapObject).bindPopup('<p>' + bs.StopSummary + '</p>');
                    } else {
                        var stopIcon = L.icon({
                            iconUrl: '/includes/images/stop@1x.png',
                            iconRetinaUrl: '/includes/images/stop@2x.png',
                            iconSize: [50, 50]
                        });
                        L.marker([bs.Latitude, bs.Longitude], { icon: stopIcon }).addTo(mapObject).bindPopup('<p>' + bs.StopSummary + '</p>');
                    }
                }
                bounds.push([bs.Latitude, bs.Longitude]);
                mapObject.fitBounds(bounds, {
                    animate: true
                });
            });
        }


        var initial = true;

        // function _getMarkerForDriver(shift) {
        //     if (shift && shift.LastKnownLatitude && shift.LastKnownLongitude) {
        //         var marker = new google.maps.Marker({
        //             position: new google.maps.LatLng(shift.LastKnownLatitude, shift.LastKnownLongitude),
        //             title: shift.Callsign,
        //             animation: google.maps.Animation.DROP,
        //             icon: {
        //                 url: '/includes/images/car1.png',
        //                 scaledSize: new google.maps.Size(45, 58)
        //             },
        //             map: $scope.mapObject,
        //             optimized: false
        //         });

        //         // var myoverlay = new google.maps.OverlayView();
        //         // myoverlay.draw = function() {
        //         //     this.getPanes().markerLayer.id = 'markerLayer';
        //         // };
        //         // myoverlay.setMap($scope.mapObject);

        //         if (initial)
        //             getEta();
        //         else
        //             initial = false;
        //         return marker;

        //     } else {
        //         return null;
        //     }
        // }

        function _getMarkerForDriver(shift) {
            if (shift && shift.LastKnownLatitude && shift.LastKnownLongitude) {
                var driverIcon = L.icon({
                    iconUrl: '/includes/images/file.svg',
                    iconRetinaUrl: '/includes/images/file.svg',
                    iconSize: [38, 95],
                });

                if (initial)
                    getEta();
                else
                    initial = false;

                return L.marker([shift.LastKnownLatitude, shift.LastKnownLongitude], { icon: driverIcon }).addTo(mapObject);
            } else
                return null;

        }




        // function _getDirectionsForBooking(booking) {
        //     var first = true;
        //     angular.forEach(booking.BookingStops, function(bs) {
        //         if (bs.Latitude && bs.Longitude) {
        //             var position = new google.maps.LatLng(bs.Latitude, bs.Longitude);
        //             var marker = new google.maps.Marker({
        //                 position: position,
        //                 visible: true,
        //                 icon: {
        //                     url: (first) ? '/includes/images/first.png' : '/includes/images/last.png',
        //                     scaledSize: new google.maps.Size(28, 28),
        //                 },
        //                 map: $scope.mapObject,
        //                 zIndex: 1000
        //             });
        //             routeMarkers.push(marker);
        //         }
        //         first = false;
        //     });
        // }


        $scope.showDriverDetails = function() {
            $('#driverDetails').toggle();
        }



        function onUpdateDriverLocation(event, args) {
            var update = args[0];
            if (update.DriverId == $scope.booking.DriverId && $scope.booking.Driver.DriverStatus != 'Offline') {
                $scope.booking.Driver.LastKnownLatitude = angular.copy(update.Latitude);
                $scope.booking.Driver.LastKnownLongitude = angular.copy(update.Longitude);
                if ($scope.booking.Driver.$marker) {
                    $scope.booking.Driver.$marker.on('move', function(ev) {
                        // var y = Math.sin(ev.latlng.lng - ev.oldLatLng.lng) * Math.cos(ev.latlng.lat);
                        // var x = Math.cos(ev.oldLatLng.lat) * Math.sin(ev.latlng.lat) -
                        //     Math.sin(ev.oldLatLng.lat) * Math.cos(ev.latlng.lat) * Math.cos(ev.latlng.lng - ev.oldLatLng.lng);
                        // var brng = Math.atan2(y, x) * (180 / Math.PI);
                        // console.log(brng);
                        var heading = google.maps.geometry.spherical.computeHeading(new google.maps.LatLng(ev.oldLatLng.lat, ev.oldLatLng.lng), new google.maps.LatLng(ev.latlng.lat, ev.latlng.lng));
                        $scope.booking.Driver.$marker.setRotationAngle(heading);
                    })

                    $scope.booking.Driver.$marker.setLatLng([update.Latitude, update.Longitude]);
                } else {
                    $scope.booking.Driver.$marker = _getMarkerForDriver($scope.booking.Driver);

                }
                // mapObject.panTo([update.Latitude, update.Longitude], { animate: true });
                // mapObject.setZoom(16);


                mapObject.setView([update.Latitude, update.Longitude], 16, { animate: true })


            }

        }

        function onUpdateDriverStatus(event, args) {


        }

        function onUpdateBooking(event, args) {
            var update = args[0];
            if (update.Id == $scope.booking.Id) {
                $scope.booking.BookingStatus = update.BookingStatus;
                getEta();
            }

        }

        $scope.$watch('booking.BookingStatus', function() {
            if ($scope.booking.BookingStatus == 'OnRoute')
                $scope.driverStatus = 'Driver onroute to ' + $scope.booking.BookingStops[0].StopSummary;
            else if ($scope.booking.BookingStatus == 'Arrived') {
                $scope.driverStatus = 'Driver arrived at ' + $scope.booking.BookingStops[0].StopSummary;

            } else if ($scope.booking.BookingStatus == 'InProgress') {
                if ($scope.booking.AsDirected)
                    $scope.driverStatus = 'Driver on trip'
                else {
                    $scope.driverStatus = 'Driver on trip to ' + $scope.booking.BookingStops[$scope.booking.BookingStops.length - 1].StopSummary;

                }
            } else if ($scope.booking.BookingStatus == 'Completed') {
                $scope.driverStatus = 'Driver has arrived at the destination ' + $scope.booking.BookingStops[$scope.booking.BookingStops.length - 1].StopSummary;

            }
        })
    }
})(angular);
