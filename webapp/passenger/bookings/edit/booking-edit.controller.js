(function (angular) {
    var module = angular.module('cab9.passenger.bookings');
    module.controller('BookingCreateController', BookingCreateController);
    module.controller('BookingEditController', BookingEditController);

    BookingCreateController.$inject = ['$scope', '$http', '$config', '$state', '$timeout', 'Auth', 'Google', '$tenantConfig', 'Model', 'rClient', 'rPassenger', 'rVehicleTypes', 'rVehicleClasses','Localisation', '$filter', 'rCurrencies', 'rTaxes', '$window'];

    function BookingCreateController($scope, $http, $config, $state, $timeout, Auth, Google, $tenantConfig, Model, rClient, rPassenger, rVehicleTypes, rVehicleClasses, Localisation, $filter, rCurrencies, rTaxes, $window) {
        var currentQuote = null;
        $scope.viewMode = "CREATE";
        $scope.paxMode = {
            value: false
        };
        $scope.showTraffic = false;
        $scope.selectedBooking = null;
        $scope.clients = rClient;
        $scope.vehicleTypes = rVehicleTypes;
        $scope.vehicleClasses = rVehicleClasses;
        $scope.passengers = rPassenger;
        $scope.taxes = rTaxes;

        $scope.setupComplete = false;

        $scope.startNew = startNew;
        $scope.book = book;
        $scope.cancel = cancel;
        $scope.addStop = addStop;
        $scope.getQuote = getQuote;
        $scope.getPassengerName = getPassengerName;

        $scope.discount = {
            type: 'amount'
        };
        $scope.available = rCurrencies;
        var currencyObj = Localisation.currency();

        $scope.map = {
            center: {
                latitude: $scope.COMPANY.BaseLatitude || 51.471507,
                longitude: $scope.COMPANY.BaseLongitude || -0.487904
            },
            disableDefaultUI: true,
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
            }],
            zoom: $scope.COMPANY.BaseZoom || 7,
            traffic: {
                show: false,
                options: {

                }
            }
        };

        $scope.paxFilter = function (pax) {
            if ($scope.selectedBooking.ClientId) {
                return pax.ClientId == $scope.selectedBooking.ClientId;
            } else {
                return true;
            }
        }

        $scope.directions = {
            renderer: null,
            current: null,
            currentRoute: null,
            currentStep: null,
            setRoute: function (route) {
                if (route != this.currentRoute) {
                    this.currentRoute = route;
                    this.currentStep = null;
                    this.renderer.setRouteIndex(this.current.routes.indexOf(route));
                }
            },
            viewStep: function (step) {
                this.currentStep = step;
                $scope.map.center.latitude = step.start_point.lat();
                $scope.map.center.longitude = step.start_point.lng();
            },
            setDirections: function (directions) {
                this.current = directions;
                this.currentStep = null;
                this.currentRoute = directions ? directions.routes[0] : null;
                this.options.directions = directions;
                if (directions) {
                    $scope.selectedBooking.EncodedRoute = this.currentRoute.overview_polyline;
                    if (!this.renderer) {
                        this.options.map = $scope.map.getGMap();
                        this.renderer = new google.maps.DirectionsRenderer(this.options);
                    } else {
                        this.renderer.setDirections(directions);
                        this.renderer.setMap($scope.map.getGMap());
                    }
                } else {
                    this.current = null;
                    this.options.directions = null;
                    if (this.renderer) {
                        this.renderer.setMap(null);
                    }
                }
                if (this.currentRoute && this.currentRoute.legs && this.currentRoute.legs[0]) {
                    $scope.selectedBooking.EstimatedDuration = Math.ceil(this.currentRoute.legs[0].duration.value / 600) * 10;
                    $scope.selectedBooking.EstimatedDistance = this.currentRoute.legs[0].distance.value;
                }
            },
            options: {
                suppressInfoWindows: true,
                suppressMarkers: false,
                directions: null,
                panel: document.getElementById('google-directions')
            }
        }

        function startNew() {

            $scope.selectedBooking = new Model.Booking();

            $scope.selectedBooking.BookingStops.length = 0;

            var stop = new Model.BookingStop();
            // stop.id = idCounter++;

            $scope.selectedBooking.BookingStops.push(stop);

            $scope.selectedBooking.Pax = 1;
            $scope.selectedBooking.Bax = 0;

            $scope.selectedBooking.TaxId = $scope.COMPANY.DefaultTaxId;
            if ($scope.COMPANY.ChauffeurModeActive == true) {
                $scope.selectedBooking.ChauffeurMode = true;
            }

            $scope.selectedBooking.VehicleTypeId = $tenantConfig.defaultVehicleType;
            $scope.selectedBooking.VehicleClassId = $tenantConfig.defaultVehicleClass;
            var dt = new moment.tz(Localisation.timeZone().getTimeZone());
            //dt.subtract(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes');
            $scope.selectedBooking.BookedDateTime = dt.toDate();
            $scope.selectedBooking.Time = dt.startOf('minute').add(15, 'minutes').toDate();
            $scope.selectedBooking.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
            $scope.EstimatedCost = 0;

            $scope.selectedBooking.ClientId = $scope.clients[0].Id.toLowerCase();
            $scope.selectedBooking.LeadPassengerId = $scope.passengers[0].Id.toLowerCase();
        }
        $scope.$watch("selectedBooking.AsDirected", function (newValue) {
            if (newValue) {
                $scope.selectedBooking.BookingStops.length--;
            } else {
                var stop = new Model.BookingStop();
                // stop.id = idCounter++;
                $scope.selectedBooking.BookingStops.push(stop);
            }
        });

        function getPassengerName(paxId) {
            var pax = $scope.selectedBooking.Passengers.filter(function (p) { return p.Id == paxId; })[0];
            if (pax) {
                return pax.Firstname + " " + pax.Surname;
            }
        }

        function addStop() {
            var stop = new Model.BookingStop();
            //stop.id = idCounter++;
            $scope.selectedBooking.BookingStops.push(stop);
        }

        $scope.$watch('selectedBooking.BookingStops', function () {
            if ($scope.selectedBooking.AsDirected) {

            } else if ($scope.selectedBooking.BookingStops.length < 2) {
                $scope.selectedBooking.EstimatedCost = 0;
                $scope.selectedBooking.validStops = false;
                return;
            }
            var canQuote = true;
            angular.forEach($scope.selectedBooking.BookingStops, function (bs) {
                if (!bs.Latitude || !bs.Longitude) {
                    canQuote = false;
                }
            });
            if (canQuote) {
                getRouteBetween($scope.selectedBooking.BookingStops.map(function (p) {
                    return new google.maps.LatLng(p.Latitude, p.Longitude);
                }));
                $scope.selectedBooking.validStops = true;
                getQuote();
            } else {
                $scope.directions.setDirections(null);
                $scope.selectedBooking.EstimatedCost = 0;
                $scope.selectedBooking.ActualCost = 0;
                $scope.selectedBooking.Discount = 0;
                $scope.selectedBooking.validStops = false;
            }
        }, true);

        $scope.$watch('selectedBooking.ClientId', function () {
            if ($scope.selectedBooking.ClientId) {
                var client = $scope.clients.filter(function (c) {
                    return c.Id == $scope.selectedBooking.ClientId
                })[0];
                if (client)
                    $scope.selectedBooking.CurrencyId = client.DefaultCurrencyId;
            }
        }, true);

        $scope.$watchGroup(['selectedBooking.BookingStops.length', 'selectedBooking.ClientId', 'selectedBooking.VehicleTypeId', 'selectedBooking.ChauffeurMode', 'selectedBooking.EstimatedMins'], function () {
            if (currentQuote) {
                $timeout.cancel(currentQuote)
                currentQuote = null;
            }
            if ($scope.setupComplete == true) {
                currentQuote = $timeout(getQuote, 500);
            }
        });

        $scope.$watch("selectedBooking.VehicleTypeId", function (newValue) {
            Model.Vehicle
                .query()
                .select('Id,Registration,Colour,Make,Model,Class,Type')
                .where('VehicleTypeId', '==', "guid'" + newValue + "'")
                .include('Class,Type')
                .parseAs(function (item) {
                    this.Id = item.Id;
                    this.Name = item.Registration;
                    this.Description = item.Colour + ' ' + item.Make + ' ' + item.Model;
                    this.DriverId = item.DriverId;
                    this.ImageUrl = window.formatImage(item.ImageUrl, item.Registration);
                }).execute()
                .then(function (data) {
                    $scope.vehicles = data;
                });
        });

        function getQuote() {
            $http.post($config.API_ENDPOINT + 'api/quote', $scope.selectedBooking)
                .success(function (result) {
                    result.FinalCost = result.FinalCost.toFixed(2);
                    if ($scope.selectedBooking.CurrencyId != $scope.COMPANY.DefaultCurrencyId) {
                        //if ($scope.selectedBooking.EstimatedCost == $scope.selectedBooking.ActualCost) {
                        //    $scope.selectedBooking.ActualCost = $filter('Convert')(result.FinalCost);
                        //}
                        $scope.selectedBooking.EstimatedCost = $filter('Convert')(result.FinalCost);
                        $scope.selectedBooking.ActualCost = $filter('Convert')(result.FinalCost);
                        $scope.EstimatedCost = result.FinalCost;
                        $scope.ActualCost = result.FinalCost;
                    } else {
                        //if ($scope.selectedBooking.EstimatedCost == $scope.selectedBooking.ActualCost) {
                        //    $scope.selectedBooking.ActualCost = result.FinalCost;
                        //}
                        $scope.selectedBooking.EstimatedMins = result.EstimatedMins;

                        $scope.selectedBooking.EstimatedCost = result.FinalCost;
                        $scope.selectedBooking.ActualCost = result.FinalCost;
                        $scope.EstimatedCost = result.FinalCost;
                        $scope.ActualCost = result.FinalCost;
                    }
                }).error(function (error) {
                    console.log(error);
                });
        }

        $scope.$watch('selectedBooking.Discount', function () {
            if ($scope.selectedBooking.Currency) {
                $scope.Discount = $scope.selectedBook
            }
        });

        $scope.$watch('selectedBooking.DriverCost', function () {
            if ($scope.selectedBooking.Currency) {
                $scope.DriverCost = $scope.selectedBo
            }
        });

        $scope.$watch('selectedBooking.InvoiceCost', function () {
            if ($scope.selectedBooking.Currency) {
                $scope.InvoiceCost = $scope.selectedB
            }
        });

        $scope.$watch('selectedBooking.CurrencyId', function () {
            currencyObj.setCurrent($scope.selectedBooking.CurrencyId);
            var found = $scope.available.filter(function (c) {
                return c.Id == $scope.selectedBooking.CurrencyId;
            })[0];
            $scope.selectedBooking.CurrencyRate = found.CurrentRate;
            $scope.symbol = found.Prepend;
            $scope.selectedBooking.Currency = found;
            $scope.selectedBooking.ActualCost = (($scope.ActualCost || 0) * found.CurrentRate).toFixed(2)
            $scope.selectedBooking.EstimatedCost = (($scope.EstimatedCost || 0) * found.CurrentRate).toFixed(2)

            if ($scope.selectedBooking.DriverCost)
                $scope.selectedBooking.DriverCost = (($scope.DriverCost || $scope.selectedBooking.DriverCost) * found.CurrentRate).toFixed(2)
            if ($scope.selectedBooking.InvoiceCost)
                $scope.selectedBooking.InvoiceCost = (($scope.InvoiceCost || $scope.selectedBooking.InvoiceCost) * found.CurrentRate).toFixed(2)
            if ($scope.discount.type == "amount") {
                $scope.selectedBooking.Discount = (($scope.Discount || $scope.selectedBooking.Discount) * found.CurrentRate).toFixed(2)
            }
            $scope.setupComplete = true;
        });

        function book(booking) {

            var time = new moment($scope.selectedBooking.Time).add(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes')
            var bdt = new moment($scope.selectedBooking.BookedDateTime).format("YYYY-MM-DD") + "T" + time.format("HH:mm") + moment.tz(Localisation.timeZone().getTimeZone()).format('Z');

            if ($scope.discount.type != "amount") {
                $scope.discount.type = 'amount';
                var discount = ($scope.selectedBooking.ActualCost * $scope.selectedBooking.Discount) / 100;
                $scope.selectedBooking.Discount = Math.round(discount * 100) / 100;
            }

            var b = $scope.selectedBooking;

            var booking = {
                BookingStatus: 'Confirmed',
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
                BookingStops: $scope.selectedBooking.BookingStops,
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
                    swal('Success', 'Booking Saved', 'success');
                    $state.go('root.bookings');
                })
                .error(function () {
                    swal("Error", "Something didn't work, please check input and try again", "error");
                })
        }

        function getRouteBetween(points) {
            Google.Maps.Directions.route(points).then(function (result) {
                $scope.directions.setDirections(result);
            });
        }

        function cancel(booking) {
            $scope.startNew();
            currencyObj.setCurrent($scope.COMPANY.DefaultCurrencyId);
        }

        $scope.startNew();
    }

    BookingEditController.$inject = ['$scope', '$q', '$http', '$config', '$timeout', 'Google', '$tenantConfig', 'Model', 'rBooking', 'rClients', 'rVehicleTypes', 'rVehicleClasses', 'rPassengers', 'Localisation', '$filter', 'rTaxes', '$window', 'Auth', 'Notification', '$modal'];

    function BookingEditController($scope, $q, $http, $config, $timeout, Google, $tenantConfig, Model, rBooking, rClients, rVehicleTypes, rVehicleClasses, rPassengers, Localisation, $filter, rTaxes, $window, Auth, Notification, $modal) {
        $scope.viewMode = "VIEW";
        var currentQuote = null;
        $scope.showTraffic = false;
        $scope.setupComplete = false;
        $scope.paxMode = {
            value: false
        };
        $scope.discount = {
            type: 'amount'
        };
        $scope.selectedBooking = rBooking;
        $scope.selectedBooking.BookedDateTime = new Date($scope.selectedBooking.BookedDateTime);
        var dt = new moment.tz(rBooking.BookedDateTime, Localisation.timeZone().getTimeZone());
        dt.subtract(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes');

        $scope.selectedBooking.Time = dt.toDate();
        $scope.selectedBooking.$commit(true);
        $scope.selectedBooking.BookingStops.map(function (bs) {
            bs.id = idCounter++
        });
        $scope.clients = rClients;
        $scope.vehicleTypes = rVehicleTypes;
        $scope.vehicleClasses = rVehicleClasses;
        $scope.passengers = rPassengers;
        $scope.taxes = rTaxes;
        $scope.symbol = $scope.selectedBooking.Currency.Prepend;

        $scope.startEdits = startEdits;
        $scope.cancel = cancel;
        $scope.save = save;
        $scope.cancelBooking = cancelBooking;
        $scope.getPassengerName = getPassengerName;

        $scope.EstimatedCost = $scope.selectedBooking.EstimatedCost;
        $scope.ActualCost = $scope.selectedBooking.ActualCost;
        $scope.DriverCost = $scope.selectedBooking.DriverCost;
        $scope.InvoiceCost = $scope.selectedBooking.InvoiceCost;
        $scope.Discount = $scope.selectedBooking.Discount;

        $scope.selectedBooking.ActualCost = $scope.ActualCost * $scope.selectedBooking.CurrencyRate;
        $scope.selectedBooking.DriverCost = $scope.DriverCost * $scope.selectedBooking.CurrencyRate;
        $scope.selectedBooking.EstimatedCost = $scope.EstimatedCost * $scope.selectedBooking.CurrencyRate;
        $scope.selectedBooking.InvoiceCost = $scope.InvoiceCost * $scope.selectedBooking.CurrencyRate;
        $scope.selectedBooking.Discount = $scope.Discount * $scope.selectedBooking.CurrencyRate;

        if ($scope.selectedBooking.ActualCost) $scope.selectedBooking.ActualCost = $scope.selectedBooking.ActualCost.toFixed(2);
        if ($scope.selectedBooking.DriverCost) $scope.selectedBooking.DriverCost = $scope.selectedBooking.DriverCost.toFixed(2);
        if ($scope.selectedBooking.EstimatedCost) $scope.selectedBooking.EstimatedCost = $scope.selectedBooking.EstimatedCost.toFixed(2);
        if ($scope.selectedBooking.InvoiceCost) $scope.selectedBooking.InvoiceCost = $scope.selectedBooking.InvoiceCost.toFixed(2);
        if ($scope.selectedBooking.Discount) $scope.selectedBooking.Discount = $scope.selectedBooking.Discount.toFixed(2);

        $scope.getQuote = getQuote;
        //$scope.addStop = addStop;
        var currencyObj = Localisation.currency();

        $scope.exportReceipt = exportReceipt;

        function exportReceipt() {
            var token = Auth.getSession().access_token;
            var receiptUrl = window.encodeURIComponent($config.API_ENDPOINT + "Exports/BookingReceipt/template.html#/?token=" + token + "&bookingid=" + $scope.selectedBooking.Id);
            $window.open("http://h2p.utilities.e9ine.com/?url=" + receiptUrl + "&filename=" + $scope.selectedBooking.Id, '_blank');
        }

        $scope.paxFilter = function (pax) {
            if ($scope.selectedBooking.ClientId) {
                return pax.ClientId == $scope.selectedBooking.ClientId;
            } else {
                return true;
            }
        }

        $scope.map = {
            center: {
                latitude: $scope.COMPANY.BaseLatitude || 51.471507,
                longitude: $scope.COMPANY.BaseLongitude || -0.487904
            },
            disableDefaultUI: true,
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
            }],
            zoom: $scope.COMPANY.BaseZoom || 7,
            traffic: {
                show: false,
                options: {

                }
            }
        };

        $scope.directions = {
            renderer: null,
            current: null,
            currentRoute: null,
            currentStep: null,
            setRoute: function (route) {
                if (route != this.currentRoute) {
                    this.currentRoute = route;
                    this.currentStep = null;
                    this.renderer.setRouteIndex(this.current.routes.indexOf(route));
                }
            },
            viewStep: function (step) {
                this.currentStep = step;
                $scope.map.center.latitude = step.start_point.lat();
                $scope.map.center.longitude = step.start_point.lng();
            },
            setDirections: function (directions) {
                this.current = directions;
                this.currentStep = null;
                this.currentRoute = directions ? directions.routes[0] : null;
                this.options.directions = directions;
                if (directions) {
                    $scope.selectedBooking.EncodedRoute = this.currentRoute.overview_polyline;
                    if (!this.renderer) {
                        this.options.map = $scope.map.getGMap();
                        this.renderer = new google.maps.DirectionsRenderer(this.options);
                    } else {
                        this.renderer.setDirections(directions);
                        this.renderer.setMap($scope.map.getGMap());
                    }
                } else {
                    this.current = null;
                    this.options.directions = null;
                    if (this.renderer) {
                        this.renderer.setMap(null);
                    }
                }
            },
            options: {
                suppressInfoWindows: true,
                suppressMarkers: false,
                directions: null,
                panel: document.getElementById('google-directions')
            }
        }

        $scope.$watchGroup(['selectedBooking.BookingStops.length', 'selectedBooking.ClientId', 'selectedBooking.VehicleTypeId', 'selectedBooking.ChaffuerMode', 'selectedBooking.EstimatedMins'], function () {
            if ($scope.setupComplete == false) {
                $scope.setupComplete = true;
                return;
            }
            if (currentQuote) {
                $timeout.cancel(currentQuote)
                currentQuote = null;
            }

            currentQuote = $timeout(getQuote, 500);
        });

        $scope.$watch('selectedBooking.BookingStops', function () {
            if ($scope.viewMode !== 'EDIT') return;
            if ($scope.selectedBooking.AsDirected) {

            } else if ($scope.selectedBooking.BookingStops.length < 2) {
                $scope.selectedBooking.EstimatedCost = 0;
                $scope.selectedBooking.validStops = false;
                return;
            }
            var canQuote = true;
            angular.forEach($scope.selectedBooking.BookingStops, function (bs) {
                if (!bs.Latitude || !bs.Longitude) {
                    canQuote = false;
                }
            });
            if (canQuote) {
                getRouteBetween($scope.selectedBooking.BookingStops.map(function (p) {
                    return new google.maps.LatLng(p.Latitude, p.Longitude);
                }));

                $scope.selectedBooking.validStops = true;

            } else {
                $scope.directions.setDirections(null);
                $scope.selectedBooking.EstimatedCost = 0;
                $scope.selectedBooking.validStops = false;
            }
        }, true);

        getRouteBetween($scope.selectedBooking.BookingStops.map(function (p) {
            return new google.maps.LatLng(p.Latitude, p.Longitude);
        }));

        function getRouteBetween(points) {
            Google.Maps.Directions.route(points).then(function (result) {
                $scope.directions.setDirections(result);
            });
        }

        function startEdits() {
            $scope.viewMode = 'EDIT';
        }

        function cancel() {
            var backup = {
                ActualCost: $scope.selectedBooking.ActualCost,
                EstimatedCost: $scope.selectedBooking.EstimatedCost,
                DriverCost: $scope.selectedBooking.DriverCost,
                InvoiceCost: $scope.selectedBooking.InvoiceCost,
                DiscountCost: $scope.selectedBooking.DiscountCost,
            };
            $scope.selectedBooking.$rollback(true);

            $scope.selectedBooking.ActualCost = backup.ActualCost;
            $scope.selectedBooking.EstimatedCost = backup.EstimatedCost;
            $scope.selectedBooking.DriverCost = backup.DriverCost;
            $scope.selectedBooking.InvoiceCost = backup.InvoiceCost;
            $scope.selectedBooking.DiscountCost = backup.DiscountCost;

            if (!$scope.selectedBooking.Client)
                currencyObj.setCurrent($scope.COMPANY.DefaultCurrencyId);
            else
                currencyObj.setCurrent($scope.selectedBooking.Client.DefaultCurrencyId);
            $scope.viewMode = 'VIEW';
        }

        function getPassengerName(paxId) {
            var pax = $scope.selectedBooking.Passengers.filter(function (p) { return p.Id == paxId; })[0];
            if (pax) {
                return pax.Firstname + " " + pax.Surname;
            }
        }

        function cancelBooking() {
            $http({
                    url: $config.API_ENDPOINT + 'api/bookings',
                    params: {
                        Id: $scope.selectedBooking.Id
                    },
                    method: 'PATCH',
                    data: {
                        Id: $scope.selectedBooking.Id,
                        BookingStatus: 'Cancelled'
                    }
                }).success(function () {
                    $scope.selectedBooking.BookingStatus = 'Cancelled';
                    swal("Booking Cancelled", "This Booking has been cancelled", "success");
                })
                .error(function () {
                    swal("Error", "Something didn't work, please check input and try again", "error");
                });
        }

        function save() {
            var old = $scope.selectedBooking.BookedDateTime;
            var oldTime = $scope.selectedBooking.Time;
            var time = new moment($scope.selectedBooking.Time).add(moment.tz.zone(Localisation.timeZone().getTimeZone()).offset(new Date()), 'minutes')
            var bdt = new moment($scope.selectedBooking.BookedDateTime).format("YYYY-MM-DD") + "T" + time.format("HH:mm") + moment.tz(Localisation.timeZone().getTimeZone()).format('Z');

            $scope.selectedBooking.BookedDateTime = bdt;
            $scope.selectedBooking.LeadPassenger = null;

            if ($scope.discount.type != "amount") {
                $scope.discount.type = 'amount';
                var discount = ($scope.selectedBooking.ActualCost * $scope.selectedBooking.Discount) / 100;
                $scope.selectedBooking.Discount = Math.round(discount * 100) / 100;
            }

            $scope.EstimatedCost = $scope.selectedBooking.EstimatedCost;
            $scope.ActualCost = $scope.selectedBooking.ActualCost;
            $scope.DriverCost = $scope.selectedBooking.DriverCost;
            $scope.InvoiceCost = $scope.selectedBooking.InvoiceCost;
            $scope.DiscountCost = $scope.selectedBooking.Discount;


            $scope.selectedBooking.ActualCost = $scope.selectedBooking.ActualCost / $scope.selectedBooking.CurrencyRate;
            $scope.selectedBooking.DriverCost = $scope.selectedBooking.DriverCost / $scope.selectedBooking.CurrencyRate;
            $scope.selectedBooking.EstimatedCost = $scope.selectedBooking.EstimatedCost / $scope.selectedBooking.CurrencyRate;
            $scope.selectedBooking.InvoiceCost = $scope.selectedBooking.InvoiceCost / $scope.selectedBooking.CurrencyRate;
            $scope.selectedBooking.Discount = $scope.selectedBooking.Discount / $scope.selectedBooking.CurrencyRate;

            delete $scope.selectedBooking.Time;

            var b = angular.copy($scope.selectedBooking);
            delete b['Currency'];
            delete b['Client'];
            delete b['Time'];
            delete b['Vehicle'];
            delete b['LeadPassenger'];

            $http.put($config.API_ENDPOINT + 'api/bookings', b, {
                    params: {
                        Id: b.Id
                    }
                })
                .success(function () {
                    $scope.selectedBooking.BookedDateTime = new moment($scope.selectedBooking.BookedDateTime).format();
                    swal("Booking Updated", "This Booking has been updated", "success");
                    $scope.viewMode = 'VIEW';
                    $scope.selectedBooking.ActualCost = $scope.ActualCost;
                    $scope.selectedBooking.DriverCost = $scope.DriverCost;
                    $scope.selectedBooking.EstimatedCost = $scope.EstimatedCost;
                    $scope.selectedBooking.InvoiceCost = $scope.InvoiceCost;
                    $scope.selectedBooking.Discount = $scope.DiscountCost;
                    $scope.selectedBooking.Time = oldTime;
                })
                .error(function () {
                    $scope.selectedBooking.BookedDateTime = new moment($scope.selectedBooking.BookedDateTime).format();
                    swal("Error", "Something didn't work, please check input and try again", "error");
                    $scope.selectedBooking.ActualCost = $scope.ActualCost;
                    $scope.selectedBooking.DriverCost = $scope.DriverCost;
                    $scope.selectedBooking.EstimatedCost = $scope.EstimatedCost;
                    $scope.selectedBooking.InvoiceCost = $scope.InvoiceCost;
                    $scope.selectedBooking.Discount = $scope.DiscountCost;
                    $scope.selectedBooking.Time = oldTime;
                });
        }

        function getQuote() {
            $http.post($config.API_ENDPOINT + 'api/quote', $scope.selectedBooking)
                .success(function (result) {
                    //if ($scope.selectedBooking.EstimatedCost == $scope.selectedBooking.ActualCost) {
                    //    $scope.selectedBooking.ActualCost = $filter('Convert')(result.FinalCost);
                    //    $scope.ActualCost = result.FinalCost;
                    //}

                    $scope.EstimatedCost = result.FinalCost;
                    $scope.selectedBooking.EstimatedCost = ($scope.EstimatedCost * $scope.selectedBooking.CurrencyRate).toFixed(2);
                    $scope.selectedBooking.EstimatedMins = result.EstimatedMins;
                }).error(function (error) {
                    console.log(error);
                });

        }

        $scope.emailTo = function (type, booking) {
            var modalIns = $modal.open({
                templateUrl: '/webapp/common/modals/email-to.modal.html',
                controller: ['$scope', 'emailAddress', '$modalInstance', function ($scope, emailAddress, $modalInstance) {
                    if (emailAddress != null)
                        $scope.email = emailAddress;

                    $scope.sendEmail = function () {
                        $modalInstance.close($scope.email);
                    }
                }],
                resolve: {
                    emailAddress: function () {
                        var email = null;
                        switch (type) {
                        case "DRIVER":
                            email = booking.Driver ? booking.Driver.Email : null;
                            break;
                        case "PAX":
                            email = booking.LeadPassenger ? booking.LeadPassenger.Email : null;
                            break;
                        case "CLIENT":
                            email = booking.Client ? booking.Client.Email : null;
                            break;
                        default:
                            break;
                        }
                        return email;
                    }
                }
            });

            modalIns.result.then(function (res) {
                if (res != null) {
                    swal('Success', 'User will receive the email soon..', 'success');
                    if (type == "DRIVER") {
                        $http.post($config.API_ENDPOINT + 'api/email', {
                            Type: "DriverConfirmation",
                            BookingId: booking.Id,
                            DriverId: booking.DriverId,
                            EmailId: res
                        }).success(function () {
                            Notification.success('Email Sent');
                        })
                    } else if (type == "PAX") {
                        $http.post($config.API_ENDPOINT + 'api/email', {
                            Type: "PassengerConfirmation",
                            BookingId: booking.Id,
                            PassengerId: booking.LeadPassengerId,
                            EmailId: res
                        }).success(function () {
                            Notification.success('Email Sent');
                        })
                    } else if (type == "CLIENT") {
                        $http.post($config.API_ENDPOINT + 'api/email', {
                            Type: "ClientConfirmation",
                            BookingId: booking.Id,
                            ClientId: booking.ClientId,
                            EmailId: res
                        }).success(function () {
                            Notification.success('Email Sent');
                        })
                    }
                }
            });
        }
    }
}(angular));