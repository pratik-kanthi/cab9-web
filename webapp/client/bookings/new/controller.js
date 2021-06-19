(function(angular) {
    var module = angular.module('cab9.client.bookings');

    module.controller('ClientBookingCreateController', clientBookingCreateController);

    clientBookingCreateController.$inject = ['$scope', '$UI', '$modal', '$config', '$q', 'Model', '$stateParams', '$rootScope', '$q', 'Localisation', '$utilities', '$http', '$timeout', '$filter', 'Auth', 'rTags'];

    function clientBookingCreateController($scope, $UI, $modal, $config, $q, Model, $stateParams, $rootScope, $q, Localisation, $utilities, $http, $timeout, $filter, Auth, rTags) {
        $scope.isAdmin = $rootScope.PERMISSIONS.role.Name.toLowerCase() == 'super admin';
        $scope.bookingTags = $scope.unlinkedTags = rTags;
        setupBooking();
        setupData();
        $scope.paxMode = {
            value: false
        };

        $scope.newBooker = null;
        $scope.flightData = {
            Number: ""
        };

        $scope.addCard = addCard;
        $scope.showPaymentCards = false;

        $scope.sortableOptions = {
            stop: function(e, ui) {},
            ondragstart: function(e, ui) {},
            disabled: true
        };

        var _windowHeight = $(window).height();
        $("#new-booking").css("height", _windowHeight - 90);

        $scope.selectedPassenger = null;
        $scope.flightInfoAvailable = false;
        $scope.save = save;
        $scope.flipAddress = flipAddress;
        $scope.repeatBooking = repeatBooking;
        $scope.cancel = cancel;
        $scope.addTime = addTime;
        $scope.validateClientRef = validateClientRef;
        $scope.searchPassengers = searchPassengers;
        $scope.searchBookers = searchBookers;
        $scope.testMaskReferences = testMaskReferences;
        $scope.fetchedPassengers = [];
        $scope.fetchedClients = [];
        $scope.filteredBookers = [];
        $scope.vehicleTypes = [];
        $scope.enableChauffering = enableChauffering;
        $scope.disableChauffering = disableChauffering;
        $scope.validateBooking = validateBooking;

        $scope.suggestReferences = suggestReferences;
        $scope.refSelected = refSelected;

        $scope.addStop = addStop;
        $scope.removeStop = removeStop;
        $scope.reverseStops = reverseStops;
        $scope.fetchFlightInformation = fetchFlightInformation;
        $scope.externalLocations = {
            knownLocations: [],
            historic: []
        };
        var bookingMakers = [];
        var watchPassenger = null;
        var directionsPolyline = null;

        function enableChauffering() {
            $scope._dbooking.ChauffeurMode = true;
            $scope._dbooking.EstimatedMins = "60";
        }

        function disableChauffering() {
            $scope._dbooking.ChauffeurMode = false;
            $scope._dbooking.EstimatedMins = null;
        }

        $scope.formatErrorName = function(text) {
            return text.replace('Input', '').replace('Id', '');
        }

        function addCard() {

            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/add-payment-card/partial.html',
                controller: 'AddPaymentCardController',
                windowClass: 'add-payment-card-modal-wrapper',
                resolve: {
                    rPassengerId: function() {
                        return $scope._dbooking.LeadPassengerId;
                    },
                    rClientId: function() {
                        return null
                    },
                    rDriverId: function() {
                        return null
                    }
                }
            });

            modalInstance.result.then(function(data) {

                $scope.card = {
                    Id: data.Id,
                    Name: data.CardNumber,
                    Description: data.Type.toUpperCase() + " - " + "Expiring " + data.ExpirationMonth + "/" + data.ExpirationYear
                }
                $scope.filteredPaymentCards.push($scope.card);
                $scope._dbooking.PaymentCardId = data.Id;
            });
        }

        function flipAddress() {
            var firstStop = $scope._dbooking.BookingStops[0];
            $scope._dbooking.BookingStops[0] = $scope._dbooking.BookingStops[1];
            $scope._dbooking.BookingStops[1] = firstStop;
        }

        function _validateMask(mask) {
            var lower = '[a-z]';
            var upper = '[A-Z]';
            var numeric = '[0-9]';
            var regString = '^';
            var currentCase = 0;
            var mandatoryChar = false;
            var quoted = false;
            for (var i = 0; i < mask.length; i++) {
                var c = mask[i];
                if (c === "'") {
                    if (quoted) {
                        regString += ')';
                    } else {
                        regString += '(';
                    }
                    quoted = !quoted;
                } else if (quoted) {
                    if (['.'].indexOf(c) != -1) {
                        c = '\\' + c;
                    }
                    regString += c;
                } else if (c === '>') {
                    currentCase++;
                    if (currentCase > 1) {
                        throw 'Bad Mask - Case blocks have consecutive > without ending previous block';
                    }
                } else if (c === '<') {
                    currentCase--;
                    if (currentCase < -1) {
                        throw 'Bad Mask - Case blocks have consecutive < without ending previous block';
                    }
                } else if (c === '0') {
                    mandatoryChar = true;
                    regString += '(' + numeric + ')';
                } else if (c === '9') {
                    regString += '(' + numeric + '?)';
                } else if (currentCase === 1) {
                    if (c === 'A') {
                        mandatoryChar = true;
                        regString += '(' + upper + '|' + numeric + ')';
                    } else if (c === 'a') {
                        regString += '(' + upper + '?|' + numeric + '?)';
                    } else if (c === 'L') {
                        mandatoryChar = true;
                        regString += '(' + upper + ')';
                    } else if (c === 'l') {
                        regString += '(' + upper + '?)';
                    }
                } else if (currentCase === 0) {
                    if (c === 'A') {
                        mandatoryChar = true;
                        regString += '(' + lower + '|' + upper + '|' + numeric + ')';
                    } else if (c === 'a') {
                        regString += '(' + lower + '?|' + upper + '?|' + numeric + '?)';
                    } else if (c === 'L') {
                        mandatoryChar = true;
                        regString += '(' + lower + '|' + upper + ')';
                    } else if (c === 'l') {
                        regString += '(' + lower + '?|' + upper + '?)';
                    }
                } else if (currentCase === -1) {
                    if (c === 'A') {
                        mandatoryChar = true;
                        regString += '(' + lower + '|' + numeric + ')';
                    } else if (c === 'a') {
                        regString += '(' + lower + '?|' + numeric + '?)';
                    } else if (c === 'L') {
                        mandatoryChar = true;
                        regString += '(' + lower + ')';
                    } else if (c === 'l') {
                        regString += '(' + lower + '?)';
                    }
                }
            }
            if (quoted) {
                throw 'Bad Mask - Quoted section not terminated';
            }
            if (!mandatoryChar) {
                throw 'Bad Mask - Must contain at least 1 mandatory symbol (A, L, 0)';
            }
            regString += '$';
            return new RegExp(regString);
        }

        function removeStop($index) {
            if ($scope._dbooking.WaitAndReturn && $scope._dbooking.BookingStops.length < 4) {
                swal("Cannot remove via Stop", "WaitAndReturn booking should have a via stop", "warning")
            } else
                $scope._dbooking.BookingStops.splice($index, 1)
            if ($scope._dbooking.BookingStops.length < 3)
                $scope.sortableOptions.disabled = true;
        }

        function searchPassengers(searchText) {
            if (searchText) {
                $scope.fetchedPassengers = $scope.passengers.filter(function(p) {
                    return p.Name.toLowerCase().startsWith(searchText.toLowerCase());
                })
            } else {
                $scope.fetchedPassengers = [];
            }

            $scope.fetchedPassengers.push({
                Id: 'add-passenger',
                Name: 'Add Passenger',
                Description: 'Create New Passenger',
                ImageUrl: '/includes/images/add-icon.png'
            });

        }

        function searchBookers(searchText) {
            if (searchText) {
                $scope.filteredBookers = $scope.bookers.filter(function(b) {
                    return b.Name.toLowerCase().startsWith(searchText.toLowerCase());
                })
            } else {
                $scope.filteredBookers = [];
            }

            $scope.filteredBookers.push({
                Id: 'add-booker',
                Name: 'Add Booker',
                Description: 'Create New Booker',
                ImageUrl: '/includes/images/add-icon.png'
            });
        }

        function addTime(min, period) {
            var tz = Localisation.timeZone().getTimeZone();
            var currentOffset = new Date().getTimezoneOffset();
            var desiredOffset = moment.tz.zone(tz).offset(new Date());
            var dt = new moment.tz(tz).add(currentOffset - desiredOffset, 'minutes');

            if (period == 'day') {
                $scope._dbooking.Date = dt.add(min, 'minutes').toDate();
            } else if (period == 'time') {
                $scope._dbooking.Time = dt.startOf('minute').add(min, 'minutes').toDate();
            }
        }

        $scope.$watchGroup(['_dbooking.Date', '_dbooking.Time'], function(newValues) {
            $scope._dbooking.BookedDateTime = getDate(newValues[0], newValues[1]);

            $scope.canQuote = true;

            if (!$scope.timeSet) {
                $scope._dbooking.FlightInfo = null;
            }
            $scope.timeSet = false;

            angular.forEach($scope._dbooking.BookingStops, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });

            if ($scope.canQuote) {
                getQuote($scope._dbooking);
            } else {
                $scope._dbooking.EstimatedCost = 0;
                $scope._dbooking.ActualCost = 0;
            }
        });

        $scope.addTag = addTag;
        $scope.removeTag = removeTag;

        function addTag(item, $select) {
            var tag = $scope._dbooking.Tags.find(function(res) {
                return res.Id == item.Id;
            })

            if(!tag) {
                $scope._dbooking.Tags.push(item);
                var found = $scope.unlinkedTags.find(function(br) {
                    return br.Id == item.Id
                })
                if (found)
                    $scope.unlinkedTags.splice($scope.unlinkedTags.indexOf(found), 1)
                $scope._dbooking.$selectedTag = null;
                $select.selected = null;
            }
            
        }

        function removeTag(item) {
            $scope.unlinkedTags.push(item);
            var found = $scope._dbooking.Tags.find(function(br) {
                return br.Id == item.Id
            })
            if (found)
                $scope._dbooking.Tags.splice($scope._dbooking.Tags.indexOf(found), 1)
            $scope._dbooking.$selectedTag = null;
        }

        function setupBooking() {
            $scope.flightData = {
                Number: ""
            };
            var _b = $scope._dbooking = new Model.Booking();
            $scope.displayMode = 'CREATE';
            _b.ClientId = $rootScope.CLIENTID;
            if (!$scope.isAdmin) {
                _b.ClientStaffId = Auth.getSession().Claims.ClientStaffId[0];
            }
            _b.BookingStops = [];
            _b.BookingValidations = [];
            _b.BookingStops.push(new Model.BookingStop());
            _b.BookingStops.push(new Model.BookingStop());
            _b.TaxId = $scope.COMPANY.DefaultTaxId;
            _b.AsDirected = false;

            var tz = Localisation.timeZone().getTimeZone() || "Europe/London";
            var currentOffset = new Date().getTimezoneOffset();
            var desiredOffset = moment.tz.zone(tz).offset(new Date());

            var dt = new moment.tz(tz).add(currentOffset - desiredOffset, 'minutes');
            _b.Date = dt.toDate();
            _b.Time = new Date(dt.startOf('minute').add(15, 'minutes').format());

            _b.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
            _b.EstimatedCost = 0;
            _b.Pax = $scope.COMPANY.DefaultPax;
            _b.Bax = $scope.COMPANY.DefaultBax;

            _b.TextConfirmation = $scope.COMPANY.TextConfirmation;
            _b.EmailConfirmation = $scope.COMPANY.EmailConfirmation;
            _b.TextOnArrival = $scope.COMPANY.TextOnArrival;
            _b.CallOnArrival = $scope.COMPANY.CallOnArrival;
            _b.TextAssigned = $scope.COMPANY.TextAssigned;
            _b.EmailAssigned = $scope.COMPANY.EmailAssigned;
            _b.TextOnCompletion = $scope.COMPANY.TextOnCompletion;
        }

        function setupData() {
            var promises = [];
            $scope.dataReady = false;
            var _clientP = Model.Client.query()
                .select('Id,Name,AccountNo,AccountPassword,OnHold,DefaultCurrencyId,ImageUrl,ClientType/Name,ClientReferences,Tags,AllVehicleTypeAccess,Phone,VehicleTypes,KnownLocations,Address1,Address2,Area,TownCity,County,Postcode,Country,Latitude,Longitude,BillingAddress1,BillingAddress2,BillingArea,BillingTownCity,BillingCounty,BillingPostcode,BillingCountry,BillingLatitude,BillingLongitude,DefaultVehicleTypeId,TextConfirmation,EmailConfirmation,TextOnArrival,CallOnArrival,TextAssigned,EmailAssigned,TextOnCompletion,AutoDispatch')
                .include('ClientType,ClientReferences,VehicleTypes,KnownLocations,Tags')
                .where("Id eq guid'" + $rootScope.CLIENTID + "'")
                .execute().then(function(data) {
                    $scope.client = data[0];
                    $scope._dbooking.CurrencyId = $scope.client.DefaultCurrencyId;
                    $scope._dbooking.TextConfirmation = ($scope.client.TextConfirmation != null ? $scope.client.TextConfirmation : $scope.COMPANY.TextConfirmation);
                    $scope._dbooking.EmailConfirmation = ($scope.client.EmailConfirmation != null ? $scope.client.EmailConfirmation : $scope.COMPANY.EmailConfirmation);
                    $scope._dbooking.TextOnArrival = ($scope.client.TextOnArrival != null ? $scope.client.TextOnArrival : $scope.COMPANY.TextOnArrival);
                    $scope._dbooking.CallOnArrival = ($scope.client.CallOnArrival != null ? $scope.client.CallOnArrival : $scope.COMPANY.CallOnArrival);
                    $scope._dbooking.TextAssigned = ($scope.client.TextAssigned != null ? $scope.client.TextAssigned : $scope.COMPANY.TextAssigned);
                    $scope._dbooking.EmailAssigned = ($scope.client.EmailAssigned != null ? $scope.client.EmailAssigned : $scope.COMPANY.EmailAssigned);
                    $scope._dbooking.TextOnCompletion = ($scope.client.TextOnCompletion != null ? $scope.client.TextOnCompletion : $scope.COMPANY.TextOnCompletion);
                    $scope._dbooking.AutoDispatch = $scope.client.AutoDispatch;
                    $scope.clientReferences = angular.copy($scope.client.ClientReferences);
                    $scope.clientReferences = $scope.clientReferences.filter(function(r) { return r.Active; }).map(function(item) {
                        if (item.ReferenceType == "Mask") {
                            item.$testReg = _validateMask(item.Value);
                        }
                        if (item.ReferenceType == "List" && item.ShowList) {
                            $http({
                                method: 'GET',
                                url: $config.API_ENDPOINT + '/api/ClientReferences/list?ClientReferenceId=' + item.Id
                            }).then(function(response) {
                                item.$list = response.data.map(function(i) {
                                    return {
                                        custom: false,
                                        text: i
                                    };
                                });
                                if (item.AllowAddToList) {
                                    item.$list.push({
                                        custom: true,
                                        text: "Add '{{$select.search}}' to References"
                                    });
                                }
                            });
                        }

                        return item;
                    });

                    if($scope.client.Tags) {
                        for (var i = 0; i < $scope.client.Tags.length; i++) {
                            if($scope.client.Tags[i].ClientVisible == true)
                                addTag($scope.client.Tags[i]);
                        }
                    }

                    if ($scope.client.AllVehicleTypeAccess === false) {
                        $scope.filteredVehicleTypes = $scope.client.VehicleTypes.sort(function(a, b) { return (a.Order || 99) - (b.Order || 99) }).map(function(_vt) {
                            _vt.ImageUrl = null;
                            return _vt;
                        });
                        if ($scope.client.DefaultVehicleTypeId) {
                            $scope._dbooking.VehicleTypeId = $scope.client.DefaultVehicleTypeId;
                        } else {
                            $scope._dbooking.VehicleTypeId = $scope.filteredVehicleTypes[0].Id;
                        }
                    } else {
                        var _vehicleTypeP = Model.VehicleType.query()
                            .parseAs(function(item) {
                                this.Id = item.Id;
                                this.Name = item.Name;
                                this.Description = item.Description;
                                this.IsDefault = item.IsDefault;
                                this.Priority = item.Priority;
                                this.Order = item.Order;
                                this.ImageUrl = null;
                            })
                            .execute().then(function(data) {
                                $scope.filteredVehicleTypes = $scope.vehicleTypes = data.sort(function(a, b) { return (a.Order || 99) - (b.Order || 99) });
                            });

                        promises.push(_vehicleTypeP);
                    }

                    [].push.apply($scope.externalLocations.knownLocations, $scope.client.KnownLocations);

                    if ($scope.client.Latitude && $scope.client.Longitude) {
                        var add = '';
                        if ($scope.client.Address1 && $scope.client.Address1.length > 1) {
                            add += $scope.client.Address1;
                        }
                        if ($scope.client.TownCity) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += $scope.client.TownCity;
                        } else if ($scope.client.Area) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += $scope.client.Area;
                        }
                        if ($scope.client.Postcode) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += $scope.client.Postcode;
                        }

                        $scope.externalLocations.knownLocations.push({
                            Address1: $scope.client.Address1,
                            Address2: $scope.client.Address2,
                            Area: $scope.client.Area,
                            TownCity: $scope.client.TownCity,
                            County: $scope.client.County,
                            Postcode: $scope.client.Postcode,
                            Country: $scope.client.Country,
                            Latitude: $scope.client.Latitude,
                            Longitude: $scope.client.Longitude,
                            Name: 'Office Address',
                            StopSummary: add,
                            LocationType: 'OFFICE'
                        });
                    }

                    if ($scope.client.BillingLatitude && $scope.client.BillingLongitude && ($scope.client.BillingLatitude != $scope.client.Latitude && $scope.client.Longitude != $scope.client.BillingLongitude)) {
                        var add = '';
                        if ($scope.client.BillingAddress1 && $scope.client.BillingAddress1.length > 1) {
                            add += $scope.client.BillingAddress1;
                        }
                        if ($scope.client.BillingTownCity) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += $scope.client.BillingTownCity;
                        } else if ($scope.client.BillingArea) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += $scope.client.BillingArea;
                        }
                        if ($scope.client.BillingPostcode) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += $scope.client.BillingPostcode;
                        }

                        $scope.externalLocations.knownLocations.push({
                            Address1: $scope.client.BillingAddress1,
                            Address2: $scope.client.BillingAddress2,
                            Area: $scope.client.BillingArea,
                            TownCity: $scope.client.BillingTownCity,
                            County: $scope.client.BillingCounty,
                            Postcode: $scope.client.BillingPostcode,
                            Country: $scope.client.BillingCountry,
                            Latitude: $scope.client.BillingLatitude,
                            Longitude: $scope.client.BillingLongitude,
                            Name: 'Billing Address',
                            StopSummary: add,
                            LocationType: 'OFFICE'
                        });
                    }


                    $timeout(function() {
                        var _tempHeight = $("#passenger-info").height() - 37;
                        $(".form-control.client-notes").css("height", _tempHeight + "px");
                    }, 100);

                    if ($scope.client.OnHold) {
                        swal({
                            title: "Account On Hold",
                            text: "This account is currently on hold, new bookings have been disabled.",
                            type: "error",
                            animation: "slide-from-top"
                        });
                    }

                    if ($scope.client.AccountPassword) {
                        swal({
                            title: "Account Password",
                            text: "This account is password enabled.",
                            type: "input",
                            showCancelButton: false,
                            closeOnConfirm: false,
                            allowEscapeKey: false,
                            allowOutsideClick: false,
                            animation: "slide-from-top",
                            inputPlaceholder: "Account Password"
                        }, function(inputValue) {
                            if (inputValue === false) {;
                                $scope._dbooking.ClientId = null;
                                $scope.$apply();
                                return false;
                            }
                            if (inputValue === "") {;
                                swal.showInputError("You need to write something!");
                                return false;
                            }
                            if (inputValue == $scope.client.AccountPassword) {
                                swal("Accepted", "The password is valid. Please continue with the booking.", "success")
                            } else {
                                swal.showInputError("Incorrect Password");
                                return false;
                            }
                        });
                    }

                });

            var _clientNotesP = Model.Note.query()
                .where("OwnerType eq 'Client'")
                .where("OwnerId eq guid'" + $rootScope.CLIENTID + "'")
                .execute()
                .then(function(data) {
                    var _cn = "";
                    for (i = 0; i < data.length; i++) {
                        _cn += data[i].Content + "\r\n\r\n";
                    }
                    $scope.clientNotes = _cn;
                })

            if ($scope.isAdmin) {
                var _passengerP = Model.Passenger.query().where("ClientId eq guid'" + $rootScope.CLIENTID + "'").select('Id,Firstname,Surname,ImageUrl,Mobile,Phone,ClientId,Client/Name,Addresses').include('Client, Addresses').parseAs(function(item) {
                    this.Id = item.Id;
                    this.ClientId = item.ClientId;
                    this.Name = item.Firstname + ' ' + item.Surname;
                    this.Description = (item.Client && item.Client.Name) ? item.Client.Name : 'No Client';
                    this.Mobile = item.Mobile;
                    this.Phone = item.Phone;
                    this.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Firstname);
                    this.Addresses = item.Addresses;
                }).execute().then(function(data) {
                    $scope.passengers = data;
                });
                var _bookerP = Model.ClientStaff.query().where("ClientId eq guid'" + $rootScope.CLIENTID + "'").select('Id,Firstname,Surname,ImageUrl,Mobile,AllPassengers,Passengers,ClientId,Client/Name').include('Client,Passengers').parseAs(function(item) {
                    this.Id = item.Id;
                    this.ClientId = item.ClientId;
                    this.Name = item.Firstname + ' ' + item.Surname;
                    this.AllPassengers = item.AllPassengers;
                    this.Passengers = item.Passengers;
                    this.Description = (item.Client && item.Client.Name) ? item.Client.Name : 'No Client';
                    this.Mobile = item.Mobile;
                    this.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Firstname);
                }).execute().then(function(data) {

                    $scope.bookers = data;
                });
                promises.push(_passengerP);
                promises.push(_bookerP);
            } else {
                var _bookerPassengersP = Model.ClientStaff.query()
                    .filter("Id eq guid'" + Auth.getSession().Claims.ClientStaffId[0] + "'")
                    .select('Id,Firstname,Surname,ImageUrl,Mobile,AllPassengers,Passengers,ClientId,Client/Name, Passengers/Client/Name')
                    .include('Client, Passengers/Addresses, Passengers/Client')
                    .execute().then(function(response) {
                        $scope.selectedBooker = response[0];
                        if (response[0].AllPassengers) {
                            _passengerP = Model.Passenger
                                .query()
                                .filter("ClientId eq guid'" + Auth.getSession().Claims.ClientId[0] + "'")
                                .select('Id,Firstname,Surname,ImageUrl,Mobile,Phone,ClientId,Client/Name, Addresses')
                                .include('Client, Addresses')
                                .parseAs(function(item) {
                                    this.Id = item.Id;
                                    this.ClientId = item.ClientId;
                                    this.Name = item.Firstname + ' ' + item.Surname;
                                    this.Description = (item.Client && item.Client.Name) ? item.Client.Name : 'No Client';
                                    this.Mobile = item.Mobile;
                                    this.Phone = item.Phone;
                                    this.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Firstname);
                                    this.Addresses = item.Addresses;
                                })
                                .execute()
                                .then(function(response) {
                                    $scope.passengers = response;
                                });
                            promises.push(_passengerP);
                        } else {
                            $scope.passengers = response[0].Passengers.map(function(item) {
                                var a = {};
                                a.Id = item.Id;
                                a.ClientId = item.ClientId;
                                a.Name = item.Firstname + ' ' + item.Surname;
                                a.Description = (item.Client && item.Client.Name) ? item.Client.Name : 'No Client';
                                a.Mobile = item.Mobile;
                                a.Phone = item.Phone;
                                a.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Firstname);
                                a.Addresses = item.Addresses;
                                return a;
                            });
                        }
                    });
                promises.push(_bookerPassengersP);
            }

            var _bookingRequirementP = Model.BookingRequirement.query()
                .execute().then(function(data) {
                    $scope.bookingRequirements = $scope.unlinkedRequirements = data;
                });

            promises.push(_clientNotesP);
            promises.push(_bookingRequirementP);
            $q.all(promises).then(function() {
                $scope.dataReady = true;
            });
        }

        function suggestReferences(item, value) {
            if (value) {
                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + '/api/ClientReferences/suggest?ClientReferenceId=' + item.Id + '&Value=' + value
                }).then(function successCallback(response) {
                    item.$suggested = response.data.map(function(i) {
                        return {
                            custom: false,
                            text: i
                        };
                    });
                    if (item.AllowAddToList) {
                        item.$suggested.push({
                            custom: true,
                            text: "Add '{{$select.search}}' to References"
                        });
                    }
                }, function errorCallback(response) {
                    item.$suggested = [];
                });
            } else {
                item.$suggested = [];
            }
        }

        function refSelected(item, search, reference) {
            if (item.custom) {
                item.text = search;
                swal({
                    title: "Add New Reference?",
                    text: "Are you sure you want to add '" + search + "' to the list of known '" + reference.ReferenceName + "' references?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, Add it!",
                    cancelButtonText: "Cancel",
                    closeOnConfirm: false,
                    closeOnCancel: false
                }, function(isConfirm) {
                    if (isConfirm) {
                        $http.post($config.API_ENDPOINT + "/api/clientreferences/add?ClientReferenceId=" + reference.Id + "&ClientReferenceKnownValue=" + search).then(function(response) {
                            swal({
                                title: "Client Reference Updated.",
                                text: "Changes have been updated.",
                                type: "success",
                                confirmButtonColor: $UI.COLOURS.brandSecondary
                            });
                        }, function(err) {
                            swal({
                                title: "Some Error Occured.",
                                text: "Some error has occured.",
                                type: "error",
                                confirmButtonColor: $UI.COLOURS.brandSecondary
                            });
                            reference.$knownValue = null;
                        });
                    } else {
                        reference.$knownValue = null;
                        swal.close();
                        $scope.$apply();
                    }
                });
            }
        }

        $scope.addRequirement = addRequirement;
        $scope.removeRequirement = removeRequirement;

        function addRequirement(item) {
            $scope._dbooking.BookingRequirements.push(item);
            var found = $scope.unlinkedRequirements.filter(function(br) {
                return br.Id == item.Id
            })
            if (found[0])
                $scope.unlinkedRequirements.splice($scope.unlinkedRequirements.indexOf(found[0]), 1)
            $scope._dbooking.$selectedRequirement = null;
        }

        function removeRequirement(item) {
            $scope.unlinkedRequirements.push(item);
            var found = $scope._dbooking.BookingRequirements.filter(function(br) {
                return br.Id == item.Id
            })
            if (found[0])
                $scope._dbooking.BookingRequirements.splice($scope._dbooking.BookingRequirements.indexOf(found[0]), 1)
        }



        $scope.$watch("_dbooking.ClientStaffId", function(newvalue) {
            if (newvalue === 'add-booker') {
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/common/modals/booker/modal.html',
                    controller: 'BookerCreateController',
                    resolve: {
                        rBooker: function() {
                            var _booker = new Model.ClientStaff();
                            _booker.Phone = $scope.client.Phone;
                            _booker.ClientId = $scope._dbooking.ClientId;
                            return _booker;
                        }
                    }
                })
                modalInstance.result.then(function(data) {
                        var d = {
                            Id: data.Id,
                            ClientId: data.ClientId,
                            Name: data.Firstname + ' ' + data.Surname,
                            Description: data.Email ? data.Email : "",
                            Mobile: data.Mobile,
                            ImageUrl: $utilities.formatUrl(data.ImageUrl, data.Name)
                        };
                        $scope.newBooker = data;
                        $scope.filteredBookers.push(d);
                        $scope._dbooking.ClientStaffId = data.Id;

                    },
                    function() {
                        $scope._dbooking.ClientStaffId = null;
                    });
            }
            if (newvalue) {
                $scope.selectedBooker = $scope.filteredBookers.filter(function(item) {
                    return item.Id == newvalue;
                })[0];

            } else {
                $scope.selectedBooker = null;
            }

        });


        $scope.$watch("_dbooking.PaymentMethod", function(newvalue) {
            if (newvalue == 'Card') {
                $scope._dbooking.TaxId = ($scope.COMPANY.DefaultCardTaxId || $scope.COMPANY.DefaultTaxId);
            }
            if (newvalue == 'Cash') {
                $scope._dbooking.TaxId = ($scope.COMPANY.DefaultCashTaxId || $scope.COMPANY.DefaultTaxId);
            } else {
                $scope._dbooking.TaxId = $scope.COMPANY.DefaultTaxId;
            }

            $scope.canQuote = true;
            if (newvalue == "Card" && $scope._dbooking.LeadPassengerId != undefined && $config.CARD_PAYMENTS_ENABLED) {

                $scope.filteredPaymentCards = [];
                $http.get($config.API_ENDPOINT + "api/payments/getcardsforpassenger", {
                    params: {
                        passengerId: $scope._dbooking.LeadPassengerId,
                    }
                }).success(function(data) {
                    $scope.showPaymentCards = true;
                    angular.forEach(data, function(item) {
                        $scope.filteredPaymentCards.push({
                            Id: item.Id,
                            Name: item.CardNumber,
                            Description: item.Type.toUpperCase() + " - " + "Expiring " + item.ExpirationMonth + "/" + item.ExpirationYear
                        })
                    });
                });

            } else {
                $scope.showPaymentCards = false;
                $scope._dbooking.PaymentCard = null;
                $scope._dbooking.PaymentCardId = null;
            }

            angular.forEach($scope._dbooking.BookingStops, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });

            if ($scope.canQuote) {
                getQuote($scope._dbooking);
            } else {
                if (directionsPolyline) {
                    directionsPolyline.setMap(null);
                    directionsPolyline = null;
                }
                $scope.quote = null;
                $scope.directions = null;
                $scope._dbooking.EstimatedCost = 0;
                $scope._dbooking.ActualCost = 0;
            }
        });

        $scope.$watch("_dbooking.LeadPassengerId", function(newvalue) {
            if (newvalue === 'add-passenger') {
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/common/modals/passenger/create.modal.html',
                    controller: 'PassengerItemCreateModalController',
                    resolve: {
                        rClientId: function() {
                            return $scope._dbooking.ClientId;
                        },
                        rNavigateAfterSave: function() {
                            return false;
                        }
                    }
                });
                modalInstance.result.then(function(data) {
                        var d = {
                            Id: data.Id,
                            ClientId: data.ClientId,
                            Name: data.Firstname + ' ' + data.Surname,
                            Description: data.Email ? data.Email : "",
                            Mobile: data.Mobile,
                            Phone: data.Phone,
                            ImageUrl: $utilities.formatUrl(data.ImageUrl, data.Name)
                        };
                        $scope.newPassenger = data;
                        $scope.fetchedPassengers.push(d);
                        $scope._dbooking.ClientId = data.ClientId;
                        $scope._dbooking.LeadPassengerId = data.Id;
                    },
                    function() {

                    });
                return;
            }
            var b = $scope._dbooking;
            if (newvalue) {
                var found = $scope.fetchedPassengers.filter(function(item) {
                    return item.Id == newvalue;
                })[0];
                $scope.selectedPassenger = found;
                debugger;
                b.PassengerNotificationPhone = found.Mobile ? found.Mobile : found.Phone;

                angular.forEach(found.Addresses, function(a) {
                    if (a.Latitude && a.Longitude) {
                        var add = '';
                        if (a.Address1 && a.Address1.length > 1) {
                            add += a.Address1;
                        }
                        if (a.TownCity) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += a.TownCity;
                        } else if (a.Area) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += a.Area;
                        }
                        if (a.Postcode) {
                            if (add.length > 0) {
                                add += ', ';
                            }
                            add += a.Postcode;
                        }
                        $scope.externalLocations.knownLocations.push({
                            Address1: a.Address1,
                            Address2: a.Address2,
                            Area: a.Area,
                            TownCity: a.TownCity,
                            County: a.County,
                            Postcode: a.Postcode,
                            Country: a.Country,
                            Latitude: a.Latitude,
                            Longitude: a.Longitude,
                            Name: a.Name,
                            StopSummary: (a.StopSummary || add),
                            LocationType: 'Passenger Address'
                        });
                    }
                });

                Model.Booking.query().where("LeadPassengerId", 'eq', "guid'" + newvalue + "'").include('BookingStops').orderBy('BookedDateTime desc').top(5).execute().then(function(d) {
                    $scope.paxHistory = d;
                    $scope.currentTab = 'HISTORY';
                });

                $scope.externalLocations.historic.length = 0;
                Model.BookingStop.query().where("Booking/LeadPassengerId", 'eq', "guid'" + newvalue + "'").execute().then(function(d) {
                    var seen = {};
                    uniqueResults = d.filter(function(d) {
                        if (seen[d.Address1]) {
                            return false;
                        } else {
                            seen[d.Address1] = true;
                            return true;
                        }
                    });
                    [].push.apply($scope.externalLocations.historic, uniqueResults);
                });

                if(!found.Tags) {
                    setupTags();
                } 
                
                function setupTags() {
                    Model.Passenger.query().filter("Id", 'eq', "guid'" + newvalue + "'").include('Tags').select("Tags").execute().then(function(d) {
                        found.Tags = d[0].Tags;
                        $scope.passengerTags = found.Tags;
                        for (var i = 0; i < found.Tags.length; i++) {
                            if(found.Tags[i].ClientVisible == true)
                                addTag(found.Tags[i]);
                        }
                    });
                }

                if ($scope._dbooking.PaymentMethod == "Card" && $config.CARD_PAYMENTS_ENABLED) {
                    $scope.filteredPaymentCards = [];
                    $http.get($config.API_ENDPOINT + "api/payments/getcardsforpassenger", {
                        params: {
                            passengerId: $scope._dbooking.LeadPassengerId,
                        }
                    }).success(function(data) {
                        $scope.showPaymentCards = true;
                        angular.forEach(data, function(item) {
                            $scope.filteredPaymentCards.push({
                                Id: item.Id,
                                Name: item.CardNumber,
                                Description: item.Type.toUpperCase() + " - " + "Expiring " + item.ExpirationMonth + "/" + item.ExpirationYear
                            })
                        });
                    });
                }
            } else {
                if (watchPassenger) {} else {
                    watchPassenger = true;
                    $scope.filteredPassengers = $scope.passengers;
                }
                $scope.selectedPassenger = null;
                b.PassengerNotificationPhone = null;
                if($scope.passengerTags) {
                    for (var i = 0; i < $scope.passengerTags.length; i++) {
                        removeTag($scope.passengerTags[i]);
                    }
                }
            }
        });

        function testMaskReferences() {
            if ($scope.clientReferences.length > 0) {
                for (var i = 0; i < $scope.clientReferences.length; i++) {
                    var c = $scope.clientReferences[i];
                    if (c.ReferenceType == 'Mask') {
                        if (c.$testReg.test(c.$knownValue) || (!c.$knownValue && !c.Mandatory)) {
                            return false
                        } else {
                            return true
                        }
                    }
                }
            }
            return false;
        }

        function reverseStops() {
            $scope._dbooking.BookingStops.reverse();
        }

        function validateBooking(repeat)
        {
            // check if the selected booking time is for the past or not
            if(moment($scope._dbooking.BookedDateTime).isBefore(moment.utc(), 'minute'))
            {
                swal({
                    title: "Booking in the Past",
                    text: "The booking date & time are in the past.",
                    type: 'error',
                    closeOnConfirm: true
                });
            } else {
                save(repeat);
            }
        }


        function save(repeat) {
            $("#bookingsave").prop("disabled", true);
            $("#bookingrepeat").prop("disabled", true);

            if (!repeat) {
                $("#bookingsave").html("<i class='fa fa-circle-o-notch fa-spin'></i> Saving...");
            } else {
                $("#bookingrepeat").html("<i class='fa fa-circle-o-notch fa-spin'></i> Saving...");
            }

            $scope.dataReady = false;
            var promises = [];
            $scope.dataReady = true;
            if ($scope.newBooker && $scope.newBooker.Id == $scope._dbooking.ClientStaffId) {
                $scope.newBooker.Passengers = [];
                $scope.newBooker.Passengers.push($scope.selectedPassenger);
                $http.post($config.API_ENDPOINT + "api/ClientStaff/ManagePassengers", $scope.newBooker).then(function(response) {}, function(err) {
                    swal({
                        title: "Error adding passenger to booker",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                });
            } else if ($scope.newPassenger && $scope.newPassenger.Id == $scope._dbooking.LeadPassengerId) {

                $scope.selectedBooker.Passengers.push($scope.selectedPassenger);
                $http.post($config.API_ENDPOINT + "api/ClientStaff/ManagePassengers", $scope.selectedBooker).then(function(response) {

                }, function(err) {
                    swal({
                        title: "Error adding passenger to booker",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                });
            }
            var b = $scope._dbooking;
            b.$$originalValues.Id = null;
            if ($scope.paxMode.value) {
                if (!b._LeadPassenger) {
                    swal('Invalid', 'Please add passenger details.', 'error');
                    return;
                }
                var split = b._LeadPassenger.split(' ');
                $scope._dbooking.LeadPassenger = {
                    Firstname: split[0],
                    Surname: split.slice(1).join(' '),
                    Mobile: b._LeadPassengerNumber,
                    ClientId: b.ClientId
                };
            }
            $scope._dbooking.BookingValidations = [];
            if ($scope.clientReferences.length > 0) {
                for (var i = 0; i < $scope.clientReferences.length; i++) {
                    var c = $scope.clientReferences[i];
                    var _cr = new Model.BookingValidation();
                    _cr.ClientReferenceId = c.Id;
                    if (c.ReferenceType == 'List') {
                        _cr.Value = c.$knownValue && c.$knownValue.text;
                    } else {
                        _cr.Value = c.$knownValue;
                    }
                    if (_cr.Value)
                        $scope._dbooking.BookingValidations.push(_cr);
                }
            }

            $scope._dbooking.BookingTags = [];
            if($scope._dbooking.Tags && $scope._dbooking.Tags.length > 0) {
                $scope._dbooking.Tags.forEach(function(tag) {
                    var newTag = {
                        TagId: tag.Id,
                        Type: tag.Type
                    };
                    $scope._dbooking.BookingTags.push(newTag);
                })
            }

            $scope._dbooking.BookedDateTime = getDate($scope._dbooking.Date, $scope._dbooking.Time);
            $scope._dbooking.BookingSource = 'CLIENT_PORTAL';

            promises.push($scope._dbooking.$save());
            $q.all(promises).then(function(result) {
                var id = result[result.length - 1].data.LocalId;
                swal({
                    title: "Booking Saved.",
                    text: "Booking Reference: #" + id,
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });

                $("#bookingsave").prop("disabled", false);
                $("#bookingrepeat").prop("disabled", false);

                if (!repeat) {
                    cancel();
                    $scope.dataReady = true;
                    $("#bookingsave").html("<i class='material-icons'>send</i> Save");
                } else {
                    $scope.flightData = {
                        Number: ""
                    };
                    $scope._dbooking.FlightInfo = null;
                    $scope.dataReady = true;
                    $("#bookingrepeat").html("<i class='material-icons'>repeat_one</i> Save &amp; Repeat");
                }
            }, function(error) {
                $scope.dataReady = true;
                if (error.data && error.data.Message) {
                    swal({
                        title: "Some Error Occured.",
                        text: error.data.Message,
                        type: "error"
                    });
                } else {
                    swal({
                        title: "Some Error Occured.",
                        text: "Something went wrong. Cab9 team have been alrerted.",
                        type: "error"
                    });
                }
                $("#bookingsave").prop("disabled", false);
                $("#bookingrepeat").prop("disabled", false);
                $("#bookingsave").html("<i class='material-icons'>send</i>Save");
                $("#bookingrepeat").html("<i class='material-icons'>repeat_one</i>Save &amp; Repeat");
            });
        }

        function getDate(date, time) {
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var hours = time.getHours();
            var minutes = time.getMinutes();

            var format = pad(year, 4) + '-' + pad(month + 1, 2) + '-' + pad(day, 2) + 'T' + pad(hours, 2) + ':' + pad(minutes, 2) + ':00';
            var formatted = moment.tz(format, 'YYYY-MM-DDTHH:mm:ss', Localisation.timeZone().getTimeZone()).format();

            return formatted;

            function pad(num, size) {
                var s = "000000000" + num;
                return s.substr(s.length - size);
            }
        }

        function cancel() {
            _clearMap();
            setupBooking();
            watchPassenger = null;
            $scope.paxMode.value = false;
            $scope.paxHistory = null;
            $scope.quote = null;
        }

        function addStop($index) {
            var stop = new Model.BookingStop();
            stop.id = idCounter++;
            if ($scope._dbooking.WaitAndReturn)
                $scope._dbooking.BookingStops.splice($index, 0, stop);
            else
                $scope._dbooking.BookingStops.splice($index + 1, 0, stop);
            if ($scope._dbooking.BookingStops.length > 2)
                $scope.sortableOptions.disabled = false;
        }

        $scope.$watch('_dbooking.Date', function(newvalue, oldvalue) {
            if ($scope.flightData.Number && newvalue && newvalue != oldvalue) {
                fetchFlightInformation();
            }
        });

        function fetchFlightInformation() {
            //if (new moment($scope._dbooking.Date).isBefore(new moment().startOf('day'))) {
            //    swal('Error', 'Flight tracking is only available on future bookings.', 'error');
            //    return;
            //}
            $scope._dbooking.FlightInfo = null;
            if ($scope.flightData.Number.length > 0) {
                $http({
                    url: $config.API_ENDPOINT + '/api/flightinfo/getflightinfo',
                    method: 'GET',
                    params: {
                        flightno: $scope.flightData.Number,
                        flightDate: getDate($scope._dbooking.Date, $scope._dbooking.Time)
                    }
                }).then(function(result) {
                    if (result.data) {
                        result.data.Id = null;
                        result.data.BookingId = null;
                        result.data.TenantId = null;
                        $scope._dbooking.FlightInfo = new Model.FlightInfo(result.data);

                        var tz = Localisation.timeZone().getTimeZone();
                        var currentOffset = moment($scope._dbooking.FlightInfo.ArrivalTime).toDate().getTimezoneOffset();
                        var desiredOffset = moment.tz.zone(tz).offset($scope._dbooking.FlightInfo.ArrivalTime);

                        var dt = new moment.tz($scope._dbooking.FlightInfo.ArrivalTime, tz).add(currentOffset - desiredOffset, 'minutes');

                        $scope._dbooking.Time = dt.toDate();
                        $scope.timeSet = true;

                        if (result.data.SuggestedAddressId && $scope._dbooking.BookingStops[0].$$Id != result.data.SuggestedAddressId) {
                            var $id = result.data.SuggestedAddressId;
                            Model.Location.query()
                                .where("Id eq guid'" + result.data.SuggestedAddressId + "'")
                                .execute()
                                .then(function(result) {
                                    var _bs = new Model.BookingStop();
                                    _bs.Address1 = result[0].Name ? result[0].Name : '';
                                    _bs.StopSummary = result[0].Name ? result[0].Name : '';
                                    _bs.Latitude = result[0].Latitude ? result[0].Latitude : null;
                                    _bs.Longitude = result[0].Longitude ? result[0].Longitude : null;
                                    _bs.$$Id = $id;
                                    center_moved = false;
                                    $scope._dbooking.BookingStops[0] = _bs;
                                });
                        }
                    } else {
                        swal("Flight Not Found", "Please check flight number.", "warning")
                    }
                }, function(error) {
                    swal("Incorrect Flight Number", "Please check flight number.", "warning")
                });
            } else {
                swal("Incorrect Flight Number", "Please check flight number.", "warning");
            }
        }

        function getPickupLocation() {
            Model.Location.query()
                .where("ICAO eq '" + $scope.flightData.info.destinationField + "'").execute()
                .then(function(result) {
                    var _bs = new Model.BookingStop();
                    _bs.Address1 = result[0].Name ? result[0].Name : '';
                    _bs.StopSummary = result[0].Name ? result[0].Name : '';
                    _bs.Latitude = result[0].Latitude ? result[0].Latitude : null;
                    _bs.Longitude = result[0].Longitude ? result[0].Longitude : null;
                    center_moved = false;
                    $scope._dbooking.BookingStops[0] = _bs;
                });
        }

        function _clearMap() {
            if (directionsPolyline) {
                directionsPolyline.setMap(null);
                directionsPolyline = null;
            }
            angular.forEach(bookingMakers, function(m) {
                m.setMap(null);
            });
            bookingMakers.length = 0;
        }

        $scope.$watch("_dbooking.BookingStops[0]", function(newvalue) {
            if ($scope._dbooking.WaitAndReturn) {
                var stop = new Model.BookingStop(angular.copy($scope._dbooking.BookingStops[0]));
                stop.id = idCounter++;
                $scope._dbooking.BookingStops.splice($scope._dbooking.BookingStops.length - 1, 1, stop);
            }
        }, true);

        $scope.$watch("_dbooking.WaitAndReturn", function(newvalue) {
            if (newvalue === false) {
                $scope._dbooking.BookingStops.splice($scope._dbooking.BookingStops.length - 1, 1);
            } else if (newvalue === true) {
                var stop = new Model.BookingStop(angular.copy($scope._dbooking.BookingStops[0]));
                stop.id = idCounter++;
                $scope._dbooking.BookingStops.push(stop);
            }

            $scope.canQuote = true;
            var bounds = new google.maps.LatLngBounds();
            var validPoints = 0;
            _clearMap();
            angular.forEach($scope._dbooking.BookingStops, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                } else {
                    validPoints++;
                    var pos = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                    bookingMakers.push(new google.maps.Marker({
                        position: pos,
                        visible: true,
                        icon: ($index == 0) ? '/includes/images/user.png' : '/includes/images/userTo.png',
                        map: $scope.dispatchObj.map.mapObject,
                        zIndex: 1000
                    }));
                    bounds.extend(pos);
                }
            });

            if (validPoints > 0) {
                $scope.dispatchObj.map.mapObject.fitBounds(bounds);
            }
        });

        $scope.$watch("_dbooking.BookingStops", function(newvalue) {
            $scope.canQuote = true;
            var bounds = new google.maps.LatLngBounds();
            var validPoints = 0;
            _clearMap();
            angular.forEach(newvalue, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                } else {
                    validPoints++;
                    var pos = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                    bookingMakers.push(new google.maps.Marker({
                        position: pos,
                        visible: true,
                        icon: ($index == 0) ? '/includes/images/user.png' : '/includes/images/userTo.png',
                        map: $scope.dispatchObj.map.mapObject,
                        zIndex: 1000
                    }));
                    bounds.extend(pos);
                }
            });

            if (validPoints > 0) {
                $scope.dispatchObj.map.mapObject.fitBounds(bounds);
            }

            if ($scope.canQuote) {
                getQuote($scope._dbooking);
            } else {
                $scope._dbooking.EstimatedCost = 0;
                $scope._dbooking.ActualCost = 0;
                $scope.quote = null;
                $scope.directions = null;
            }
        }, true);

        $scope.$watchGroup(["_dbooking.AsDirected", "_dbooking.ChauffeurMode", "_dbooking.EstimatedMins", "_dbooking.ActualDistance", "_dbooking.BookingStops.length"], function(newValues, oldValues) {
            if ($scope._dbooking.AsDirected === true) {
                $scope._dbooking.BookingStops.length = 1;
            } else if ($scope._dbooking.BookingStops.length == 1) {
                var stop = new Model.BookingStop();
                stop.id = idCounter++;
                $scope._dbooking.BookingStops.push(stop);
            }

            $scope.canQuote = true;
            var bounds = new google.maps.LatLngBounds();
            var validPoints = 0;
            _clearMap();
            angular.forEach($scope._dbooking.BookingStops, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                } else {
                    validPoints++;
                    var pos = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                    bookingMakers.push(new google.maps.Marker({
                        position: pos,
                        visible: true,
                        icon: ($index == 0) ? '/includes/images/user.png' : '/includes/images/userTo.png',
                        map: $scope.dispatchObj.map.mapObject,
                        zIndex: 1000
                    }));
                    bounds.extend(pos);
                }
            });

            if (validPoints == 0) {
                $scope.canQuote = false;
            }

            if (validPoints > 0) {
                $scope.dispatchObj.map.mapObject.fitBounds(bounds);
            }

            if ($scope.canQuote) {
                getQuote($scope._dbooking);
            } else {
                $scope._dbooking.EstimatedCost = 0;
                $scope._dbooking.ActualCost = 0;
                $scope.quote = null;
                $scope.directions = null;
            }
        });

        $scope.$watch("_dbooking.VehicleTypeId", function(newvalue) {
            $scope.canQuote = true;
            var bounds = new google.maps.LatLngBounds();
            var validPoints = 0;
            _clearMap();
            angular.forEach($scope._dbooking.BookingStops, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                } else {
                    validPoints++;
                    var pos = new google.maps.LatLng(bs.Latitude, bs.Longitude);
                    bookingMakers.push(new google.maps.Marker({
                        position: pos,
                        visible: true,
                        icon: ($index == 0) ? '/includes/images/user.png' : '/includes/images/userTo.png',
                        map: $scope.dispatchObj.map.mapObject,
                        zIndex: 1000
                    }));
                    bounds.extend(pos);
                }
            });

            if (validPoints > 0) {
                $scope.dispatchObj.map.mapObject.fitBounds(bounds);
            }

            if ($scope.canQuote) {
                getQuote($scope._dbooking);
            } else {
                $scope._dbooking.EstimatedCost = 0;
                $scope._dbooking.ActualCost = 0;
                $scope.quote = null;
                $scope.directions = null;
            }
        });

        function getQuote(booking) {
            $scope.dataReady = false;
            $scope.quoting = true;

            for (var i = 0; i < $scope._dbooking.BookingStops.length; i++) {
                $scope._dbooking.BookingStops[i].StopOrder = i + 1;
            }

            booking.BookedDateTime = getDate($scope._dbooking.Date, $scope._dbooking.Time);
            booking.BookingStatus = 'Incoming';

            $http.post($config.API_ENDPOINT + 'api/quote', booking)
                .success(function(result) {
                    if (!result.Error) {
                        booking.EstimatedCost = result.FinalCost;
                        booking.EstimatedDistance = (0 || result.EstimatedDistance).toFixed(2);
                        booking.EstimatedDuration = result.EstimatedMins;
                        booking.ActualCost = result.FinalCost;
                        $scope.dataReady = true;
                        $scope.directions = result.Directions;
                        $scope.quote = result;

                    } else {
                        $scope.quote = result;
                        booking.EstimatedCost = 0;
                        booking.EstimatedDistance = 0;
                        booking.EstimatedDuration = 0;
                        booking.ActualCost = 0;
                        $scope.dataReady = true;
                        $scope.directions = null;
                    }

                    $scope.quoting = false;
                    if (result.Directions && result.Directions.EncodedRoute) {
                        var decodedPath = google.maps.geometry.encoding.decodePath(result.Directions.EncodedRoute);

                        directionsPolyline = new google.maps.Polyline({
                            map: $scope.dispatchObj.map.mapObject,
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
                        $timeout(function() {
                            $scope.dispatchObj.map.mapObject.fitBounds(bounds);
                        }, 500);
                    }
                }).error(function(error) {
                    console.log(error);
                    $scope.quoting = false;
                    $scope.dataReady = true;
                });
        }

        function repeatBooking(booking) {
            $scope.journeyCopied = false;
            $scope._dbooking.BookingStops = [];
            $scope._dbooking.BookingStops = angular.copy(booking.BookingStops).map(function(s) {
                s.Id = null;
                s.BookingId = null;
                s.Booking = null;
                return s;
            });
            $scope.journeyCopied = true;
            if ($scope._dbooking.BookingStops.length > 2)
                $scope.sortableOptions.disabled = false;
            else
                $scope.sortableOptions.disabled = true;
        }

        function validateClientRef(item) {
            $http.post($config.API_ENDPOINT + "api/clientreferences/validate?ClientReferenceId=" + item.Id + "&ReferenceValue=" + item.$knownValue).then(function(response) {
                item.$valid = true;
                $scope.validReference = true;
            }, function(err) {
                if (err.status == 404) {
                    $scope.validReference = false;
                    item.$valid = false;
                    return
                } else
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
            })
        }

        function getRouteDirections(route) {
            clearDirections();
        }

        function clearDirections() {
            $scope.directions = null;
            if (directionsPolyline) {
                directionsPolyline.setMap(null);
                directionsPolyline = null;
            }
            if (directionsRenderer) {
                directionsRenderer.setMap(null);
                directionsRenderer = null;
            }
        }

        //map
        $scope.dispatchObj = {
            map: {
                // google maps object
                mapObject: null,
            }
        }

        initMap();

        function initMap() {
            var center = new google.maps.LatLng(51.496384198223355, -0.12875142186092202);

            $scope.dispatchObj.map.mapObject = new google.maps.Map(document.getElementById('dispatch-map'), {
                center: center,
                zoom: 11,
                maxZoom: 16,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER
                },
                panControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM
                },
                mapTypeControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER
                },
            });
        }
    }
})(angular);