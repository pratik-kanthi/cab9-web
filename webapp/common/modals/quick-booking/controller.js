(function(angular) {
    var module = angular.module('cab9.common');

    module.controller('QuickBookingCreateController', quickBookingCreateController);

    quickBookingCreateController.$inject = ['$scope', '$UI', '$config', '$q', 'Model', '$stateParams', '$modalInstance', '$rootScope', '$q', 'Localisation', '$utilities', '$http', '$timeout'];

    function quickBookingCreateController($scope, $UI, $config, $q, Model, $stateParams, $modalInstance, $rootScope, $q, Localisation, $utilities, $http, $timeout) {

        setupBooking();
        setupData();
        setTimeout(function() { setupMap(); }, 10);
        $scope.paxMode = {
            value: false
        }
        
        $scope.save = save;
        $scope.close = close;
        $scope.repeatBooking = repeatBooking;
        $scope.currentTab = 'JOURNEY';

        function setupBooking() {
            var _b = $scope._qbooking = new Model.Booking();
            $scope.displayMode = 'CREATE';
            _b.BookingStops = [];
            _b.BookingStops.push(new Model.BookingStop());
            _b.BookingStops.push(new Model.BookingStop());
            _b.Pax = 1
            _b.Bax = 0;
            _b.TaxId = $scope.COMPANY.DefaultTaxId;

            var dt = new moment.tz(Localisation.timeZone().getTimeZone());
            _b.BookedDateTime = dt.toDate();
            _b.Time = dt.startOf('minute').add(15, 'minutes').toDate();
            _b.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
            _b.EstimatedCost = 0;
        }

        function setupMap() {
            $scope.quickmap = new google.maps.Map(document.getElementById('map-div'), {
                center: new google.maps.LatLng($scope.COMPANY.BaseLatitude, $scope.COMPANY.BaseLongitude),
                zoom: 9,
                disableDefaultUI: true,
                styles: $config.GMAPS_STYLE
            });
        }

        function setupData() {

            var promises = [];
            $scope.dataReady = false;

            var _clientP = Model.Client.query().select('Id,Name,DefaultCurrencyId,ImageUrl,ClientType/Name').include('ClientType').parseAs(function(item) {
                this.Id = item.Id;
                this.Name = item.Name;
                this.DefaultCurrencyId = item.DefaultCurrencyId;
                this.Description = item.ClientType.Name;
                this.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Name);
            }).execute().then(function(data) {
                $scope.filteredClients = $scope.clients = data;
            });

            var _passengerP = Model.Passenger.query().select('Id,Firstname,Surname,ImageUrl,Mobile,ClientId,Client/Name').include('Client').parseAs(function(item) {
                this.Id = item.Id;
                this.ClientId = item.ClientId;
                this.Name = item.Firstname + ' ' + item.Surname;
                this.Description = (item.Client && item.Client.Name) ? item.Client.Name : 'No Client';
                this.Mobile = item.Mobile;
                this.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Name);
            }).execute().then(function(data) {
                $scope.filteredPassengers = $scope.passengers = data;
            });

            var _vehicleTypeP = Model.VehicleType.query().execute().then(function(data) {
                $scope.vehicleTypes = data;
            });

            promises.push(_clientP);
            promises.push(_passengerP);
            promises.push(_vehicleTypeP);

            $q.all(promises).then(function() {
                $scope.dataReady = true;
            });
        }

        function save() {
            var promises = [];
            var b = $scope._qbooking;
            if ($scope.paxMode.value) {
                if (!b._LeadPassenger) {
                    swal('Invalid', 'Please add passenger details.', 'error');
                    return;
                }
                var split = b._LeadPassenger.split(' ');
                $scope._qbooking.LeadPassenger = {
                    Firstname: split[0],
                    Surname: split.slice(1).join(' '),
                    Mobile: b._LeadPassengerNumber,
                    ClientId: b.ClientId
                };
            }
            var time = new moment($scope._qbooking.Time).tz(Localisation.timeZone().getTimeZone());
            var bdt = new moment($scope._qbooking.BookedDateTime).format("YYYY-MM-DD") + "T" + time.format("HH:mm") + moment.tz(Localisation.timeZone().getTimeZone()).format('Z');
            $scope._qbooking.BookedDateTime = bdt;
            promises.push($scope._qbooking.$save());
            $q.all(promises).then(function(result) {
                swal({
                    title: "Booking Saved.",
                    text: "The booking has been saved..",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $modalInstance.close(result[0].data);
            }, function(error) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error"
                });
            });
        }

        $scope.$watch("_qbooking.LeadPassengerId", function (newvalue) {
            var b = $scope._qbooking;
            if (newvalue) {
                b.ClientId = $scope.passengers.filter(function (item) {
                    return item.Id == newvalue;
                })[0].ClientId;

                Model.Booking.query().where("LeadPassengerId", 'eq', "guid'" + newvalue + "'").include('BookingStops').orderBy('BookedDateTime desc').top(5).execute().then(function (d) {
                    $scope.paxHistory = d;
                    $scope.currentTab = 'HISTORY';
                });
            } else {
                b.ClientId = null;
                $scope.filteredPassengers = $scope.passengers;
            }
        });

        var initializing = true
        $scope.$watch("_qbooking.ClientId", function (newvalue) {
            if (initializing) {
                setTimeout(function() {
                    initializing = false;
                }, 0);
            } else {
                if(newvalue) {
                    $scope.filteredPassengers = $scope.passengers.filter(function (item) {
                        return item.ClientId == newvalue;
                    });
                }
            }

            if ($scope._qbooking.ClientId) {
                var client = $scope.clients.filter(function (c) {
                    return c.Id == $scope._qbooking.ClientId
                })[0];
                if (client)
                    $scope._qbooking.CurrencyId = client.DefaultCurrencyId;
            } else {
                $scope._qbooking.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
            }
        }, true);

        $scope.$watch("_qbooking.BookingStops", function(newvalue) {
            $scope.canQuote = false;
            var markers = [];
            angular.forEach(newvalue, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                } else {
                    $scope.canQuote = true;
                    var pos = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                    if (!markers[$index]) {
                        markers[$index] = new google.maps.Marker({
                            position: pos,
                            visible: true,
                            icon: ($index == 0) ? '/includes/images/user.png' : '/includes/images/userTo.png',
                            map: $scope.quickmap,
                            zIndex: 1000
                        });
                    } else {
                        markers[$index].setPosition(pos);
                    }
                    if ($index == 0 && $scope._qbooking.BookingStops.length < 3) {
                        $scope.quickmap.panTo(pos);
                        $scope.quickmap.setZoom(15);
                    }
                }
            });
            if ($scope.canQuote) {
                getQuote($scope._qbooking);
            } else {
                $scope._qbooking.EstimatedCost = 0;
                $scope._qbooking.ActualCost = 0;
            }
        }, true);

        $scope.$watch("_qbooking.VehicleTypeId", function (newvalue) {
            $scope.canQuote = false;
            var markers = [];
            angular.forEach($scope._qbooking.BookingStops, function (bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                } else {
                    $scope.canQuote = true;
                    var pos = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                    if (!markers[$index]) {
                        markers[$index] = new google.maps.Marker({
                            position: pos,
                            visible: true,
                            icon: ($index == 0) ? '/includes/images/user.png' : '/includes/images/userTo.png',
                            map: $scope.quickmap,
                            zIndex: 1000
                        });
                    } else {
                        markers[$index].setPosition(pos);
                    }
                    if ($index == 0 && $scope._qbooking.BookingStops.length < 3) {
                        $scope.quickmap.panTo(pos);
                        $scope.quickmap.setZoom(15);
                    }
                }
            });
            if ($scope.canQuote) {
                getQuote($scope._qbooking);
            } else {
                $scope._qbooking.EstimatedCost = 0;
                $scope._qbooking.ActualCost = 0;
            }
        });

        $scope.$watch("paxMode.value", function(newvalue) {
            if(newvalue === true) {
                $scope._qbooking.LeadPassengerId = null;
            }
        });

        function getQuote(booking) {
            $scope.dataReady = false;
            var directionsRenderer = null;
            $http.post($config.API_ENDPOINT + 'api/quote', booking)
                .success(function(result) {
                    booking.EstimatedCost = result.FinalCost;
                    booking.ActualCost = result.FinalCost;
                    $scope.dataReady = true;
                    $scope.currentTab = 'JOURNEY';
                    $scope.directions = result.Directions;

                    var decodedPath = google.maps.geometry.encoding.decodePath(result.Directions.paths[0].points);

                    var _directionsPolyline = new google.maps.Polyline({
                        map: $scope.quickmap,
                        path: decodedPath,
                        geodesic: true,
                        strokeColor: '#63C4E1',
                        strokeOpacity: 0.8,
                        strokeWeight: 6
                    });
                    var bounds = new google.maps.LatLngBounds();
                    for (i = 0; i < decodedPath.length; i++) {
                        bounds.extend(decodedPath[i]);
                    }
                    $timeout(function () {
                        $scope.quickmap.fitBounds(bounds);
                    }, 500);
                }).error(function(error) {
                    console.log(error);
                    $scope.dataReady = true;
                });
        }

        function repeatBooking(booking) {
            $scope.journeyCopied = false;
            $scope._qbooking.BookingStops = [];
            $scope._qbooking.BookingStops = angular.copy(booking.BookingStops).map(function (s) {
                s.Id = null;
                s.BookingId = null;
                s.Booking = null;
                return s;
            });
            $scope.journeyCopied = true;
        }

        function getRouteDirections(route) {
            clearDirections();
        }

        function clearDirections() {
            $scope.directions = null;
            if (directionsRenderer) {
                directionsRenderer.setMap(null);
                directionsRenderer = null;
            }
        }

        function close() {
            $modalInstance.close();
        }


    }

}(angular))
