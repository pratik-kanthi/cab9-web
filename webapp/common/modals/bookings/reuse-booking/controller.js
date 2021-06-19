(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('BookingReuseModalController', bookingReuseModalController);

    bookingReuseModalController.$inject = ['$scope', '$UI', '$q', '$modal', '$modalInstance', '$http', '$config', 'Model', 'rBooking', 'rTaxes', 'rPassengers', 'rClients', 'Localisation', '$filter'];

    function bookingReuseModalController($scope, $UI, $q, $modal, $modalInstance, $http, $config, Model, rBooking, rTaxes, rPassengers, rClients, Localisation, $filter) {
        var rClientStaff = [];
        $scope.viewMode = 'EDIT';
        $scope.repeat = true;
        $scope.item = angular.copy(rBooking[0]);
        $scope.item.Id = null;
        $scope.item.FlightInfoId = null;
        $scope.flightData = {
            Number: ""
        };
        $scope.showInactiveReferences = false;
        var skipStopsQuoting = false; 


        $scope.item.LocalId = null;
        $scope.item.DriverId = null;
        $scope.item.VehicleId = null;
        $scope.item.DriverPaymentId = null;

        $scope.item.BookingStops = $scope.item.BookingStops.sort(function (a, b) { return a.StopOrder - b.StopOrder; });
        $scope.item.BookingStops = $scope.item.BookingStops.map(function (item) {
            item.Id = null;
            item.BookingId = null;
            return item
        });
        $scope.canQuote = true;
        $scope.item.BookingValidations = $scope.item.BookingValidations.map(function (item) {
            item.Id = null;
            item.BookingId = null;
            return item
        });
        $scope.newBooker = null;
        $scope.bookers = [];
        $scope.externalLocations = {
            knownLocations: rClients[0].KnownLocations ? rClients[0].KnownLocations : []
        };

        $scope.quoting = {};
        $scope.paxMode = {
            value: false
        };
        $scope.sortableOptions = {
            stop: function (e, ui) {},
            ondragstart: function (e, ui) {},
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
        $scope.fetchedClients = [$scope.item.Client];
        $scope.clientReferences = [];
        $scope.client = $scope.item.Client;
        $scope.taxes = rTaxes;
        $scope.searchBookers = searchBookers;
        $scope.searchPassengers = searchPassengers;
        $scope.searchClients = searchClients;
        $scope.flipAddress = flipAddress;
        setBookingDateTime(moment().add(15, 'minutes').format('YYYY-MM-DDTHH:mm'));
        $scope.fetchFlightInformation = fetchFlightInformation;
        $scope.removeFlightInfo = removeFlightInfo;
        $scope.enableChauffering = enableChauffering;
        $scope.disableChauffering = disableChauffering;

        function enableChauffering() {
            if ($scope.viewMode == 'EDIT') {
                $scope.item.ChauffeurMode = true;
                $scope.item.EstimatedMins = 60;
            }
        }

        function disableChauffering() {
            if ($scope.viewMode == 'EDIT') {
                $scope.item.ChauffeurMode = false;
                $scope.item.EstimatedMins = null;
            }
        }

        function setBookingDateTime(bookedDateTime) {
            var tz = Localisation.timeZone().getTimeZone() || "Europe/London";
            var test = moment(bookedDateTime).toDate();
            var currentOffset = test.getTimezoneOffset();
            var desiredOffset = moment.tz.zone(tz).offset(test);

            var dt = new moment.tz(bookedDateTime, 'YYYY-MM-DDTHH:mm', tz).add(currentOffset - desiredOffset, 'minutes');
            $scope.item.Date = dt.toDate();
            $scope.item.Time = dt.toDate();
        }

        if ($scope.item.FlightInfo) {
            $scope.flightData.Number = $scope.item.FlightInfo.FlightNumber;
            $scope.item.FlightInfo.Id = null;
            fetchFlightInformation();
        }

        function removeFlightInfo() {
            $scope.item.FlightInfo = null;
            $scope.item.FlightInfoId = null;
            $scope.flightData.Number = null;
        }

        function fetchFlightInformation() {
            $scope.item.FlightInfo = null;
            if ($scope.flightData.Number.length > 0) {
                $http({
                    url: $config.API_ENDPOINT + '/api/flightinfo/getflightinfo',
                    method: 'GET',
                    params: {
                        flightno: $scope.flightData.Number,
                        flightDate: getDate($scope.item.Date, $scope.item.Time)
                    }
                }).then(function (result) {
                    if (result.data) {
                        result.data.Id = null;
                        result.data.BookingId = null;
                        result.data.TenantId = null;
                        $scope.item.FlightInfo = new Model.FlightInfo(result.data);

                        var tz = Localisation.timeZone().getTimeZone();
                        var test = moment($scope.item.FlightInfo.ArrivalTime).toDate();
                        var currentOffset = test.getTimezoneOffset();
                        var desiredOffset = moment.tz.zone(tz).offset(test);

                        var dt = new moment.tz($scope.item.FlightInfo.ArrivalTime, tz).add(currentOffset - desiredOffset, 'minutes');

                        $scope.item.Time = dt.toDate();
                        $scope.timeSet = true;

                        if (result.data.SuggestedAddressId && $scope.item.BookingStops[0].$$Id != result.data.SuggestedAddressId) {
                            var $id = result.data.SuggestedAddressId;
                            Model.Location.query()
                                .where("Id eq guid'" + result.data.SuggestedAddressId + "'")
                                .execute()
                                .then(function (result) {
                                    var _bs = new Model.BookingStop();
                                    _bs.Address1 = result[0].Name ? result[0].Name : '';
                                    _bs.StopSummary = result[0].Name ? result[0].Name : '';
                                    _bs.Latitude = result[0].Latitude ? result[0].Latitude : null;
                                    _bs.Longitude = result[0].Longitude ? result[0].Longitude : null;
                                    _bs.$$Id = $id;
                                    _bs.WaitTime = $scope.item.BookingStops[0].WaitTime;
                                    center_moved = false;
                                    $scope.item.BookingStops[0] = _bs;
                                });
                        }
                    } else {
                        swal("Flight Not Found", "Please check flight number.", "warning")
                    }
                }, function (error) {
                    swal("Incorrect Flight Number", "Please check flight number.", "warning")
                });
            } else {
                swal("Incorrect Flight Number", "Please check flight number.", "warning")
            }
        }

        $scope.$watch('item.Date', function (newvalue, oldvalue) {
            if ($scope.flightData.Number && newvalue && newvalue != oldvalue) {
                fetchFlightInformation();
            }
        });

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
            if ($scope.client.ClientReferences[j].ReferenceType == "Mask") {
                $scope.client.ClientReferences[j].$testReg = _validateMask($scope.client.ClientReferences[j].Value);
            }
            if ($scope.client.ClientReferences[j].ReferenceType == "List" && $scope.client.ClientReferences[j].ShowList) {
                var ref = $scope.client.ClientReferences[j];
                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + '/api/ClientReferences/list?ClientReferenceId=' + $scope.client.ClientReferences[j].Id
                }).then(function (response) {
                    ref.$list = response.data.map(function (i) {
                        return {
                            custom: false,
                            text: i
                        };
                    });
                    if (ref.AllowAddToList) {
                        ref.$list.push({
                            custom: true,
                            text: "Add '{{$select.search}}' to References"
                        });
                    }
                });
            }
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
            Model.Client.query().select('Id,Name,AccountNo,AccountPassword,DefaultCurrencyId,ImageUrl,ClientType/Name,ClientReferences,AllVehicleTypeAccess,Phone')
                .include('ClientType,ClientReferences')
                .parseAs(function (item) {
                    this.Id = item.Id;
                    this.Name = ((item.AccountNo) ? item.AccountNo + ' - ' : '') + item.Name;
                    this.DefaultCurrencyId = item.DefaultCurrencyId;
                    this.Description = item.ClientType.Name;
                    this.Phone = item.Phone;
                    this.AccountPassword = item.AccountPassword;
                    this.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Name);
                    this.AllVehicleTypeAccess = item.AllVehicleTypeAccess;
                    this.ClientReferences = item.ClientReferences.map(function (cr) {
                        return {
                            Id: cr.Id,
                            ReferenceName: cr.ReferenceName,
                            Mandatory: cr.Mandatory,
                            AllowAddToList: cr.AllowAddToList,
                            Value: cr.Value,
                            ReferenceType: cr.ReferenceType
                        }
                    });
                }).execute().then(function (data) {
                    $scope.clients = data;
                });
            Model.VehicleType.query()
                .parseAs(function (item) {
                    this.Id = item.Id;
                    this.Name = item.Name;
                    this.Description = item.Description;
                    this.IsDefault = item.IsDefault;
                    this.ImageUrl = null;
                })
                .execute().then(function (data) {
                    if ($scope.client.AllVehicleTypeAccess) {
                        $scope.vehicleTypes = $scope._vehicleTypes = data;
                    } else {
                        $scope.vehicleTypes = $scope.client.VehicleTypes;
                    }
                });

            Model.BookingRequirement.query()
                .execute().then(function (data) {
                    $scope.bookingRequirements = $scope.unlinkedRequirements = data;
                    angular.forEach($scope.item.BookingRequirements, function (item) {
                        var found = $scope.unlinkedRequirements.filter(function (br) {
                            return br.Id == item.Id
                        });
                        if (found[0])
                            $scope.unlinkedRequirements.splice($scope.unlinkedRequirements.indexOf(found[0]), 1);
                    });
                });


            Model.ClientStaff.query()
                .filter("ClientId eq guid'" + $scope.item.ClientId + "'")
                .parseAs(function (item) {
                    this.Id = item.Id;
                    this.ClientId = item.ClientId;
                    this.Name = item.Firstname + ' ' + item.Surname;
                    //this.Description = item.Email ? item.Email : "";
                    this.Mobile = item.Mobile;
                    this.ImageUrl = $utilities.formatUrl(item.ImageUrl, item.Name);
                }).execute().then(function (data) {
                    $scope.bookers = data;
                    $scope.bookers.push({
                        Id: 'add-booker',
                        Name: 'Add Booker',
                        Description: 'Create New Booker',
                        ImageUrl: '/includes/images/add-icon.png'
                    });
                });

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
            angular.forEach($scope.item.LeadPassenger.Addresses, function (a) {
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
            var found = $scope.unlinkedRequirements.filter(function (br) {
                return br.Id == item.Id
            })
            if (found[0])
                $scope.unlinkedRequirements.splice($scope.unlinkedRequirements.indexOf(found[0]), 1)
            $scope.item.$selectedRequirement = null;
        }

        function searchClients(searchText) {
            if (searchText) {
                $scope.fetchedClients = $filter('filter')($scope.clients, {
                    Name: searchText
                });
            } else {
                $scope.fetchedClients = [];
            }
        }
        $scope.getTaxName = getTaxName;

        function getTaxName(id) {
            var found = rTaxes.filter(function (e) {
                return e.Id == id;
            })[0];
            if (found) {
                return found.Name;
            }
        }


        function removeRequirement(item) {
            $scope.unlinkedRequirements.push(item);
            var found = $scope.item.BookingRequirements.filter(function (br) {
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
                    item.$suggested = response.data.map(function (i) {
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

        $scope.$watch("item.BookingStops[0]", function (newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            if ($scope.item.WaitAndReturn) {
                var stop = new Model.BookingStop(angular.copy($scope.item.BookingStops[0]));
                stop.id = idCounter++;
                stop.Id = null;
                $scope.item.BookingStops.splice($scope.item.BookingStops.length - 1, 1, stop);
            }
        }, true);

        $scope.$watch("item.WaitAndReturn", function (newValue, oldValue) {
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
            angular.forEach($scope.item.BookingStops, function (bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });
        });

        $scope.$watch('item.Date', function (newvalue, oldvalue) {
            if ($scope.flightData.Number && newvalue && newvalue != oldvalue) {
                fetchFlightInformation();
            }
        });

        $scope.$watch("item.BookingStops", function (newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            $scope.canQuote = true;
            angular.forEach(newValue, function (bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });
            if ($scope.canQuote) {
                getQuote($scope.item);
            } else {
                $scope.item.EstimatedCost = 0;
                $scope.item.ActualCost = 0;
                $scope.quote = null;
                $scope.directions = null; 
            }
        }, true);

        $scope.$watchGroup(['item.Date', 'item.Time'], function (newValues) {
            var newDateTime = getDate(newValues[0], newValues[1]);
            if (new moment(newDateTime).isSame($scope.item.BookedDateTime)) {
                return;
            }
            $scope.item.BookedDateTime = newDateTime;

            $scope.canQuote = true;

            if (!$scope.timeSet) {
                $scope.item.FlightInfo = null;
            }
            $scope.timeSet = false;

            angular.forEach($scope.item.BookingStops, function (bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });

            if ($scope.canQuote) {
                getQuote($scope.item);
            } else {
                $scope.item.EstimatedCost = 0;
                $scope.item.ActualCost = 0;
                $scope.quote = null;
                $scope.directions = null;
            }
        });

        $scope.$watch("item.ClientStaffId", function (newvalue) {
            if (newvalue === 'add-booker') {
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/common/modals/booker/modal.html',
                    controller: 'BookerCreateController',
                    resolve: {
                        rBooker: function () {
                            var _booker = new Model.ClientStaff();
                            _booker.Phone = $scope.clients.filter(function (c) {
                                return c.Id == $scope.item.ClientId;
                            })[0].Phone;
                            _booker.ClientId = $scope.item.ClientId;
                            return _booker;
                        }
                    }
                })
                modalInstance.result.then(function (data) {
                        var d = {
                            Id: data.Id,
                            ClientId: data.ClientId,
                            Name: data.Firstname + ' ' + data.Surname,
                            Description: data.Email ? data.Email : "",
                            Mobile: data.Mobile,
                            ImageUrl: $utilities.formatUrl(data.ImageUrl, data.Name)
                        };
                        $scope.newBooker = data;
                        $scope.bookers.push(d);
                        $scope.item.ClientStaffId = data.Id;
                    },
                    function () {
                        $scope.item.ClientStaffId = null;
                    });
            }

        });

        $scope.$watchGroup(["item.AsDirected", "item.ChauffeurMode", "item.EstimatedMins", "item.ActualDistance", "item.BookingStops.length"], function (newValues, oldValues) {
            if (oldValues[0] === undefined) return;
            if ($scope.viewMode == 'VIEW') return;
            if ($scope.item.AsDirected === true) {
                $scope.item.BookingStops.length = 1;
            } else if ($scope.item.BookingStops.length == 1) {
                var stop = new Model.BookingStop();
                stop.id = idCounter++;
                $scope.item.BookingStops.push(stop);
            }

            
            $scope.canQuote = true;
            angular.forEach($scope.item.BookingStops, function (bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });

            $scope.item.EstimatedCost = 0;
            $scope.item.ActualCost = 0;
            $scope.quote = null;
            $scope.directions = null; 
            if ($scope.canQuote) {
                getQuote($scope.item);
            }
        });


        var initializing = true
        $scope.$watch("item.ClientId", function (newvalue) {
            if (initializing) {
                setTimeout(function () {
                    initializing = false;
                }, 0);
            } else {
                $scope.bookers = [{
                    Id: 'add-booker',
                    Name: 'Add Booker',
                    Description: 'Create New Booker',
                    ImageUrl: '/includes/images/add-icon.png'
                }];
                $scope.passengers = [{
                    Id: 'add-passenger',
                    Name: 'Add Passenger',
                    Description: 'Create New Passenger',
                    ImageUrl: '/includes/images/add-icon.png'
                }];
                $scope.externalLocations.knownLocations.length = 0;
                if (newvalue) {
                    $scope.item.ClientStaffId = null;
                    var found = $scope.clients.filter(function (item) {
                        return item.Id == newvalue;
                    })[0];

                    if (found.AccountPassword) {
                        swal({
                            title: "Account Password",
                            text: "This account is password enabled.",
                            type: "input",
                            showCancelButton: true,
                            closeOnConfirm: false,
                            animation: "slide-from-top",
                            inputPlaceholder: "Account Password"
                        }, function (inputValue) {
                            if (inputValue === false) {
                                $scope.item.ClientId = null;
                                $scope.$apply();
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
                    $scope.clientReferences = angular.copy(found.ClientReferences);
                    $scope.clientReferences.map(function (item) {
                        if (item.ReferenceType == "Mask")
                            item.$testReg = _validateMask(item.Value);
                        return item
                    });
                    $scope.selectedClient = found;

                    if (found) {
                        if (found.AllVehicleTypeAccess === false) {
                            Model.Client.query()
                                .where("Id eq guid'" + newvalue + "'")
                                .include('VehicleTypes')
                                .select('VehicleTypes')
                                .execute()
                                .then(function (data) {
                                    $scope.vehicleTypes = data[0].VehicleTypes.map(function (_vt) {
                                        _vt.ImageUrl = null;
                                        return _vt;
                                    });
                                    $scope.item.VehicleTypeId = $scope.filteredVehicleTypes[0].Id;
                                });
                        }
                    } else {
                        $scope.vehicleTypes = $scope._vehicleTypes;
                    }


                    Model.Client.query()
                        .where("Id eq guid'" + newvalue + "'")
                        .include('KnownLocations')
                        .select('KnownLocations,Address1,Address2,Area,TownCity,County,Postcode,Country,Latitude,Longitude,BillingAddress1,BillingAddress2,BillingArea,BillingTownCity,BillingCounty,BillingPostcode,BillingCountry,BillingLatitude,BillingLongitude')
                        .execute()
                        .then(function (data) {
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
                    $scope.item.ClientStaffId = null;
                    $scope.item.LeadPassengerId = null;
                    $scope.fetchedClients = [];
                    $scope.clientReferences.length = 0;
                    $scope.selectedClient = null;
                }
                if ($scope.item.ClientId) {
                    var client = $scope.clients.filter(function (c) {
                        return c.Id == $scope.item.ClientId
                    })[0];
                    if (client) {
                        $scope.item.CurrencyId = client.DefaultCurrencyId;
                    }
                } else {
                    $scope.item.CurrencyId = $scope.COMPANY.DefaultCurrencyId;
                }
            }
        }, true);

        $scope.passengers = rPassengers;
        $scope.passengers.push({
            Id: 'add-passenger',
            Name: 'Add Passenger',
            Description: 'Create New Passenger',
            ImageUrl: '/includes/images/add-icon.png'
        });

        $scope.bookers = rClientStaff;
        $scope.bookers.push({
            Id: 'add-booker',
            Name: 'Add Booker',
            Description: 'Create New Booker',
            ImageUrl: '/includes/images/add-icon.png'
        });

        function searchPassengers(searchText) {
            $scope.passengers.length = 0;
            $http.get($config.API_ENDPOINT + "api/Passengers/Search", {
                params: {
                    searchText: searchText,
                    clientId: $scope.item.ClientId
                }
            }).success(function (data) {
                angular.forEach(data, function (item) {
                    if (item.Client) {
                        item.Client.ImageUrl = $utilities.formatUrl(item.Client.ImageUrl, item.Client.Name);
                    }
                    $scope.passengers.push({
                        Id: item.Id,
                        ClientId: item.ClientId,
                        Name: item.Firstname + ' ' + item.Surname,
                        Description: ((item.Client && item.Client.Name) ? item.Client.Name : 'No Client'),
                        Mobile: item.Mobile,
                        Addresses: item.Addresses,
                        ImageUrl: $utilities.formatUrl(item.ImageUrl, item.Firstname)
                    });
                });
                $scope.passengers.push({
                    Id: 'add-passenger',
                    Name: 'Add Passenger',
                    Description: 'Create New Passenger',
                    ImageUrl: '/includes/images/add-icon.png'
                });
            });
        }
        
        function searchBookers(searchText) {
            if ($scope.item.ClientId) {
                $scope.bookers.length = 0;
                $http.get($config.API_ENDPOINT + "api/Bookers/Search", {
                    params: {
                        searchText: searchText,
                        clientId: $scope.item.ClientId
                    }
                }).success(function (data) {
                    angular.forEach(data, function (item) {
                        if (item.Client) {
                            item.Client.ImageUrl = $utilities.formatUrl(item.Client.ImageUrl, item.Client.Name);
                        }
                        $scope.bookers.push({
                            Id: item.Id,
                            ClientId: item.ClientId,
                            Name: item.Firstname + ' ' + item.Surname,
                            Description: ((item.Client && item.Client.Name) ? item.Client.Name : 'No Client'),
                            Mobile: item.Mobile,
                            ImageUrl: $utilities.formatUrl(item.ImageUrl, item.Firstname)
                        });
                    });
                    $scope.bookers.push({
                        Id: 'add-booker',
                        Name: 'Add Booker',
                        Description: 'Create New Booker',
                        ImageUrl: '/includes/images/add-icon.png'
                    });
                });
            }
        }

        $scope.$watch("selectedPassenger.Mobile", function (newvalue) {
            $scope.item.PassengerNotificationPhone = newvalue;
        });
        $scope.$watch("item.LeadPassengerId", function (newvalue) {
            if (newvalue === 'add-passenger') {
                $scope.item.LeadPassengerId = null;
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/common/modals/passenger/create.modal.html',
                    controller: 'PassengerItemCreateModalController',
                    resolve: {
                        rClientId: function () {
                            return $scope.item.ClientId;
                        },
                        rNavigateAfterSave: function () {
                            return false;
                        }
                    }
                });
                modalInstance.result.then(function (data) {
                        var d = {
                            Id: data.Id,
                            ClientId: data.ClientId,
                            Name: data.Firstname + ' ' + data.Surname,
                            Description: data.Email ? data.Email : "",
                            Mobile: data.Mobile,
                            ImageUrl: $utilities.formatUrl(data.ImageUrl, data.Name)
                        };
                        $scope.passengers.push(d);
                        $scope.item.ClientId = data.ClientId;
                        $scope.item.LeadPassengerId = data.Id;
                    },
                    function () {

                    });
                return;
            }
            var b = $scope.item;
            if (newvalue) {
                var found = $scope.passengers.filter(function (item) {
                    return item.Id == newvalue;
                })[0];
                $scope.selectedPassenger = found;
                b.ClientId = found.ClientId;
                b.PassengerNotificationPhone = found.Mobile;
                angular.forEach(found.Addresses, function (a) {
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

        $scope.$watch("item.VehicleTypeId", function (newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            $scope.canQuote = true;

            angular.forEach($scope.item.BookingStops, function (bs, $index) {
                if (!bs.Latitude || !bs.Longitude) {
                    $scope.canQuote = false;
                }
            });

            if ($scope.canQuote) {
                getQuote($scope.item);
            } else {
                $scope.item.EstimatedCost = 0;
                $scope.item.ActualCost = 0;
                $scope.quote = null;
                $scope.directions = null; 
            }
        });

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

        function getQuote(booking) {
            booking.BookedDateTime = getDate($scope.item.Date, $scope.item.Time);
            booking.BookingStatus = 'Incoming';
            $scope.quoting.inprogress = true;
            for (var i = 0; i < $scope.item.BookingStops.length; i++) {
                $scope.item.BookingStops[i].StopOrder = i + 1;
            }
            skipStopsQuoting = true; 
            $http.post($config.API_ENDPOINT + 'api/quote', booking)
                .success(function (result) {
                    if (!result.Error) {
                        booking.EstimatedCost = result.FinalCost;
                        booking.EstimatedDistance = result.EstimatedDistance.toFixed(2);
                        booking.EstimatedDuration = result.EstimatedMins;
                        booking.ActualCost = result.FinalCost;
                        if (result.Directions) {
                            booking.EncodedRoute = result.Directions.EncodedRoute;
                        } else {
                            booking.EncodedRoute = '';
                        }
                        $scope.directions = result.Directions;
                    } else {
                        booking.EstimatedCost = 0;
                        booking.EstimatedDistance = 0;
                        booking.EstimatedDuration = 0;
                        booking.ActualCost = 0;
                        $scope.directions = null;
                        booking.EncodedRoute = '';
                    }
                    $scope.quote = result;
                    $scope.quoting.inprogress = false;
                }).error(function (error) {
                    $scope.quoting.inprogress = false;
                    console.log(error);
                    swal("Could not quote", "Could not quote, please manually price and set driver payment amount for this booking.", "warning");
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

        function save() {
            $("#bookingsave").prop("disabled", true);
            var promises = [];
            if ($scope.newBooker && $scope.newBooker.Id == $scope.item.ClientStaffId) {
                $scope.newBooker.Passengers = [];
                $scope.newBooker.Passengers.push($scope.item.LeadPassenger);
                $http.post($config.API_ENDPOINT + "api/ClientStaff/ManagePassengers", $scope.newBooker).then(function (response) {}, function (err) {
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
            promises.push($scope.item.$save());
            $q.all(promises).then(function (result) {
                var id = result[result.length - 1].data.LocalId;
                swal({
                    title: "Booking Saved.",
                    text: "Booking Reference: #" + id,
                    type: "success",
                    showCancelButton: false,
                    confirmButtonColor: $UI.COLOURS.brandPrimary,
                    confirmButtonText: "Okay",
                    closeOnConfirm: true
                }, function () {
                    window.close();
                });
                //                swal({
                //                    title: "Booking Saved.",
                //                    text: "Booking Reference: #" + id,
                //                    type: "success",
                //                    confirmButtonColor: $UI.COLOURS.brandSecondary
                //                });
            }, function (error) {
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