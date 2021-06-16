(function(angular) {
    var module = angular.module('cab9.bookings');

    module.controller('BookingCreateController', BookingCreateController);
    module.filter('PassengerFilter', passengerFilter);

    BookingCreateController.$inject = ['$scope', '$UI', '$modal', '$config', '$q', 'Model', '$stateParams', '$rootScope', 'Localisation', '$utilities', '$http', '$timeout', '$filter', 'rCompany', 'SignalR', 'Notification', '$interval', 'rTags'];

    function BookingCreateController($scope, $UI, $modal, $config, $q, Model, $stateParams, $rootScope, Localisation, $utilities, $http, $timeout, $filter, rCompany, SignalR, Notification, $interval, rTags) {
        $scope.company = rCompany[0];
        $scope.bookingTags = $scope.unlinkedTags = rTags;
        setupBooking();

        setupData();
        var skipStopsQuoting = false;

        $scope.current = {
            tab: 'Client'
        };  

        $scope.opened = {};
        $scope.week = [{
            day: "Su",
            value: 1,
            selected: false,
            full: "Sunday"
        }, {
            day: "Mo",
            value: 2,
            selected: false,
            full: "Monday"
        }, {
            day: "Tu",
            value: 4,
            selected: false,
            full: "Tuesday"
        }, {
            day: "We",
            value: 8,
            selected: false,
            full: "Wednesday"
        }, {
            day: "Th",
            value: 16,
            selected: false,
            full: "Thursday"
        }, {
            day: "Fr",
            value: 32,
            selected: false,
            full: "Friday"
        }, {
            day: "Sa",
            value: 64,
            selected: false,
            full: "Saturday"
        }];

        $scope.active = {
            Tab: false
        }

        $scope.paxMode = {
            value: false
        };
        $scope.addCard = addCard;
        $scope.showPaymentCards = false;

        $scope.newBooker = null;
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
        $scope.reverseStops = reverseStops;
        $scope.validateClientRef = validateClientRef;
        $scope.getSearchText = getSearchText;
        $scope.searchPassengers = searchPassengers;
        $scope.searchBookers = searchBookers;
        $scope.searchClients = searchClients;
        $scope.testMaskReferences = testMaskReferences;
        $scope.clientReferences = [];
        $scope.fetchedPassengers = [];
        $scope.fetchedClients = [];
        $scope.filteredBookers = [{
            Id: 'add-booker',
            Name: 'Add Booker',
            Description: 'Create New Booker',
            ImageUrl: '/includes/images/add-icon.png'
        }];
        $scope.clients = [];
        $scope.vehicleTypes = [];

        $scope.suggestReferences = suggestReferences;
        $scope.refSelected = refSelected;
        $scope.enableChauffering = enableChauffering;
        $scope.disableChauffering = disableChauffering;
        $scope.validateBooking = validateBooking;

        $scope.openCalendar = openCalendar;

        $scope.addStop = addStop;
        $scope.removeStop = removeStop;
        $scope.fetchFlightInformation = fetchFlightInformation;
        $scope.getQuote = getQuote;
        $scope.externalLocations = {
            knownLocations: [],
            historic: []
        };
        var bookingMakers = [];
        var watchPassenger = null;
        var directionsPolyline = null;

        $scope.applyCoupon = applyCoupon;

        $http.get($config.API_ENDPOINT + 'api/DispatchSettings').then(function (s) {
            if (s.data[0]) {
                $scope.dispatchSettings = s.data[0];
            }
        });

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


        $scope.$watch("_dbooking.PaymentMethod", function(newvalue) {
            if (newvalue == 'Card') {
                $scope._dbooking.TaxId = ($scope.COMPANY.DefaultCardTaxId || $scope.COMPANY.DefaultTaxId);
            } else if (newvalue == 'Cash') {
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


                // if($scope._dbooking.PaymentCardId == null || $scope._dbooking.PaymentCardId == undefined) {
                //     $scope.canQuote = false;
                // } else {
                //     $scope.canQuote = true;
                // }

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

        }, true);

        $scope.$watch("_dbooking.PaymentCardId", function(newvalue) {
            if ($scope._dbooking.PaymentMethod == "Card" && $scope._dbooking.LeadPassengerId != undefined && $config.CARD_PAYMENTS_ENABLED) {
                if (newvalue == null || newvalue == undefined) {
                    $scope.canQuote = false;
                } else {
                    $scope.canQuote = true;
                }
            }
        });

        function getSearchText(text) {
            if ($scope._dbooking.LeadPassengerId !== "add-passenger")
                $scope.searchText = text;
        }

        function flipAddress() {
            var firstStop = $scope._dbooking.BookingStops[0];
            $scope._dbooking.BookingStops[0] = $scope._dbooking.BookingStops[1];
            $scope._dbooking.BookingStops[1] = firstStop;
            for (var i = 0; i < $scope._dbooking.BookingStops.length; i++) {
                $scope._dbooking.BookingStops[i].StopOrder = i + 1;
            }
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

        function searchClients(searchText) {
            if (searchText && searchText.length > 2) {
                $scope.fetchedClients = $filter('filter')($scope.clients, {
                    Name: searchText
                });
            } else {
                $scope.fetchedClients = [];
            }
        }

        function applyCoupon() {
            $scope._dbooking.Coupon = $scope._dbooking.$Coupon;
            getQuote($scope._dbooking);
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
            $scope.fetchedPassengers.length = 0;
            $http.get($config.API_ENDPOINT + "api/Passengers/Search", {
                params: {
                    searchText: searchText,
                    clientId: $scope._dbooking.ClientId
                }
            }).success(function(data) {
                angular.forEach(data, function(item) {
                    if (item.Client) {
                        item.Client.ImageUrl = $utilities.formatUrl(item.Client.ImageUrl, item.Client.Name);
                    }
                    $scope.fetchedPassengers.push({
                        Id: item.Id,
                        ClientId: item.ClientId,
                        Name: item.Firstname + ' ' + item.Surname,
                        Description: ((item.Client && item.Client.Name) ? item.Client.Name : 'No Client'),
                        Mobile: item.Mobile,
                        Phone: item.Phone,
                        Addresses: item.Addresses,
                        DefaultVehicleTypeId: item.DefaultVehicleTypeId,
                        ImageUrl: $utilities.formatUrl(item.ImageUrl, item.Firstname)
                    });
                });
                $scope.fetchedPassengers.push({
                    Id: 'add-passenger',
                    Name: 'Add Passenger',
                    Description: 'Create New Passenger',
                    ImageUrl: '/includes/images/add-icon.png'
                });
            });
        }

        function searchBookers(searchText) {
            if ($scope._dbooking.ClientId) {
                $scope.filteredBookers.length = 0;
                $http.get($config.API_ENDPOINT + "api/Bookers/Search", {
                    params: {
                        searchText: searchText,
                        clientId: $scope._dbooking.ClientId
                    }
                }).success(function(data) {
                    angular.forEach(data, function(item) {
                        if (item.Client) {
                            item.Client.ImageUrl = $utilities.formatUrl(item.Client.ImageUrl, item.Client.Name);
                        }
                        $scope.filteredBookers.push({
                            Id: item.Id,
                            ClientId: item.ClientId,
                            Name: item.Firstname + ' ' + item.Surname,
                            Description: ((item.Client && item.Client.Name) ? item.Client.Name : 'No Client'),
                            Mobile: item.Mobile,
                            ImageUrl: $utilities.formatUrl(item.ImageUrl, item.Firstname)
                        });
                    });
                    $scope.filteredBookers.push({
                        Id: 'add-booker',
                        Name: 'Add Booker',
                        Description: 'Create New Booker',
                        ImageUrl: '/includes/images/add-icon.png'
                    });
                });
            }
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

        function setupBooking() {
            $scope.flightData = {
                Number: "",
                DateTime: null,
                MinsAfterLanding: 0,
                GetDate: function (format) {
                    var d = this.DateTime && new moment(this.DateTime).add(this.MinsAfterLanding || 0, 'minute');
                    if (format) {
                        return d.format(format);
                    } else {
                        return d;
                    }
                }
            };
            var _b = $scope._dbooking = new Model.Booking();
            $scope.displayMode = 'CREATE';
            _b.BookingStops = [];
            _b.BookingValidations = [];
            _b.BookingStops.push(new Model.BookingStop());
            _b.BookingStops.push(new Model.BookingStop());
            _b.TaxId = $scope.COMPANY.DefaultTaxId;

            _b.Pax = $scope.company.DefaultPax;
            _b.Bax = $scope.company.DefaultBax;
            _b.PaymentMethod = 'Cash';
            _b.AsDirected = false;

            var tz = Localisation.timeZone().getTimeZone() || "Europe/London";
            var currentOffset = new Date().getTimezoneOffset();
            var desiredOffset = moment.tz.zone(tz).offset(new Date());

            var dt = new moment.tz(tz).add(currentOffset - desiredOffset, 'minutes');
            _b.Date = dt.toDate();
            _b.Time = new Date(dt.startOf('minute').add(15, 'minutes').format());

            _b.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
            _b.EstimatedCost = 0;


            _b.TextConfirmation = $scope.company.TextConfirmation;
            _b.EmailConfirmation = $scope.company.EmailConfirmation;
            _b.TextOnArrival = $scope.company.TextOnArrival;
            _b.CallOnArrival = $scope.company.CallOnArrival;
            _b.TextAssigned = $scope.company.TextAssigned;
            _b.EmailAssigned = $scope.company.EmailAssigned;
            _b.TextOnCompletion = $scope.company.TextOnCompletion;
            _b.TextOnOnRoute = $scope.company.TextOnOnRoute;
            _b._AutoDispatchOffset = 15;

            $scope.repeatSchedule = new Model.RepeatBooking();
        }

        function setupData() {
            var promises = [];
            $scope.dataReady = false;
            var _clientP = Model.Client.query().where('Active eq true')
                .select('Id,Name,AccountNo,AccountPassword,DefaultCurrencyId,ImageUrl,OnHold,Priority,AutoDispatch,ClientType/Name,ClientReferences,Tags,AllVehicleTypeAccess,Phone,DefaultPaymentType,DefaultVehicleTypeId,TextConfirmation,EmailConfirmation,TextOnArrival,CallOnArrival,TextAssigned,EmailAssigned,TextOnCompletion,TextOnOnRoute')
                .include('ClientType,ClientReferences,Tags')
                .parseAs(function(item) {
                    this.Id = item.Id;
                    this.Name = ((item.AccountNo) ? item.AccountNo + ' - ' : '') + item.Name;
                    this.DefaultCurrencyId = item.DefaultCurrencyId;
                    this.Description = item.ClientType.Name;
                    this.Phone = item.Phone;
                    this.OnHold = item.OnHold;
                    this.AccountPassword = item.AccountPassword;
                    this.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Name);
                    this.AllVehicleTypeAccess = item.AllVehicleTypeAccess;
                    this.DefaultPaymentType = item.DefaultPaymentType;
                    this.DefaultVehicleTypeId = item.DefaultVehicleTypeId;
                    this.TextConfirmation = item.TextConfirmation;
                    this.EmailConfirmation = item.EmailConfirmation;
                    this.TextOnArrival = item.TextOnArrival;
                    this.CallOnArrival = item.CallOnArrival;
                    this.TextAssigned = item.TextAssigned;
                    this.EmailAssigned = item.EmailAssigned;
                    this.TextOnCompletion = item.TextOnCompletion;
                    this.TextOnOnRoute = item.TextOnOnRoute;
                    this.Priority = item.Priority;
                    this.AutoDispatch = item.AutoDispatch;
                    this.Tags = item.Tags;
                    this.ClientReferences = item.ClientReferences.filter(function(r) { return r.Active; }).map(function(cr) {
                        return {
                            Id: cr.Id,
                            ReferenceName: cr.ReferenceName,
                            Mandatory: cr.Mandatory,
                            AllowAddToList: cr.AllowAddToList,
                            Value: cr.Value,
                            ReferenceType: cr.ReferenceType,
                            ShowList: cr.ShowList
                        }
                    });
                }).execute().then(function(data) {
                    $scope.clients = data;
                });

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

            var _bookingRequirementP = Model.BookingRequirement.query()
                .execute().then(function(data) {
                    $scope.bookingRequirements = $scope.unlinkedRequirements = data;
                });

            promises.push(_clientP);
            // promises.push(_passengerP);
            promises.push(_vehicleTypeP);
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
                            _booker.Phone = $scope.clients.filter(function(c) {
                                return c.Id == $scope._dbooking.ClientId;
                            })[0].Phone;
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
                            ImageUrl: $utilities.formatUrl(data.ImageUrl, data.Firstname)
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


        $scope.$watch("selectedPassenger.Mobile", function(newvalue) {
            $scope._dbooking.PassengerNotificationPhone = newvalue;
        });
        $scope.$watch("selectedPassenger.Phone", function(newvalue) {
            if(!$scope._dbooking.PassengerNotificationPhone) 
                $scope._dbooking.PassengerNotificationPhone = newvalue;
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
                            ImageUrl: $utilities.formatUrl(data.ImageUrl, data.Firstname),
                            Notes: data.Notes
                        };
                        $scope.fetchedPassengers.push(d);
                        $scope._dbooking.ClientId = data.ClientId;
                        $scope._dbooking.LeadPassengerId = data.Id;
                    },
                    function() {

                    });
                return;
            }

            $scope.filteredPaymentCards = [];
            $scope._dbooking.PaymentCardId = null;

            var b = $scope._dbooking;
            if (newvalue) {
                var found = $scope.fetchedPassengers.filter(function(item) {
                    return item.Id == newvalue;
                })[0];



                $scope.selectedPassenger = found;
                
                $http.get('http://localhost:8081/v1.1/api/passenger/loyalty-account?passengerId=' + $scope.selectedPassenger.Id).success(function(data){
                    $scope.AmountPerPoint = parseFloat(data.conversion);
                    $scope.loyaltyAccount = data.account;
                    $scope.useLoyalty = false;
                    $scope.pointsUsed = 0;
                    $scope.useAllPoints = false;
                    $scope.partialPonts = 0;
                });

                Model.Note.query()
                    .where("OwnerType eq 'Passenger'")
                    .where("OwnerId eq guid'" + newvalue + "'")
                    .execute()
                    .then(function(data) {
                        var _cn = "";
                        for (i = 0; i < data.length; i++) {
                            _cn += data[i].Content;
                            if (i < (data.length - 1)) {
                                _cn += "\r\n\r\n";
                            }
                        }
                        found.Notes = _cn;
                        if (found.Notes) {
                            if ($scope.company.AutoCopyPassengerNotes) {
                                b.DriverNotes = "Passenger Note: \r\n" + found.Notes;
                            }
                            $timeout(function() {
                                $('tab-heading:contains(Passenger)')[0].click();
                            });
                        }
                    });

                b.ClientId = found.ClientId ? found.ClientId : undefined;
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

                var c = $scope.clients.filter(function(c) {
                    return c.Id == found.ClientId;
                })[0];
                if (c) {
                    $scope.fetchedClients = [c];
                } else {
                    $scope.fetchedClients = [];
                }

                Model.Booking.query().where("LeadPassengerId", 'eq', "guid'" + newvalue + "'").include('BookingStops').orderBy('BookedDateTime desc').top(5).execute().then(function(d) {
                    $scope.paxHistory = d;
                    $scope.currentTab = 'HISTORY';
                });

                $scope.externalLocations.historic.length = 0;
                Model.BookingStop.query().where("Booking/LeadPassengerId", 'eq', "guid'" + newvalue + "'").top(10).execute().then(function (d) {
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

                if(found.DefaultVehicleTypeId != null) {
                    $scope._dbooking.VehicleTypeId = found.DefaultVehicleTypeId;
                    if (!$scope.filteredVehicleTypes.some(function (x) { return x.Id == found.DefaultVehicleTypeId; })) {
                        var foundVt = $scope.vehicleTypes.find(function (x) { return x.Id == found.DefaultVehicleTypeId; });
                        if (foundVt) {
                            $scope.filteredVehicleTypes.push(foundVt);
                        }
                    }
                }
                if(!found.Tags) {
                    setupTags();
                } 
                
                function setupTags() {
                    Model.Passenger.query().where("Id", 'eq', "guid'" + newvalue + "'").include('Tags').select("Tags").execute().then(function(d) {
                        found.Tags = d[0].Tags;
                        $scope.passengerTags = found.Tags;
                        for (var i = 0; i < found.Tags.length; i++) {
                            addTag(found.Tags[i]);
                        }
                    });
                }
            } else {
                if (watchPassenger) {} else {
                    watchPassenger = true;
                    $scope.filteredPassengers = $scope.passengers;
                }
                $scope.selectedPassenger = null;
                b.PassengerNotificationPhone = null;
                $scope.externalLocations.knownLocations = $scope.externalLocations.knownLocations.filter (function(item) {
                    return item.LocationType !== 'Passenger Address';
                });
                if($scope.passengerTags) {
                    for (var i = 0; i < $scope.passengerTags.length; i++) {
                        removeTag($scope.passengerTags[i]);
                    }
                }
            }
        });

        var initializing = true
        $scope.$watch("_dbooking.ClientId", function(newvalue, oldvalue) {
            $scope._dbooking.$clientOnHold = false;
            if (initializing) {
                setTimeout(function() {
                    initializing = false;
                }, 0);
            } else {
                if (newvalue) {
                    $scope._dbooking.ClientStaffId = null;

                    var found = $scope.clients.filter(function(item) {
                        return item.Id == newvalue;
                    })[0];

                    if (found) {
                        if (found.OnHold) {
                            swal({
                                title: "Account On Hold",
                                text: "This account is currently on hold, new bookings have been disabled.",
                                type: "error",
                                animation: "slide-from-top"
                            });
                            $scope._dbooking.$clientOnHold = true;
                            $scope._dbooking.ClientId = null;
                            return;
                        }

                        if (found.AccountPassword) {
                            swal({
                                title: "Account Password",
                                text: "This account is password enabled.",
                                type: "input",
                                showCancelButton: true,
                                closeOnConfirm: false,
                                closeOnCancel: false,
                                animation: "slide-from-top",
                                inputPlaceholder: "Account Password",
                                allowEscapeKey: false,
                                allowOutsideClick: false
                            }, function(inputValue) {
                                if (inputValue === false) {
                                    $scope._dbooking.ClientId = null;
                                    $scope.$apply();
                                    swal.close();
                                    return false;
                                }
                                if (inputValue === "") {
                                    swal.showInputError("You need to write something!");
                                    return false;
                                }
                                if (inputValue == found.AccountPassword) {
                                    swal("Accepted", "The password is valid. Please continue with the booking.", "success")
                                } else {
                                    swal.showInputError("Incorrect Password");
                                    return false;
                                }
                            });

                        }

                        Model.Note.query()
                            .where("OwnerType eq 'Client'")
                            .where("OwnerId eq guid'" + newvalue + "'")
                            .execute()
                            .then(function(data) {
                                var _cn = "";
                                for (i = 0; i < data.length; i++) {
                                    _cn += data[i].Content + "\r\n\r\n";
                                }
                                $scope.clientNotes = _cn;
                            });

                        $scope.clientReferences = angular.copy(found.ClientReferences);
                        $scope.clientReferences.map(function(item) {
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
                            return item
                        });
                        $scope.selectedClient = found;

                        if (found.AllVehicleTypeAccess === false) {
                            Model.Client.query()
                                .where("Id eq guid'" + newvalue + "'")
                                .include('VehicleTypes')
                                .select('VehicleTypes')
                                .execute()
                                .then(function(data) {
                                    $scope.filteredVehicleTypes = data[0].VehicleTypes.sort(function(a, b) { return (a.Order || 99) - (b.Order || 99) }).map(function(_vt) {
                                        _vt.ImageUrl = null;
                                        return _vt;
                                    });
                                    if (found.DefaultVehicleTypeId) {
                                        $scope._dbooking.VehicleTypeId = found.DefaultVehicleTypeId;
                                        if (!$scope.filteredVehicleTypes.some(function (x) { return x.Id == found.DefaultVehicleTypeId; })) {
                                            var foundVt = $scope.vehicleTypes.find(function (x) { return x.Id == found.DefaultVehicleTypeId; });
                                            if (foundVt) {
                                                $scope.filteredVehicleTypes.push(foundVt);
                                            }
                                        }
                                    } else {
                                        $scope._dbooking.VehicleTypeId = $scope.filteredVehicleTypes[0].Id;
                                    }
                                });
                        } else {
                            $scope.filteredVehicleTypes = $scope.vehicleTypes;
                            if (found.DefaultVehicleTypeId) {
                                $scope._dbooking.VehicleTypeId = found.DefaultVehicleTypeId;
                            }
                        }

                        if (found.DefaultPaymentType) {
                            $scope._dbooking.PaymentMethod = found.DefaultPaymentType;
                        }

                        $scope._dbooking.TextConfirmation = (angular.isDefined(found.TextConfirmation) && found.TextConfirmation !== null) ? found.TextConfirmation : $scope.company.TextConfirmation;
                        $scope._dbooking.EmailConfirmation = (angular.isDefined(found.EmailConfirmation) && found.EmailConfirmation !== null) ? found.EmailConfirmation : $scope.company.EmailConfirmation;
                        $scope._dbooking.TextOnArrival = (angular.isDefined(found.TextOnArrival) && found.TextOnArrival !== null) ? found.TextOnArrival : $scope.company.TextOnArrival;
                        $scope._dbooking.CallOnArrival = (angular.isDefined(found.CallOnArrival) && found.CallOnArrival !== null) ? found.CallOnArrival : $scope.company.CallOnArrival;
                        $scope._dbooking.TextAssigned = (angular.isDefined(found.TextAssigned) && found.TextAssigned !== null) ? found.TextAssigned : $scope.company.TextAssigned;
                        $scope._dbooking.EmailAssigned = (angular.isDefined(found.EmailAssigned) && found.EmailAssigned !== null) ? found.EmailAssigned : $scope.company.EmailAssigned;
                        $scope._dbooking.TextOnCompletion = (angular.isDefined(found.TextOnCompletion) && found.TextOnCompletion !== null) ? found.TextOnCompletion : $scope.company.TextOnCompletion;
                        $scope._dbooking.TextOnOnRoute = (angular.isDefined(found.TextOnOnRoute) && found.TextOnOnRoute !== null) ? found.TextOnOnRoute : $scope.company.TextOnOnRoute;
                        $scope._dbooking.AutoDispatch = found.AutoDispatch;
                        if (found.Priority) {
                            var p = ['P1', 'P2', 'P3', 'P4', 'P5'].indexOf(found.Priority) + 1;
                            $scope._dbooking.Priority = p.toFixed(0);
                        } else {
                            $scope._dbooking.Priority = "P1";
                        }

                        if(found.Tags) {
                            for (var i = 0; i < found.Tags.length; i++) {
                                addTag(found.Tags[i]);
                            }
                        }
                        Model.Client.query()
                            .where("Id eq guid'" + newvalue + "'")
                            .include('KnownLocations')
                            .select('KnownLocations,Address1,Address2,Area,TownCity,County,Postcode,Country,Latitude,Longitude,BillingAddress1,BillingAddress2,BillingArea,BillingTownCity,BillingCounty,BillingPostcode,BillingCountry,BillingLatitude,BillingLongitude')
                            .execute()
                            .then(function(data) {
                                [].push.apply($scope.externalLocations.knownLocations, data[0].KnownLocations);

                                if (data[0].Latitude && data[0].Longitude) {
                                    var add = '';
                                    if (data[0].Address1 && data[0].Address1.length > 1) {
                                        add += data[0].Address1;
                                    }
                                    if (data[0].TownCity) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += data[0].TownCity;
                                    } else if (data[0].Area) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += data[0].Area;
                                    }
                                    if (data[0].Postcode) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += data[0].Postcode;
                                    }

                                    $scope.externalLocations.knownLocations.push({
                                        Address1: data[0].Address1,
                                        Address2: data[0].Address2,
                                        Area: data[0].Area,
                                        TownCity: data[0].TownCity,
                                        County: data[0].County,
                                        Postcode: data[0].Postcode,
                                        Country: data[0].Country,
                                        Latitude: data[0].Latitude,
                                        Longitude: data[0].Longitude,
                                        Name: 'Office Address',
                                        StopSummary: add,
                                        LocationType: 'OFFICE'
                                    });
                                }

                                if (data[0].BillingLatitude && data[0].BillingLongitude && (data[0].BillingLatitude != data[0].Latitude && data[0].Longitude != data[0].BillingLongitude)) {
                                    var add = '';
                                    if (data[0].BillingAddress1 && data[0].BillingAddress1.length > 1) {
                                        add += data[0].BillingAddress1;
                                    }
                                    if (data[0].BillingTownCity) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += data[0].BillingTownCity;
                                    } else if (data[0].BillingArea) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += data[0].BillingArea;
                                    }
                                    if (data[0].BillingPostcode) {
                                        if (add.length > 0) {
                                            add += ', ';
                                        }
                                        add += data[0].BillingPostcode;
                                    }

                                    $scope.externalLocations.knownLocations.push({
                                        Address1: data[0].BillingAddress1,
                                        Address2: data[0].BillingAddress2,
                                        Area: data[0].BillingArea,
                                        TownCity: data[0].BillingTownCity,
                                        County: data[0].BillingCounty,
                                        Postcode: data[0].BillingPostcode,
                                        Country: data[0].BillingCountry,
                                        Latitude: data[0].BillingLatitude,
                                        Longitude: data[0].BillingLongitude,
                                        Name: 'Billing Address',
                                        StopSummary: add,
                                        LocationType: 'OFFICE'
                                    });
                                }
                            });

                    } else {
                        $scope.clientReferences = [];
                        $scope.selectedClient = null;
                        $scope.filteredVehicleTypes = $scope.vehicleTypes;
                        $scope._dbooking.PaymentMethod = 'Cash';
                    }

                    $timeout(function() {
                        var _tempHeight = $("#passenger-info").height() - 37;
                        $(".form-control.client-notes").css("height", _tempHeight + "px");
                    }, 100);


                } else {
                    $scope.filteredVehicleTypes = $scope.vehicleTypes;
                    $scope._dbooking.PaymentMethod = 'Cash';
                    $scope._dbooking.ClientStaffId = null;
                    $scope._dbooking.LeadPassengerId = null;
                    $scope._dbooking.ClientId = null;
                    $scope.fetchedClients = [];
                    $scope.clientReferences = [];
                    $scope.selectedClient = null;
                    $scope.externalLocations.knownLocations.length = 0;
                    $scope._dbooking.Tags.length = 0;
                }
            }
            if ($scope._dbooking.ClientId) {
                var client = $scope.clients.filter(function(c) {
                    return c.Id == $scope._dbooking.ClientId
                })[0];
                if (client)
                    $scope._dbooking.CurrencyId = client.DefaultCurrencyId;
            } else {
                $scope._dbooking.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
            }
            if (!initializing) {
                $scope.canQuote = true;
                angular.forEach($scope._dbooking.BookingStops, function (bs, $index) {
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
            }
        }, true);

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

        function getDate(date, time, subtract) {
            if (!date) {
                date = new Date();
            }
            var year = date.getFullYear();
            var month = date.getMonth();
            var date = date.getDate();
            var hours = time.getHours();
            var minutes = time.getMinutes();

            var format = pad(year, 4) + '-' + pad(month + 1, 2) + '-' + pad(date, 2) + 'T' + pad(hours, 2) + ':' + pad(minutes, 2) + ':00';
            var formatted = moment.tz(format, 'YYYY-MM-DDTHH:mm:ss', Localisation.timeZone().getTimeZone()).subtract(subtract || 0, 'minutes').format();

            return formatted;

            function pad(num, size) {
                var s = "000000000" + num;
                return s.substr(s.length - size);
            }
        }

        function validateBooking(repeat)
        {
            // check if the selected booking time is for the past or not
            if(moment($scope._dbooking.BookedDateTime).isBefore(moment.utc(), 'minute'))
            {
                swal({
                    title: "Booking in the Past",
                    text: "The booking date & time are in the past. Are you Sure?",
                    type: 'warning',
                    showCancelButton: true,
                    closeOnConfirm: true,
                    closeOnCancel: true
                }, function(isConfirm) {
                    if(isConfirm) {
                        save(repeat);
                    }
                });
            } else {
                save(repeat);
            }
        }

        function save(repeat) {
            $("#bookingsave").prop("disabled", true);
            $("#bookingrepeat").prop("disabled", true);

            var scheduled = false;
            if ($scope.week.filter(function(day) {
                    return day.selected == true
                }).length > 0) {
                if ($scope.repeatSchedule.EndDate == null || $scope.repeatSchedule.Label == null || $scope.repeatSchedule.Label.length == 0) {
                    swal({
                        title: "Scheduled Booking Error",
                        text: "Scheduled booking should have a label and an end date.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $("#bookingsave").prop("disabled", false);
                    $("#bookingrepeat").prop("disabled", false);
                    return;
                } else {
                    scheduled = true;
                    $scope.repeatSchedule.DaysOfWeek = $scope.week.reduce(function(prev, day) {
                        if(day.selected) {
                            return prev + day.value;
                        } else {
                            return prev;
                        }
                    }, 0);
                }
            }


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

            if ($scope._dbooking.FlightInfo) {
                $scope._dbooking.FlightInfo.MinsAfterLanding = $scope.flightData.MinsAfterLanding;
                var d = $scope.flightData.GetDate().toDate();
                $scope._dbooking.BookedDateTime = getDate(d, d);
            } else {
                $scope._dbooking.BookedDateTime = getDate($scope._dbooking.Date, $scope._dbooking.Time);
            }

            if ($scope._dbooking.AutoDispatch) {
                $scope._dbooking.DispatchDateTime = getDate($scope._dbooking.Date, $scope._dbooking.Time, $scope._dbooking._AutoDispatchOffset);
            }

            if(scheduled == true) {
                promises.push($http.post($config.API_ENDPOINT + '/api/bookings/CreateScheduled', 
                { 
                    Schedule: $scope.repeatSchedule, 
                    Booking: $scope._dbooking 
                }));
            } else {
                promises.push($scope._dbooking.$save());
            }
            
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
                $scope.phoneCall = null;
                if (!repeat) {
                    cancel();
                    $scope.dataReady = true;
                    $("#bookingsave").html("<i class='material-icons'>send</i>Save");
                } else {
                    $scope.dataReady = true;
                    $("#bookingrepeat").html("<i class='material-icons'>repeat_one</i>Save &amp; Repeat");
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


        function cancel() {
            _clearMap();
            setupBooking();
            watchPassenger = null;
            $scope.paxMode.value = false;
            $scope.paxHistory = null;
            if (directionsPolyline) {
                directionsPolyline.setMap(null);
                directionsPolyline = null;
            }
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
                        result.data.MinsAfterLanding = $scope.flightData.MinsAfterLanding;
                        $scope._dbooking.FlightInfo = new Model.FlightInfo(result.data);

                        var tz = Localisation.timeZone().getTimeZone();
                        var test = moment($scope._dbooking.FlightInfo.ArrivalTime).toDate();
                        var currentOffset = test.getTimezoneOffset();
                        var desiredOffset = moment.tz.zone(tz).offset(test);

                        var dt = new moment.tz($scope._dbooking.FlightInfo.ArrivalTime, tz).add(currentOffset - desiredOffset, 'minutes');

                        $scope.flightData.DateTime = dt;
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

        $scope.$watch("_dbooking.BookingStops", function(newvalue) {
            console.log('StopsChanged');
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
                if (directionsPolyline) {
                    directionsPolyline.setMap(null);
                    directionsPolyline = null;
                }
                $scope.quote = null;
                $scope.directions = null;
                $scope._dbooking.EstimatedCost = 0;
                $scope._dbooking.ActualCost = 0;
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

        function getQuote(booking) {
            $scope.dataReady = false;

            if (directionsPolyline) {
                directionsPolyline.setMap(null);
                directionsPolyline = null;
            }

            booking.BookedDateTime = getDate($scope._dbooking.Date || new Date(), $scope._dbooking.Time);
            booking.BookingStatus = 'Incoming';
            for (var i = 0; i < $scope._dbooking.BookingStops.length; i++) {
                $scope._dbooking.BookingStops[i].StopOrder = i + 1;
            }

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

                        booking._AutoDispatchOffset = Math.max(15, result.DispatchOffset || 15);

                    } else {
                        $scope.quote = result;
                        booking.EstimatedCost = 0;
                        booking.EstimatedDistance = 0;
                        booking.EstimatedDuration = 0;
                        booking.ActualCost = 0;
                        $scope.dataReady = true;
                        $scope.directions = null;
                    }

                    if (result.Directions && result.Directions.EncodedRoute) {
                        var decodedPath = google.maps.geometry.encoding.decodePath(result.Directions.EncodedRoute);

                        if (directionsPolyline) {
                            directionsPolyline.setPath(decodedPath);
                        } else {
                            directionsPolyline = new google.maps.Polyline({
                                map: $scope.dispatchObj.map.mapObject,
                                path: decodedPath,
                                geodesic: true,
                                strokeColor: '#63C4E1',
                                strokeOpacity: 0.8,
                                strokeWeight: 6
                            });
                        }
                        var bounds = new google.maps.LatLngBounds();
                        for (i = 0; i < decodedPath.length; i++) {
                            bounds.extend(decodedPath[i]);
                        }
                        $timeout(function() {
                            $scope.dispatchObj.map.mapObject.fitBounds(bounds);
                        }, 500);
                    } else if (directionsPolyline) {
                        directionsPolyline.setMap(null);
                        directionsPolyline = null;
                    }
                }).error(function(error) {
                    $scope.dataReady = true;
                    swal("Could not quote", "Could not quote, please manually price and set driver payment amount for this booking.", "warning");
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

        //TELEPHONY RELATED
        $timeout(function() {
            SignalR
                .server
                .startTelephonyEvents();
        }, 1000);

        var _pNotifications = [];
        $scope.$on('SIGNALR_ringing', function(event, data) {
            var found = _pNotifications.filter(function(dr) {
                return dr.$id == data[0].CallIdentifier;
            });
            if (!found || found.length == 0) {
                var _scope = $scope.$new();
                _scope.callData = {
                    label: "Calling...",
                    value: data[0].Caller,
                    status: 'RINGING'
                }

                _scope.removeNotification = function() {
                    this.kill(true);
                }

                _scope.chooseBookingFromCall = function(localId) {
                    return;
                    //$scope.dispatchObj.bookingSearch.$ = localId;
                }

                _scope.handleNewBooking = function(callData) {
                    $scope.phoneCall = new Model.TelephonyCall();
                    $scope.phoneCall.Caller = data[0].Caller;
                    $scope.phoneCall.CallIdentifier = data[0].CallIdentifier;
                    $http({
                        method: 'GET',
                        url: $config.API_ENDPOINT + '/api/telephony/callers-for-number',
                        params: {
                            "number": $scope.phoneCall.Caller.replaceAll(" ", "")
                        },
                        paramSerializer: '$httpParamSerializerJQLike'
                    }).then(function successCallback(response) {
                        if (response.data) {
                            response.data.Passengers.map(function(p) {
                                p.$Description = p.Name;
                                if (p.Client && p.Client.Name) {
                                    p.$Description += ' - ' + p.Client.Name;
                                }
                            });
                            $scope.listOfCallers = response.data;
                        }
                    }, function errorCallback(response) {});

                    $scope.$broadcast("CALLNEWBOOKINGREQUESTED", null);
                }

                //Get Caller Name
                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + '/api/telephony/caller-name',
                    params: {
                        "number": data[0].Caller.replaceAll(" ", "")
                    },
                    paramSerializer: '$httpParamSerializerJQLike'
                }).then(function successCallback(response) {
                    if (response.data.length > 0) {
                        _scope.callData.value = response.data;

                    }
                }, function errorCallback(response) {});

                //Check if caller has an existing booking and pull basic booking details
                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + '/api/telephony/existing-booking',
                    params: {
                        "number": data[0].Caller.replaceAll(" ", "")
                    },
                    paramSerializer: '$httpParamSerializerJQLike'
                }).then(function successCallback(response) {
                    if (response.data) {
                        _scope.callData.existingBooking = response.data;
                    }
                }, function errorCallback(response) {});

                var _not = Notification.success({ message: "Incoming Call", closeOnClick: false, templateUrl: "phone_notification_template.html", scope: _scope });
                _pNotifications.push({
                    $id: data[0].CallIdentifier,
                    $caller: data[0].Caller,
                    $notification: _not,
                    $scope: _scope
                });
                console.log(_pNotifications);
            }
        });

        $scope.$on('SIGNALR_answered', function(event, data) {
            var found = _pNotifications.filter(function(dr) {
                return dr.$id == data[0].CallIdentifier;
            });

            if (data[0].StaffId == $rootScope.STAFF_ID) {
                var callerName = found[0].$scope.callData.value;
                var existingBooking = found[0].$scope.callData.existingBooking;
                found[0].$scope.callData = {
                    label: "Talking to " + callerName,
                    value: "00:00",
                    seconds: 0,
                    status: 'ANSWERED',
                    existingBooking: existingBooking
                }
                found[0].$scope.timer = $interval(function() {
                    found[0].$scope.callData.seconds += 1;
                    found[0].$scope.callData.value = window.$utilities.secondsToHms(found[0].$scope.callData.seconds);
                }, 1000);

            } else {
                found[0].$notification.then(function(notification) {
                    notification.kill(true);
                });
            }
        });

        $scope.$on('SIGNALR_hungUp', function(event, data) {
            var found = _pNotifications.filter(function(dr) {
                return dr.$id == data[0].CallIdentifier;
            });

            if (found.length > 0) {
                found[0].$notification.then(function(notification) {
                    notification.kill(true);
                });
                _pNotifications.splice(_pNotifications.indexOf(found[0]), 1);
                $interval.cancel(found[0].$scope.timer);
            }
        });

        $scope.$on('$destroy', function() {
            SignalR
                .server
                .stopTelephonyEvents();
        });
        $scope.prefillInfoSelected = prefillInfoSelected;
        function prefillInfoSelected() {

            var selected = JSON.parse($scope._dbooking.$selectedCaller);
            if (selected.$Description) {
                $scope.fetchedPassengers.push(selected);
                $scope._dbooking.LeadPassengerId = selected.Id;
            } else {
                $scope.fetchedClients = $filter('filter')($scope.clients, {
                    Id: selected.Id
                });
                $scope._dbooking.LeadPassengerId = null;
                $scope._dbooking.ClientId = selected.Id;
            }
        }

        function handlePhoneCallNewBooking() {
            if ($scope.phoneCall) {
                $scope._dbooking.Calls = [];
                $scope._dbooking.Calls.push($scope.phoneCall)
            }
        }

        $scope.$on('CALLNEWBOOKINGREQUESTED', function() {
            handlePhoneCallNewBooking();
        });


        //TELEPHONY RELATED

        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }
    }

    function passengerFilter() {
        return function(input, searchText) {
            if (searchText.trim().length > 0) {
                input = input.filter(function(item) {
                    return ((item.Name + item.Mobile + item.Description) + "").toLowerCase().indexOf(searchText.toLowerCase()) > -1 || item.Id == "add-passenger"
                })

            }
            return input;
        }
    }
})(angular);