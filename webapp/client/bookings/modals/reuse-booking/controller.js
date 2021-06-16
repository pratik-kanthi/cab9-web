(function(angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientBookingReuseModalController', clientBookingReuseModalController);

    clientBookingReuseModalController.$inject = ['$scope', '$rootScope', '$UI', '$q', '$modal', '$modalInstance', '$http', '$config', 'Model', 'rBooking', 'rTaxes', 'rPassengers', 'Localisation', '$filter'];

    function clientBookingReuseModalController($scope, $rootScope, $UI, $q, $modal, $modalInstance, $http, $config, Model, rBooking, rTaxes, rPassengers, Localisation, $filter) {
        $scope.item = angular.copy(rBooking[0]);
        $scope.item.FlightInfo = null;
        $scope.item.FlightInfoId = null;

        $scope.isAdmin = $rootScope.PERMISSIONS.role.Name.toLowerCase() == 'super admin';
        $scope.client = $scope.item.Client;
        $scope.item.BookingStops = $scope.item.BookingStops.map(function(item) {
            item.Id = null;
            item.BookingId = null;
            return item
        });
        $scope.canQuote = true;
        $scope.item.BookingValidations = $scope.item.BookingValidations.map(function(item) {
            item.Id = null;
            item.BookingId = null;
            return item
        });
        $scope.newBooker = null;
        $scope.bookers = [];
        $scope.externalLocations = {
            knownLocations: []
        };
        $scope.paxMode = {
            value: false
        };
        $scope.sortableOptions = {
            stop: function(e, ui) {},
            ondragstart: function(e, ui) {},
            disabled: $scope.item.BookingStops.length > 2 ? false : true
        };
        $scope.removeStop = removeStop;
        $scope.bookingInfo = true;
        $scope.save = save;
        $scope.close = close;
        $scope.formFor = {}
        $scope.testMaskReferences = testMaskReferences;
        $scope.reverseStops = reverseStops;
        $scope.suggestReferences = suggestReferences;
        $scope.addRequirement = addRequirement;
        $scope.removeRequirement = removeRequirement;
        $scope.clientReferences = [];
        $scope.fetchedPassengers = rPassengers;
        $scope.taxes = rTaxes;
        $scope.searchBookers = searchBookers;
        $scope.searchPassengers = searchPassengers;
        $scope.flipAddress = flipAddress;
        setBookingDateTime(moment().add(15, 'minutes').format('YYYY-MM-DDTHH:mm'));

        function setBookingDateTime(bookedDateTime) {
            var tz = Localisation.timeZone().getTimeZone();
            var test = moment(bookedDateTime).toDate();
            var currentOffset = test.getTimezoneOffset();
            var desiredOffset = moment.tz.zone(tz).offset(test);

            var dt = new moment.tz(bookedDateTime, 'YYYY-MM-DDTHH:mm', tz).add(currentOffset - desiredOffset, 'minutes');
            $scope.item.Date = dt.toDate();
            $scope.item.Time = dt.toDate();
        }


        for (j = 0, leng = $scope.client.ClientReferences.length; j < leng; j++) {
            for (i = 0, len = $scope.item.BookingValidations.length; i < len; i++) {
                if ($scope.client.ClientReferences[j].Id == $scope.item.BookingValidations[i].ClientReferenceId) {
                    $scope.client.ClientReferences[j].$knownValue = $scope.item.BookingValidations[i].Value;
                    $scope.client.ClientReferences[j].$id = $scope.item.BookingValidations[i].Id
                    if ($scope.client.ClientReferences[j].ReferenceType == "List") {
                        var x = {
                            custom: false,
                            text: $scope.item.BookingValidations[i].Value
                        };
                        $scope.client.ClientReferences[j].$knownValue = x;
                        $scope.client.ClientReferences[j].$originalValue = x;
                        $scope.client.ClientReferences[j].$suggested = [x];
                    }
                }
            }
            if ($scope.client.ClientReferences[j].ReferenceType == "Mask")
                $scope.client.ClientReferences[j].$testReg = _validateMask($scope.client.ClientReferences[j].Value);
            $scope.clientReferences.push($scope.client.ClientReferences[j]);

        }
        initialize();

        function removeStop($index) {
            if ($scope.item.WaitAndReturn && $scope.item.BookingStops.length < 4) {
                swal("Cannot remove via Stop", "WaitAndReturn booking should have a via stop", "warning")
            } else
                $scope.item.BookingStops.splice($index, 1)
            if ($scope.item.BookingStops.length < 3)
                $scope.sortableOptions.disabled = true;
        }

        function initialize() {
            Model.VehicleType.query()
                .parseAs(function(item) {
                    this.Id = item.Id;
                    this.Name = item.Name;
                    this.Description = item.Description;
                    this.IsDefault = item.IsDefault;
                    this.ImageUrl = null;
                })
                .execute().then(function(data) {
                    if ($scope.client.AllVehicleTypeAccess) {
                        $scope.vehicleTypes = $scope._vehicleTypes = data;
                    } else {
                        $scope.vehicleTypes = $scope.client.VehicleTypes;
                    }
                });

            Model.BookingRequirement.query()
                .execute().then(function(data) {
                    $scope.bookingRequirements = $scope.unlinkedRequirements = data;
                    angular.forEach($scope.item.BookingRequirements, function(item) {
                        var found = $scope.unlinkedRequirements.filter(function(br) {
                            return br.Id == item.Id
                        });
                        if (found[0])
                            $scope.unlinkedRequirements.splice($scope.unlinkedRequirements.indexOf(found[0]), 1);
                    });
                });

            if ($scope.isAdmin) {
                $scope.passengers = rPassengers;
                $scope.fetchedPassengers = $scope.passengers;
                Model.ClientStaff.query().where("ClientId eq guid'" + $scope.item.ClientId + "'").select('Id,Firstname,Surname,ImageUrl,Mobile,AllPassengers,Passengers,ClientId,Client/Name').include('Client,Passengers').parseAs(function(item) {
                    this.Id = item.Id;
                    this.ClientId = item.ClientId;
                    this.Name = item.Firstname + ' ' + item.Surname;
                    this.Description = (item.Client && item.Client.Name) ? item.Client.Name : 'No Client';
                    this.AllPassengers = item.AllPassengers;
                    this.Passengers = item.Passengers;
                    this.Mobile = item.Mobile;
                    this.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Firstname);
                }).execute().then(function(data) {
                    $scope.bookers = data;
                    $scope.filteredBookers = $scope.bookers;
                });
            } else {
                Model.ClientStaff.query()
                    .filter("Id eq guid'" + $scope.item.ClientStaffId + "'")
                    .include("Passengers/Client")
                    .execute().then(function(response) {
                        if (response[0].AllPassengers) {
                            $scope.passengers = rPassengers;
                            $scope.fetchedPassengers = $scope.passengers;
                        } else {
                            $scope.passengers = response[0].Passengers.map(function(item) {
                                var a = {};
                                a.Id = item.Id;
                                a.ClientId = item.ClientId;
                                a.Name = item.Firstname + ' ' + item.Surname;
                                a.Description = (item.Client && item.Client.Name) ? item.Client.Name : 'No Client';
                                a.Mobile = item.Mobile;
                                a.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Firstname);
                                a.Addresses = item.Addresses;
                                return a;
                            });
                            $scope.fetchedPassengers = $scope.passengers;

                        }
                    });

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
            $scope.item.CurrencyId = $scope.client.DefaultCurrencyId;
            angular.forEach($scope.item.LeadPassenger.Addresses, function(a) {
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


        }

        function addRequirement(item) {
            $scope.item.BookingRequirements.push(item);
            var found = $scope.unlinkedRequirements.filter(function(br) {
                return br.Id == item.Id
            })
            if (found[0])
                $scope.unlinkedRequirements.splice($scope.unlinkedRequirements.indexOf(found[0]), 1)
            $scope.item.$selectedRequirement = null;
        }


        $scope.getTaxName = getTaxName;

        function getTaxName(id) {
            var found = rTaxes.filter(function(e) {
                return e.Id == id;
            })[0];
            if (found) {
                return found.Name;
            }
        }


        function removeRequirement(item) {
            $scope.unlinkedRequirements.push(item);
            var found = $scope.item.BookingRequirements.filter(function(br) {
                return br.Id == item.Id
            })
            if (found[0])
                $scope.item.BookingRequirements.splice($scope.item.BookingRequirements.indexOf(found[0]), 1)
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
                    if (item.$originalValue) {
                        item.$suggested.unshift(item.$originalValue);
                    }
                    if (item.AllowAddToList) {
                        item.$suggested.push({
                            custom: true,
                            text: "Add '{{$select.search}}' to References"
                        });
                    }
                }, function errorCallback(response) {
                    item.$suggested = [item.$originalValue];
                });
            } else {
                item.$suggested = [item.$originalValue];
            }
        }

        function _validateMask(mask) {
            var lower = '[a-z]';
            var upper = '[A-Z]';
            var numeric = '[0-9]';
            var regString = '^';
            var currentCase = 0;
            var mandatoryChar = false;
            for (var i = 0; i < mask.length; i++) {
                var c = mask[i];
                if (c === '>') {
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
            if (!mandatoryChar) {
                throw 'Bad Mask - Must contain at least 1 mandatory symbol (A, L, 0)';
            }
            regString += '$';
            return new RegExp(regString);
        }

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

        function close() {
            window.close();
        }

        function flipAddress() {
            var firstStop = $scope.item.BookingStops[0];
            $scope.item.BookingStops[0] = $scope.item.BookingStops[1];
            $scope.item.BookingStops[1] = firstStop;
        }

        $scope.addTime = addTime;
        $scope.addStop = addStop;

        $scope.$watch("item.BookingStops[0]", function(newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            if ($scope.item.WaitAndReturn) {
                var stop = new Model.BookingStop(angular.copy($scope.item.BookingStops[0]));
                stop.id = idCounter++;
                stop.Id = null;
                $scope.item.BookingStops.splice($scope.item.BookingStops.length - 1, 1, stop);
            }
        }, true);

        $scope.$watchGroup(['item.Date', 'item.Time'], function (newValues) {
            $scope.item.BookedDateTime = getDate(newValues[0], newValues[1]);
        });

        $scope.$watch("item.WaitAndReturn", function(newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            if (newValue === false) {
                $scope.item.BookingStops.splice($scope.item.BookingStops.length - 1, 1);
                var stop = new Model.BookingStop();
                stop.id = idCounter++;
                $scope.item.BookingStops.push(stop);
            } else if (newValue === true) {
                var stop = new Model.BookingStop(angular.copy($scope.item.BookingStops[0]));
                stop.id = idCounter++;
                stop.Id = null;
                $scope.item.BookingStops.push(stop);
            }
            $scope.canQuote = true;
            angular.forEach($scope.item.BookingStops, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });
        });

        $scope.$watch("item.BookingStops", function(newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            $scope.canQuote = true;
            angular.forEach(newValue, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });
            if ($scope.canQuote) {
                getQuote($scope.item);
            } else {
                $scope.item.EstimatedCost = 0;
                $scope.item.ActualCost = 0;
            }
        }, true);

        $scope.$watch("item.ClientStaffId", function(newvalue) {
            if (newvalue === 'add-booker') {
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/common/modals/booker/modal.html',
                    controller: 'BookerCreateController',
                    resolve: {
                        rBooker: function() {
                            var _booker = new Model.ClientStaff();
                            _booker.Phone = $scope.clients.filter(function(c) {
                                return c.Id == $scope.item.ClientId;
                            })[0].Phone;
                            _booker.ClientId = $scope.item.ClientId;
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
                        $scope.item.ClientStaffId = data.Id;
                    },
                    function() {
                        $scope.item.ClientStaffId = null;
                    });
            }

        });

        $scope.$watch("item.AsDirected", function(newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            if (newValue === true) {
                $scope.item.BookingStops.length = 1;
            } else if (newValue === false) {
                var stop = new Model.BookingStop();
                stop.id = idCounter++;
                $scope.item.BookingStops.push(stop);
            }
            $scope.item.EstimatedCost = 0;
            $scope.item.ActualCost = 0;
            $scope.canQuote = true;
            angular.forEach($scope.item.BookingStops, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });

            if ($scope.canQuote) {
                getQuote($scope.item);
            }
        });

        function searchPassengers(searchText) {
            if (searchText) {
                $scope.fetchedPassengers = $filter('filter')($scope.passengers, {
                    Name: searchText
                });
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
                $scope.filteredBookers = $filter('filter')($scope.bookers, {
                    Name: searchText
                });
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

        $scope.$watch("item.LeadPassengerId", function(newvalue) {
            if (newvalue === 'add-passenger') {
                $scope.item.LeadPassengerId = null;
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/common/modals/passenger/create.modal.html',
                    controller: 'PassengerItemCreateModalController',
                    resolve: {
                        rClientId: function() {
                            return $scope.item.ClientId;
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
                            ImageUrl: $utilities.formatUrl(data.ImageUrl, data.Name)
                        };
                        $scope.newPassenger = data;
                        $scope.fetchedPassengers.push(d);
                        $scope.item.ClientId = data.ClientId;
                        $scope.item.LeadPassengerId = data.Id;
                    },
                    function() {

                    });
                return;
            }
            var b = $scope.item;
            if (newvalue) {
                var found = $scope.passengers.filter(function(item) {
                    return item.Id == newvalue;
                })[0];
                b.ClientId = found.ClientId;
                b.PassengerNotificationPhone = found.Mobile;
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
            } else {

                b.PassengerNotificationPhone = null;
            }
        });

        $scope.$watch("item.VehicleTypeId", function(newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            $scope.canQuote = true;

            angular.forEach($scope.item.BookingStops, function(bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });

            if ($scope.canQuote) {
                getQuote($scope.item);
            } else {
                $scope.item.EstimatedCost = 0;
                $scope.item.ActualCost = 0;
            }
        });

        function getQuote(booking) {
            booking.BookedDateTime = getDate($scope.item.Date, $scope.item.Time);
            booking.BookingStatus = 'Incoming';
            $http.post($config.API_ENDPOINT + 'api/quote', booking)
                .success(function(result) {
                    booking.EstimatedCost = result.FinalCost;
                    booking.EstimatedDistance = result.EstimatedDistance.toFixed(2);
                    booking.EstimatedDuration = result.EstimatedMins;
                    booking.ActualCost = result.FinalCost;
                }).error(function(error) {
                    console.log(error);
                });
        }


        function addStop($index) {
            var stop = new Model.BookingStop();
            stop.id = idCounter++;
            if ($scope.item.WaitAndReturn)
                $scope.item.BookingStops.splice($index, 0, stop);
            else
                $scope.item.BookingStops.splice($index + 1, 0, stop);
            if ($scope.item.BookingStops.length > 2)
                $scope.sortableOptions.disabled = false;
        }

        function addTime(min, period) {
            var tz = Localisation.timeZone().getTimeZone();
            var currentOffset = new Date().getTimezoneOffset();
            var desiredOffset = moment.tz.zone(tz).offset(new Date());
            var dt = new moment.tz(tz).add(currentOffset - desiredOffset, 'minutes');

            if (period == 'day') {
                $scope.item.Date = dt.add(min, 'minutes').toDate();
            } else if (period == 'time') {
                $scope.item.Time = dt.startOf('minute').add(min, 'minutes').toDate();
            }
        }

        function reverseStops() {
            $scope.item.BookingStops.reverse();
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

        function save() {
            $("#bookingsave").prop("disabled", true);
            var promises = [];
            if ($scope.newBooker && $scope.newBooker.Id == $scope.item.ClientStaffId) {
                $scope.newBooker.Passengers = [];
                $scope.newBooker.Passengers.push($scope.item.LeadPassenger);
                $http.post($config.API_ENDPOINT + "api/ClientStaff/ManagePassengers", $scope.newBooker).then(function(response) {}, function(err) {
                    swal({
                        title: "Error adding passenger to booker",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                });
            } else if ($scope.newPassenger && $scope.newPassenger.Id == $scope.item.LeadPassengerId) {
                $scope.selectedBooker.Passengers.push($scope.selectedPassenger);
                $http.post($config.API_ENDPOINT + "api/ClientStaff/ManagePassengers", $scope.selectedBooker).then(function(response) {}, function(err) {
                    swal({
                        title: "Error adding passenger to booker",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                });
            }
            var b = $scope.item;
            if ($scope.paxMode.value) {
                if (!b._LeadPassenger) {
                    swal('Invalid', 'Please add passenger details.', 'error');
                    return;
                }
                var split = b._LeadPassenger.split(' ');
                $scope.item.LeadPassenger = {
                    Firstname: split[0],
                    Surname: split.slice(1).join(' '),
                    Mobile: b._LeadPassengerNumber,
                    ClientId: b.ClientId
                };
            }
            $scope.item.BookingValidations = [];
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
                        $scope.item.BookingValidations.push(_cr);
                }
            }

            $scope.item.BookedDateTime = getDate($scope.item.Date, $scope.item.Time);

            $scope.item.LeadPassenger = undefined;
            $scope.item.Client = undefined;
            $scope.item.Driver = undefined;
            $scope.item.VehicleType = undefined;
            $scope.item.Currency = undefined;
            $scope.item.BookingSource = 'CLIENT_PORTAL';
            promises.push($scope.item.$save());
            $q.all(promises).then(function(result) {
                var id = result[result.length - 1].data.LocalId;
                swal({
                    title: "Booking Saved.",
                    text: "Booking Reference: #" + id,
                    type: "success",
                    showCancelButton: false,
                    confirmButtonColor: $UI.COLOURS.brandPrimary,
                    confirmButtonText: "Okay",
                    closeOnConfirm: true
                }, function() {
                    window.close();
                });
            }, function(error) {
                $scope.dataReady = true;
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error"
                });
            });
        }
    }
}(angular));
