(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('BookingEditModalController', bookingEditModalController);

    bookingEditModalController.$inject = ['$scope', '$UI', '$modal', '$modalInstance', '$http', '$config', '$rootScope', 'Auth', 'Model', 'rBooking', 'rMode', 'rTaxes', 'rExpenseTypes', 'rClients', 'rPassengers', 'rClientStaff', 'Localisation', '$location', 'rTags'];

    function bookingEditModalController($scope, $UI, $modal, $modalInstance, $http, $config, $rootScope, Auth, Model, rBooking, rMode, rTaxes, rExpenseTypes, rClients, rPassengers, rClientStaff, Localisation, $location, rTags) {
        $scope.item = rBooking[0];
        $scope.item.BookingStops = $scope.item.BookingStops.sort(function (a, b) { return a.StopOrder - b.StopOrder; });
        $scope.bookingTags = $scope.unlinkedTags = rTags;
        $scope.Tags = [];
        setBookingTags($scope.item.BookingTags);
        
        if ($scope.item.Priority) {
            var p = ['P1', 'P2', 'P3', 'P4', 'P5'].indexOf('P' + $scope.item.Priority) + 1;
            $scope.item.Priority = p.toFixed(0);
        } else {
            $scope.item.Priority = "P1";
        }

        $http.get($config.API_ENDPOINT + 'api/DispatchSettings').then(function (s) {
            if (s.data[0]) {
                $scope.dispatchSettings = s.data[0];
            }
        });

        if($scope.item.DispatchDateTime) {
            $scope.item._AutoDispatchOffset = moment($scope.item.BookedDateTime).diff(moment($scope.item.DispatchDateTime), 'minutes');
        } else {
            $scope.item._AutoDispatchOffset = 15;
        }

        $scope.mode = rMode;
        $scope.showInactiveReferences = false;
        var skipStopsQuoting = false; 

        $scope.lock = {
            current: null
        };
        $scope.quoting = {};
        $scope.events = {};
        $scope.noHistory = false;
        $scope.noMoreHistory = false;
        $scope.historyPage = 1;
        $scope.fetchMoreHistory = fetchMoreHistory;
        $scope.enableChauffering = enableChauffering;
        $scope.disableChauffering = disableChauffering;
        $scope.updateCost = updateCost;
        $scope.applyCoupon = applyCoupon;


        $scope.iconsIndex = {
            "N/A": "assignment",
            "Booking Offer Sent": "assignment",
            "Booking Created": "assignment",
            "FlightTrackingStarted": "flight_land",
            "FlightTrackingStopped": "flight_land",
            "SMS Confirmation": "insert_comment",
            "Email Client Confirmation": "email",
            "Email Booker Confirmation": "email",
            "SMS Driver Arrived": "insert_comment",
            "Call Driver Arrived": "phone",
            "Email Manual Confirmation": "email",
            "Driver Read Offer": "person_pin",
            "Driver Accepted": "person_pin",
            "DriverUpdate": "person_pin",
            "Driver Rejected": "person_pin",
            "Driver Allocated": "person_pin",
            "Booking Offered To Driver": "person_pin",
            "Booking Pre Allocated To Driver": "person_pin",
            "Booking Patched": "assignment",
            "Booking Edited": "assignment",
            "DriverPaymentIssued": "account_balance_wallet",
            "DriverPaymentGenerated": "account_balance_wallet",
            "DriverPaymentCancelled": "account_balance_wallet",
            "ClientInvoiceIssued": "check_circle",
            "ClientInvoiceCancelled": "check_circle",
            "Flight Update": "flight_land",
            "Repricing": "border_color"
        }

        $scope.coloursIndex = {
            "N/A": "orange-bg",
            "Booking Offer Sent": "green-bg",
            "Booking Created": "green-bg",
            "FlightTrackingStarted": "green-bg",
            "FlightTrackingStopped": "red-bg",
            "SMS Confirmation": "green-bg",
            "Email Client Confirmation": "green-bg",
            "Email Booker Confirmation": "green-bg",
            "SMS Driver Arrived": "green-bg",
            "Call Driver Arrived": "green-bg",
            "Email Manual Confirmation": "orange-bg",
            "Driver Read Offer": "green-bg",
            "Driver Accepted": "green-bg",
            "DriverUpdate": "green-bg",
            "Driver Rejected": "orange-bg",
            "Driver Allocated": "green-bg",
            "Booking Offered To Driver": "green-bg",
            "Booking Pre Allocated To Driver": "green-bg",
            "Booking Patched": "orange-bg",
            "Booking Edited": "orange-bg",
            "DriverPaymentIssued": "green-bg",
            "DriverPaymentGenerated": "green-bg",
            "DriverPaymentCancelled": "red-bg",
            "ClientInvoiceIssued": "green-bg",
            "ClientInvoiceCancelled": "red-bg",
            "Flight Update": "orange-bg",
            "Repricing": "orange-bg"
        }

        $scope.item.BookingExpense = $scope.item.BookingExpense.map(function (ex) { return new Model.BookingExpense(ex); });

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
        
        

        fetchHistoryPage(1);
        function fetchHistoryPage(page) {
            var top = 10;
            var skip = (page - 1) * top;
            $http.get($config.API_ENDPOINT + 'api/Audit/ForBooking', {
                params: {
                    bookingId: $scope.item.Id,
                    top: top,
                    skip: skip
                }
            }).success(function (data) {
                if (page == 1 && data.length == 0) {
                    $scope.noHistory = true;

                }
                if (data.length < top || data[data.length - 1].BookingEvent == 'Booking Created') {
                    $scope.noMoreHistory = true;
                }
                angular.forEach(data, function (x) {
                    var date = moment(x.Timestamp).format('DD MMM');
                    if (!$scope.events[date]) {
                        $scope.events[date] = [];
                    }
                    $scope.events[date].push(new Model.AuditRecord(x));
                });
            });
        }

        function fetchMoreHistory() {
            $scope.historyPage++;
            fetchHistoryPage($scope.historyPage);
        }

        var session = Auth.getSession();
        var originalIds = $scope.item.BookingStops.map(function (bs) {
            return bs.Id;
        });

        $http.get($config.API_ENDPOINT + 'api/bookings/IsLocked', {
            params: {
                bookingId: $scope.item.Id
            }
        }).success(function (response) {
            if (response.status == 'LockOwned') {
                $scope.viewMode = 'EDIT';
                $scope.lock.current = {
                    self: true,
                    expires: response.expires
                };
            } else if (response.status == 'Locked') {
                $scope.lock.current = {
                    self: false,
                    user: response.user,
                    expires: response.expires
                };
            } else {
                $scope.lock.current = null;
            }
        }).error(function () {
            swal('Error!', "Unknown error occured.", 'error');
            });

        function setBookingDateTime(bookedDateTime) {
            var tz = Localisation.timeZone().getTimeZone() || "Europe/London";
            var test = moment(bookedDateTime).toDate();
            var currentOffset = test.getTimezoneOffset();
            var desiredOffset = moment.tz.zone(tz).offset(test);

            var dt = new moment.tz(bookedDateTime, tz).add(currentOffset - desiredOffset, 'minutes');

            
            if ($scope.item.FlightInfo) {
                $scope.item.Date = new moment($scope.item.FlightInfo.ScheduledArrivalTime).toDate();
            } else {
                $scope.item.Date = dt.toDate();
            }
            $scope.item.Time = dt.toDate();
        }

        function setBookingTags(tags) {
            angular.forEach(tags, function(tag) {
                var item = $scope.unlinkedTags.find(function(res) {
                    return res.Id == tag.TagId;
                })
                if(item)
                    item.Type = tag.Type;
                $scope.Tags.push(item);
                $scope.unlinkedTags.splice($scope.unlinkedTags.indexOf(item), 1);
            })
        }

        $scope.$on('SIGNALR_updateBooking', function (event, args) {
            var update = args[0];
            $scope.item.BookingStatus = update.BookingStatus;
            $scope.$apply();
        });

        $scope.$on('SIGNALR_lockCleared', function (event, data) {
            var update = data[0];
            if ($scope.lock.saved) {
                $scope.lock.saved = false;
                $scope.lock.current = null;
            } else if (update.BookingId == $scope.item.Id) {
                $scope.lock.current = null;
                if ($scope.viewMode == 'EDIT') {
                    $scope.viewMode = 'VIEW';
                    swal('Lock Expired!', "Booking Lock has expired.", 'error');
                    Model.Booking.query()
                        .include('Driver,Client,Vehicle,FlightInfo,BookingStops,Invoice,BookingStops/PassengerStops,Passengers,BookingValidations,LeadPassenger,Currency,BookingRequirements,BookingExpense,BookingExpense/BookingExpenseType,BookingExpense/Tax') //Notifications
                        .where("Id eq guid'" +$scope.item.Id + "'")
                        .trackingEnabled()
                        .execute().then(function (data) {
                            $scope.item = data[0];
                            $scope.item.BookingStops = $scope.item.BookingStops.sort(function (a, b) { return a.StopOrder - b.StopOrder; });
                            $scope.item.BookingExpense = $scope.item.BookingExpense.map(function (ex) { return new Model.BookingExpense(ex); });
                            setBookingDateTime($scope.item.BookedDateTime);

                            if ($scope.item.FlightInfo) {
                                $scope.flightData.Number = $scope.item.FlightInfo.FlightNumber;
                            }

                            if ($scope.item.Priority) {
                                var p = ['P1', 'P2', 'P3', 'P4', 'P5'].indexOf('P' + $scope.item.Priority) + 1;
                                $scope.item.Priority = p.toFixed(0);
                            } else {
                                $scope.item.Priority = "P1";
                            }
                    
                            if($scope.item.DispatchDateTime) {
                                $scope.item._AutoDispatchOffset = moment($scope.item.BookedDateTime).diff(moment($scope.item.DispatchDateTime), 'minutes');
                            } else {
                                $scope.item._AutoDispatchOffset = 15;
                            }
                    
                        });
                    
                } else {
                    Model.Booking.query()
                        .include('Driver,Client,Vehicle,FlightInfo,BookingStops,Invoice,BookingStops/PassengerStops,Passengers,BookingValidations,LeadPassenger,Currency,BookingRequirements,BookingExpense,BookingExpense/BookingExpenseType,BookingExpense/Tax') //Notifications
                        .where("Id eq guid'" + $scope.item.Id + "'")
                        .trackingEnabled()
                        .execute().then(function (data) {
                            $scope.item = data[0];
                            $scope.item.BookingStops = $scope.item.BookingStops.sort(function (a, b) { return a.StopOrder - b.StopOrder; });
                            $scope.item.BookingExpense = $scope.item.BookingExpense.map(function (ex) { return new Model.BookingExpense(ex); });
                            setBookingDateTime($scope.item.BookedDateTime);

                            if ($scope.item.FlightInfo) {
                                $scope.flightData.Number = $scope.item.FlightInfo.FlightNumber;
                            }

                            if ($scope.item.Priority) {
                                var p = ['P1', 'P2', 'P3', 'P4', 'P5'].indexOf('P' + $scope.item.Priority) + 1;
                                $scope.item.Priority = p.toFixed(0);
                            } else {
                                $scope.item.Priority = "P1";
                            }
                    
                            if($scope.item.DispatchDateTime) {
                                $scope.item._AutoDispatchOffset = moment($scope.item.BookedDateTime).diff(moment($scope.item.DispatchDateTime), 'minutes');
                            }else {
                                $scope.item._AutoDispatchOffset = 15;
                            }
                    
                        });
                   
                }
            }
            $scope.$apply();
        });

        $scope.$on('SIGNALR_bookingLocked', function (event, data) {
            var update = data[0];
            if (update.BookingId == $scope.item.Id) {
                if (update.UserId == session.UserId) {
                    $scope.lock.current = {
                        self: true,
                        expires: update.LockTime
                    };
                } else {
                    $scope.lock.current = {
                        self: false,
                        user: update.User.Name,
                        expires: update.LockTime
                    };
                }
            }
            $scope.$apply();
        });

        $scope.startEditing = function () {
            $http.get($config.API_ENDPOINT + 'api/bookings/RequestLock', {
                params: {
                    bookingId: $scope.item.Id
                }
            }).success(function (response) {
                if (response.status == 'LockGranted') {
                    Model.Booking.query()
                        .include('Driver,Client,Vehicle,FlightInfo,BookingStops,Invoice,BookingStops/PassengerStops,Passengers,BookingValidations,BookingTags,LeadPassenger,Currency,BookingRequirements,BookingExpense,BookingExpense/BookingExpenseType,BookingExpense/Tax') //Notifications
                        .where("Id eq guid'" + $scope.item.Id + "'")
                        .trackingEnabled()
                        .execute().then(function (data) {
                            $scope.item = data[0];
                            $scope.item.$Coupon = $scope.item.Coupon;
                            $scope.item.BookingStops = $scope.item.BookingStops.sort(function (a, b) { return a.StopOrder - b.StopOrder; });
                            $scope.item.BookingExpense = $scope.item.BookingExpense.map(function (ex) { return new Model.BookingExpense(ex); });
                            setBookingDateTime($scope.item.BookedDateTime);

                            if ($scope.item.FlightInfo) {
                                $scope.flightData.Number = $scope.item.FlightInfo.FlightNumber;
                            }

                            if ($scope.item.Priority) {
                                var p = ['P1', 'P2', 'P3', 'P4', 'P5'].indexOf('P' + $scope.item.Priority) + 1;
                                $scope.item.Priority = p.toFixed(0);
                            } else {
                                $scope.item.Priority = "P1";
                            }
                    
                            if($scope.item.DispatchDateTime) {
                                $scope.item._AutoDispatchOffset = moment($scope.item.BookedDateTime).diff(moment($scope.item.DispatchDateTime), 'minutes');
                            } else {
                                $scope.item._AutoDispatchOffset = 15;
                            }
                            $scope.viewMode = 'EDIT';
                        });
                   
                } else {
                    swal('Booking Locked!', "This booking is currently being edited by: " + response.user, 'error');
                }
            }).error(function () {
                swal('Error!', "Unknown error occured.", 'error');
            });
        }

        $scope.cancelEditing = function () {
            $scope.lock.saved = true;
            if ($scope.expenses.editing) {
                cancelEditedExpense();
            }
            if ($scope.expenses.adding) {
                cancelNewExpense();
            }
            $http.get($config.API_ENDPOINT + 'api/bookings/RemoveLock', {
                params: {
                    bookingId: $scope.item.Id
                }
            }).success(function (response) {
                var tags = angular.copy($scope.Tags);
                Model.Booking.query()
                    .include('Driver,Client,Vehicle,FlightInfo,BookingStops,Invoice,BookingStops/PassengerStops,Passengers,BookingValidations,LeadPassenger,Currency,BookingRequirements,BookingTags,BookingExpense,BookingExpense/BookingExpenseType,BookingExpense/Tax') //Notifications
                    .where("Id eq guid'" + $scope.item.Id + "'")
                    .trackingEnabled()
                    .execute().then(function (data) {
                        $scope.item = data[0];
                        $scope.item.BookingStops = $scope.item.BookingStops.sort(function (a, b) { return a.StopOrder - b.StopOrder; });
                        $scope.item.BookingExpense = $scope.item.BookingExpense.map(function (ex) { return new Model.BookingExpense(ex); });
                        $scope.item.Tags = tags;
                        $scope.viewMode = 'VIEW';
                        setBookingDateTime($scope.item.BookedDateTime);
                        $scope.tags = tags;

                        if ($scope.item.FlightInfo) {
                            $scope.flightData.Number = $scope.item.FlightInfo.FlightNumber;
                        }

                        if ($scope.item.Priority) {
                            var p = ['P1', 'P2', 'P3', 'P4', 'P5'].indexOf('P' + $scope.item.Priority) + 1;
                            $scope.item.Priority = p.toFixed(0);
                        } else {
                            $scope.item.Priority = "P1";
                        }

                        if($scope.item.DispatchDateTime) {
                            $scope.item._AutoDispatchOffset = moment($scope.item.BookedDateTime).diff(moment($scope.item.DispatchDateTime), 'minutes');
                        } else {
                            $scope.item._AutoDispatchOffset = 15;
                        }
                    });
                var stops = [];
                stops.push("(EntityType eq 'Booking' and EntityId eq guid'" + $scope.item.Id + "')")
                stops.push("(BookingId eq guid'" + $scope.item.Id + "')")
                for (var i = 0; i < $scope.item.BookingStops.length; i++) {
                    var s = $scope.item.BookingStops[i];
                    stops.push("(EntityType eq 'BookingStop' and EntityId eq guid'" + s.Id + "')")
                }
            }).error(function () {
                swal('Error!', "Unknown error occured.", 'error');
            });
        }

        window.onbeforeunload = function () {
            //$http.get($config.API_ENDPOINT + 'api/bookings/RemoveLock', {
            //    params: {
            //        bookingId: $scope.item.Id
            //    }
            //});
            //$rootScope.$digest();
            $scope.lock.saved = true;
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.open("GET", $config.API_ENDPOINT + 'api/bookings/RemoveLock?bookingId=' + $scope.item.Id, false);//the false is for making the call synchronous
            xmlhttp.setRequestHeader("Content-type", "application/json");
            xmlhttp.setRequestHeader("Authorization", 'bearer ' + Auth.getSession().access_token);
            xmlhttp.send();
        };

        if($location.search()['editnow'] == "true") {
            $scope.startEditing();
        }

        $scope.canQuote = true;
        $scope.item.BookingExpense = $scope.item.BookingExpense.map(function (ex) {
            return new Model.BookingExpense(ex);
        });
        $scope.bookingInfo = true;
        $scope.externalLocations = {
            knownLocations: (rClients[0] && rClients[0].KnownLocations) ? rClients[0].KnownLocations : [],
            historic: []
        };
        $scope.sortableOptions = {
            stop: function (e, ui) { },
            ondragstart: function (e, ui) { },
            disabled: $scope.item.BookingStops.length > 2 ? false : true
        };
        $scope.bookers = [];
        $scope.save = save;
        $scope.close = close;
        $scope.formFor = {}
        $scope.testMaskReferences = testMaskReferences;
        $scope.reverseStops = reverseStops;
        $scope.suggestReferences = suggestReferences;
        $scope.addRequirement = addRequirement;
        $scope.removeRequirement = removeRequirement;
        $scope.clients = rClients;
        $scope.openInvoice = function (Id) {
            (window.opener || window).open('/webapp/management/index.html#/invoices/' + Id, '_blank');
        }

        setBookingDateTime($scope.item.BookedDateTime);
        
        $scope.client = rClients[0];
        if ($scope.client) {
            $scope.client.Name = $scope.client.AccountNo + ' ' + $scope.client.Name;
        }
        $scope.clientReferences = [];
        $scope.booking = rBooking;
        $scope.expenseTypes = rExpenseTypes;
        $scope.taxes = rTaxes;
        $scope.searchBookers = searchBookers;
        $scope.searchPassengers = searchPassengers;
        $scope.fetchFlightInformation = fetchFlightInformation;
        $scope.removeFlightInfo = removeFlightInfo;
        $scope.expenses = {
            editing: null
        };

        $scope.addTag = addTag;
        $scope.removeTag = removeTag;

        function addTag(item) {
            var tag = $scope.Tags.find(function(res) {
                return res.Id == item.Id;
            })

            if(!tag) {
                $scope.Tags.push(item);
                var found = $scope.unlinkedTags.find(function(br) {
                    return br.Id == item.Id
                })
                if (found) {
                    var newTag = {
                        BookingId: $scope.item.Id,
                        TagId: item.Id,
                        Type: item.Type
                    }
                    $scope.item.BookingTags.push(newTag);
                    $scope.unlinkedTags.splice($scope.unlinkedTags.indexOf(found), 1)
                }
                $scope.item.$selectedTag = null;
            }
            
        }

        function removeTag(item) {
            $scope.unlinkedTags.push(item);
            var found = $scope.Tags.find(function(br) {
                return br.Id == item.Id
            })
            if (found) {
                $scope.Tags.splice($scope.Tags.indexOf(found), 1)
                $scope.item.BookingTags = $scope.item.BookingTags.filter(function(item) {
                    return item.TagId != found.Id;
                })
            }
            $scope.item.$selectedTag = null;
        }

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

        if ($scope.item.FlightInfo) {
            $scope.flightData.Number = $scope.item.FlightInfo.FlightNumber;
            $scope.flightData.DateTime = new moment($scope.item.FlightInfo.ScheduledArrivalTime);
            $scope.flightData.MinsAfterLanding = $scope.item.FlightInfo.MinsAfterLanding || 0;
        }

        $scope.driverPayment = null;

        $http.get($config.API_ENDPOINT + 'api/DriverPayments/breakdown', {
            params: {
                bookingId: $scope.item.Id
            }
        }).success(function (response) {
            $scope.driverPayment = response;
        });

        if (rClients[0]) {
            angular.forEach(rClients[0].ClientReferences, function(clientReference) {
                angular.forEach($scope.item.BookingValidations, function(bookingValidation) {
                    if (clientReference.Id == bookingValidation.ClientReferenceId) {
                        clientReference.$knownValue = bookingValidation.Value;
                        clientReference.$id = bookingValidation.Id
                        if (clientReference.ReferenceType == "List") {
                            var x = {
                                custom: false,
                                text: bookingValidation.Value
                            };
                            clientReference.$knownValue = x;
                            clientReference.$originalValue = x;
                            clientReference.$suggested = [x];
                        }
                    }
                })

                if (clientReference.ReferenceType == "Mask") {
                    clientReference.$testReg = _validateMask(clientReference.Value);
                }
                if (clientReference.ReferenceType == "List" && clientReference.ShowList) {
                    var ref = clientReference;
                    $http({
                        method: 'GET',
                        url: $config.API_ENDPOINT + '/api/ClientReferences/list?ClientReferenceId=' + clientReference.Id
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
                $scope.clientReferences.push(clientReference);
            });
        }
        if (!$scope.client || $scope.client.AllVehicleTypeAccess) {
            Model.VehicleType.query()
                .parseAs(function (item) {
                    this.Id = item.Id;
                    this.Name = item.Name;
                    this.Description = item.Description;
                    this.IsDefault = item.IsDefault;
                    this.Priority = item.Priority;
                    this.Order = item.Order;
                    this.IsDefault = item.IsDefault;
                    this.ImageUrl = null;
                })
                .execute().then(function (data) {
                    $scope.vehicleTypes = $scope.vehicleTypes = data.sort(function (a, b) { return (a.Order || 99) - (b.Order || 99) });
                });
        } else {
            $scope.vehicleTypes = $scope.client.VehicleTypes.sort(function (a, b) { return (a.Order || 99) - (b.Order || 99) });
        }
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
        function removeFlightInfo() {
            $scope.item.FlightInfo = null;
            $scope.item.FlightInfoId = null;
            $scope.flightData.Number = null;
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

        $scope.$watch('item.Date', function (newvalue, oldvalue) {
            if ($scope.dateSet) {
                $scope.dateSet = false;
                return;
            }
            if ($scope.flightData.Number && newvalue && newvalue != oldvalue) {
                
                fetchFlightInformation();
            }
        });

        function getDate(date, time, subtract) {
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var hours = time.getHours();
            var minutes = time.getMinutes();

            var format = pad(year, 4) + '-' + pad(month + 1, 2) + '-' + pad(day, 2) + 'T' + pad(hours, 2) + ':' + pad(minutes, 2) + ':00';
            var formatted = moment.tz(format, 'YYYY-MM-DDTHH:mm:ss', Localisation.timeZone().getTimeZone()).subtract(subtract || 0, 'minutes').format();

            return formatted;

            function pad(num, size) {
                var s = "000000000" + num;
                return s.substr(s.length - size);
            }
        }

        function fetchFlightInformation() {
            
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
                        result.data.MinsAfterLanding = $scope.flightData.MinsAfterLanding;
                        $scope.item.FlightInfo = new Model.FlightInfo(result.data);

                        if ($scope.item.BookingStatus !== 'Completed' && $scope.item.BookingStatus !== 'Cancelled' && $scope.item.BookingStatus !== 'COA') {
                            var tz = Localisation.timeZone().getTimeZone() || "Europe/London";
                            var test = moment($scope.item.FlightInfo.ArrivalTime).toDate();
                            var currentOffset = test.getTimezoneOffset();
                            var desiredOffset = moment.tz.zone(tz).offset(test);

                            var dt = new moment.tz($scope.item.FlightInfo.ArrivalTime, tz).add(currentOffset - desiredOffset, 'minutes');

                            $scope.flightData.DateTime = dt;
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
                        }
                    } else {
                        $scope.item.FlightInfo = null;
                        swal("Flight Not Found", "Please check flight number.", "warning")
                    }
                }, function (error) {
                        $scope.item.FlightInfo = null;
                    swal("Incorrect Flight Number", "Please check flight number.", "warning")
                });
            } else {
                $scope.item.FlightInfo = null;
                swal("Incorrect Flight Number", "Please check flight number.", "warning")
            }
        }


        $scope.addExpense = addExpense;
        $scope.editExpense = editExpense;
        $scope.removeExpense = removeExpense;
        $scope.saveEditedExpense = saveEditedExpense;
        $scope.cancelEditedExpense = cancelEditedExpense;
        $scope.saveNewExpense = saveNewExpense;
        $scope.cancelNewExpense = cancelNewExpense;
        $scope.getExpenseTypeName = getExpenseTypeName;
        $scope.getTaxName = getTaxName;
        $scope.flipAddress = flipAddress;

        function getExpenseTypeName(id) {
            var found = rExpenseTypes.filter(function (e) {
                return e.Id == id;
            })[0];
            if (found) {
                return found.Name;
            }
        }

        function getTaxName(id) {
            var found = rTaxes.filter(function (e) {
                return e.Id == id;
            })[0];
            if (found) {
                return found._TaxRate;
            }
        }

        function addExpense() {
            $scope.expenses.adding = new Model.BookingExpense();
        }

        function editExpense(ex) {
            $scope.expenses.editing = ex;
        }

        function removeExpense(ex) {
            var index = $scope.item.BookingExpense.indexOf(ex);
            $scope.item.BookingExpense.splice(index, 1);
        }

        function saveEditedExpense() {
            $scope.expenses.editing = null;
        }

        function cancelEditedExpense() {
            $scope.expenses.editing.$rollback();
            $scope.expenses.editing = null;
        }

        function saveNewExpense() {
            $scope.expenses.adding.BookingId = $scope.item.Id;
            $scope.item.BookingExpense.push($scope.expenses.adding);
            $scope.expenses.adding = null;
        }

        function cancelNewExpense() {
            $scope.expenses.adding = null;
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
                        if (c.$testReg.test(c.$knownValue) || (!c.$knownValue && (!c.Mandatory || !c.Active))) {
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

        $scope.addTime = addTime;
        $scope.addStop = addStop;
        $scope.removeStop = removeStop;

        $scope.$watch("item.BookingStops[0]", function (newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            if ($scope.item.WaitAndReturn) {
                var stop = new Model.BookingStop(angular.copy($scope.item.BookingStops[0]));
                stop.id = idCounter++;
                stop.Id = null;
                stop.WaitTime = null;
                $scope.item.BookingStops.splice($scope.item.BookingStops.length - 1, 1, stop);
            }
        }, true);

        $scope.$watch("item.WaitAndReturn", function (newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;
            if (newValue === false) {
                $scope.item.BookingStops.splice($scope.item.BookingStops.length - 1, 1);
            } else if (newValue === true) {
                var stop = new Model.BookingStop(angular.copy($scope.item.BookingStops[0]));
                stop.id = idCounter++;
                stop.Id = null;
                stop.WaitTime = null;
                $scope.item.BookingStops.push(stop);
            }
            $scope.canQuote = true;
            if (!$scope.item.AsDirected) {
                angular.forEach($scope.item.BookingStops, function (bs, $index) {
                    if (!bs.Latitude || !bs.Longitude) {
                        $scope.canQuote = false;
                    }
                });
            } else {
                $scope.canQuote = $scope.item.BookingStops[0].Latitude && $scope.item.BookingStops[0].Longitude;
            }
        });

        $scope.$watch(function () {
            return ($scope.item.BookingStops || []).map(function (x) {
                return {
                    Address1: x.Address1,
                    Address2: x.Address2,
                    Area: x.Area,
                    TownCity: x.TownCity,
                    Postcode: x.Postcode,
                    Latitude: x.Latitude,
                    Longitude: x.Longitude
                };
            });
        }, function (newValue, oldValue) {
            if (oldValue === undefined) return;
            if (skipStopsQuoting) {
                skipStopsQuoting = false;
                return;
            }
            $scope.canQuote = true;
            if (!$scope.item.AsDirected) {
                angular.forEach($scope.item.BookingStops, function (bs, $index) {
                    if (!bs.Latitude || !bs.Longitude) {
                        $scope.canQuote = false;
                    }
                });
            } else {
                $scope.canQuote = $scope.item.BookingStops[0].Latitude && $scope.item.BookingStops[0].Longitude;
            }

            if ($scope.canQuote) {
                getQuote($scope.item);
            } else {
                $scope.item.EstimatedCost = 0;
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
            if (!$scope.item.AsDirected) {
                angular.forEach($scope.item.BookingStops, function (bs, $index) {
                    if (!bs.Latitude || !bs.Longitude) {
                        $scope.canQuote = false;
                    }
                });
            } else {
                $scope.canQuote = $scope.item.BookingStops[0].Latitude && $scope.item.BookingStops[0].Longitude;
            }

            $scope.item.EstimatedCost = 0;
            $scope.quote = null;
            $scope.directions = null; 
            if ($scope.canQuote) {
                getQuote($scope.item);
            }
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
        $scope.$watch("selectedPassenger.Mobile", function (newvalue, oldvalue) {
            if (newvalue == oldvalue || oldvalue === undefined) return;
            $scope.item.PassengerNotificationPhone = newvalue;
        });
        $scope.$watch("item.LeadPassengerId", function (newvalue, oldvalue) {
            //if (newvalue == oldvalue) {
            //    return;
            //}
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

                if (newvalue !== oldvalue) {
                    b.PassengerNotificationPhone = found.Mobile;
                }
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


                var c = $scope.clients.filter(function (c) {
                    return c.Id == found.ClientId;
                })[0];
                if (c) {
                    $scope.fetchedClients = [c];
                } else {
                    $scope.fetchedClients = [];
                }

                Model.Booking.query().where("LeadPassengerId", 'eq', "guid'" + newvalue + "'").include('BookingStops').orderBy('BookedDateTime desc').top(5).execute().then(function (d) {
                    $scope.paxHistory = d;
                    $scope.currentTab = 'HISTORY';
                });

                $scope.externalLocations.historic.length = 0;
                Model.BookingStop.query().where("Booking/LeadPassengerId", 'eq', "guid'" + newvalue + "'").top(10).execute().then(function (d) {
                    var seen = {};
                    uniqueResults = d.filter(function (d) {
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
                    Model.Passenger.query().where("Id", 'eq', "guid'" + newvalue + "'").include('Tags').select("Tags").execute().then(function(d) {
                        found.Tags = d[0].Tags;
                        for (var i = 0; i < found.Tags.length; i++) {
                            addTag(found.Tags[i]);
                        }
                    });
                }
            } else {
                if (watchPassenger) { } else {
                    watchPassenger = true;
                    $scope.filteredPassengers = $scope.passengers;
                }
                b.PassengerNotificationPhone = null;
            }
        });

        $scope.$watch("item.VehicleTypeId", function (newValue, oldValue) {
            if (oldValue === undefined || newValue === oldValue) return;

            $scope.canQuote = true;
            if (!$scope.item.AsDirected) {
                angular.forEach($scope.item.BookingStops, function (bs, $index) {
                    if (!bs.Latitude || !bs.Longitude) {
                        $scope.canQuote = false;
                    }
                });
            } else {
                $scope.canQuote = $scope.item.BookingStops[0].Latitude && $scope.item.BookingStops[0].Longitude;
            }


            if ($scope.canQuote) {
                getQuote($scope.item);
            } else {
                $scope.item.EstimatedCost = 0;
                $scope.quote = null;
                $scope.directions = null; 
            }
        });

        function getQuote(booking) {
            if ($scope.viewMode == 'VIEW') return;
            $scope.quoting.inprogress = true;
            booking.BookedDateTime = getDate($scope.item.Date, $scope.item.Time);
            for (var i = 0; i < $scope.item.BookingStops.length; i++) {
                $scope.item.BookingStops[i].StopOrder = i + 1;
            }
            skipStopsQuoting = true; 
            $http.post($config.API_ENDPOINT + 'api/quote', booking)
                .success(function (result) {
                    skipStopsQuoting = false; 
                    $scope.quote = result;
                    if (result.Error) {
                        if (!booking.OneTransportReference && !booking.CityFleetReference) {
                            $scope.directions = null;
                            if ($scope.mode == 'Client') {
                                booking.ActualCost = null;
                            }
                        }
                    } else {
                        if (!booking.OneTransportReference && !booking.CityFleetReference) {
                            booking.EstimatedCost = result.FinalCost;
                            booking.EstimatedDistance = result.EstimatedDistance.toFixed(2);
                            booking.EstimatedDuration = result.EstimatedMins;
                            booking.WaitingCost = result.WaitingCharge;
                            if ($scope.mode == 'Client') {
                                booking.ActualCost = result.FinalCost;
                            }
                            $scope.directions = result.Directions;
                            if (result.Directions) {
                                booking.EncodedRoute = result.Directions.EncodedRoute;
                            } else {
                                booking.EncodedRoute = '';
                            }

                            booking._AutoDispatchOffset = Math.max(15, result.DispatchOffset || 15);
                        }
                    }
                    $scope.quoting.inprogress = false;
                }).error(function (error) {
                    $scope.quoting.inprogress = false;
                    swal("Could not quote", "Could not quote, please manually price and set driver payment amount for this booking.", "warning");
                    skipStopsQuoting = false; 
                });
        }


        function updateCost() {
            $scope.item.ActualCost = $scope.quote.FinalCost;
        }

        function applyCoupon() {
            $scope.item.Coupon = $scope.item.$Coupon;
            getQuote($scope.item);
        }


        function removeStop($index) {
            if ($scope.item.WaitAndReturn && $scope.item.BookingStops.length < 4) {
                swal("Cannot remove via Stop", "WaitAndReturn booking should have a via stop", "warning")
            } else
                $scope.item.BookingStops.splice($index, 1);
            if ($scope.item.BookingStops.length < 3)
                $scope.sortableOptions.disabled = true;
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


            if ($scope.item.FlightInfo) {
                $scope.item.FlightInfo.MinsAfterLanding = $scope.flightData.MinsAfterLanding;
                var d = $scope.flightData.GetDate().toDate();
                $scope.item.BookedDateTime = getDate(d, d);
            } else {
                $scope.item.BookedDateTime = getDate($scope.item.Date, $scope.item.Time);
            }

            if ($scope.item.AutoDispatch) {
                $scope.item.DispatchDateTime = getDate($scope.item.Date, $scope.item.Time, $scope.item._AutoDispatchOffset);
            }

            if ($scope.item.AsDirected) {
                $scope.item.BookingStops = [$scope.item.BookingStops[0]];
            }
            var b = angular.copy($scope.item);
            b.Currency = undefined;
            b.Client = undefined;
            b.Time = undefined;
            b.Vehicle = undefined;
            b.Driver = undefined;
            b.LeadPassenger = undefined;
            b.VehicleType = undefined;
            b.BookingValidations = [];
            if ($scope.clientReferences.length > 0) {
                for (var i = 0; i < $scope.clientReferences.length; i++) {
                    var c = $scope.clientReferences[i];
                    var _cr = new Model.BookingValidation();
                    _cr.ClientReferenceId = c.Id;
                    _cr.BookingId = b.Id;
                    _cr.Id = c.$id;
                    if (c.ReferenceType == 'List') {
                        _cr.Value = c.$knownValue && c.$knownValue.text;
                    } else {
                        _cr.Value = c.$knownValue;
                    }
                    if (_cr.Value)
                        b.BookingValidations.push(_cr);
                }
            }
            angular.forEach(b.BookingStops, function (stop, index) {
                stop.BookingId = $scope.item.Id;
                stop.Id = originalIds[index];
                stop.StopOrder = index + 1;
            });

            b.BookingTags.map(function(item) {
                var tag = $scope.Tags.find(function(res) {
                    return res.Id == item.TagId;
                });
                if(tag)
                    item.Type = tag.Type;
                return item;
            })
            $scope.lock.saved = true;
            $http.put($config.API_ENDPOINT + 'api/bookings', b, {
                params: {
                    Id: b.Id
                }
            }).then(function (response) {
                swal({
                    title: "Booking Updated",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });

                var stops = [];
                stops.push("(EntityType eq 'Booking' and EntityId eq guid'" + $scope.item.Id + "')")
                stops.push("(BookingId eq guid'" + $scope.item.Id + "')")
                for (var i = 0; i < $scope.item.BookingStops.length; i++) {
                    var s = $scope.item.BookingStops[i];
                    stops.push("(EntityType eq 'BookingStop' and EntityId eq guid'" + s.Id + "')")
                }

                $scope.events = {};
                fetchHistoryPage(1);

                $scope.viewMode = 'VIEW';
                $scope.lock.current = null;
                

                $http.get($config.API_ENDPOINT + 'api/DriverPayments/breakdown', {
                    params: {
                        bookingId: $scope.item.Id
                    }
                }).success(function (response) {
                    $scope.driverPayment = response;
                    $("#bookingsave").prop("disabled", false);
                });
            }, function (err) {
                $scope.lock.saved = true;
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }
    }
}(angular));