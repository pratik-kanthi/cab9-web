(function() {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchBookingsBidController', dispatchBookingsBidController);

    dispatchBookingsBidController.$inject = ['$scope', '$http', '$config', '$modalInstance', 'rBookings', '$modalInstance', '$UI', 'Auth'];

    function dispatchBookingsBidController($scope, $http, $config, $modalInstance, rBookings, $modalInstance, $UI, Auth) {
        $scope.bookings = rBookings;
        $scope.bidConfig = {
            enableAuctionBidding: false
        }

        $scope.searchTerm = {
            $: '',
            $callsign: ''
        };
        $scope.selected = {
            DriverIds: []
        };
        $scope.showhelp = false;
        $scope.driverCount = 0;
        $scope.fetchDrivers = fetchDrivers;
        $scope.selectAllDrivers = selectAllDrivers;
        $scope.selectDrivers = selectDrivers;
        $scope.modifyDriverList = modifyDriverList;
        $scope.callsignStartsWith = callsignStartsWith;
        $scope.getFilteredDrivers = getFilteredDrivers;
        $scope.getFilteredBiddedDrivers = getFilteredBiddedDrivers;
        $scope.SendBidding = SendBidding;
        $scope.CancelBidding = CancelBidding;

        if ($scope.bookings.length > 1) {
            $scope.multiBooking = true;
            fetchAllDrivers();
        } else {
            $scope.multiBooking = false;
            fetchDriverForBooking($scope.bookings[0]);
        }

        function fetchAllDrivers() {
            $http.get($config.API_ENDPOINT + 'api/drivers', {
                params: {
                    $expand: 'DriverType',
                    $select: 'Id,Firstname,Surname,Callsign,Active,DriverTypeId,DriverType/Name'
                }
            }).then(function(response) {
                $scope.drivers = response.data.map(function(item) {
                    item._Fullname = item.Firstname + ' ' + item.Surname;
                    return item;
                });
                $scope.filteredDrivers = $scope.drivers;
            }, function(err) {
                swal("Error", "Error occurred while fetching drivers.", "error");
            });
        }

        //fetch drivers for a booking
        function fetchDriverForBooking(booking) {
            $http.get($config.API_ENDPOINT + 'api/Drivers/ForBiddedBooking?BookingId=' + booking.Id, {
                headers: {
                    Authorization: 'Bearer ' + $config.TOKEN
                }
            }).then(function(response) {
                var driverResponse = response.data.Drivers;
                $scope.filteredBiddedDrivers = [];
                if (response.data) {
                    $scope.drivers = response.data.Drivers.map(function(item) {
                        item._Fullname = item.Firstname + ' ' + item.Surname;
                        return item;
                    });
                    $scope.filteredDrivers = $scope.drivers;
                    $scope.filteredBiddedDrivers = response.data.BiddedDrivers.map(function(item) {
                        item._Fullname = item.Firstname + ' ' + item.Surname;
                        return item;
                    });
                }

            }, function(err) {
                swal("Error", "Error occurred while fetching drivers.", "error");
            });
        }

        function SendBidding(notifyDrivers) {
            var input = {
                DriverIds: $scope.selected.DriverIds,
                Amount: $scope.bidConfig.amount,
                EnableDriverBidding: $scope.bidConfig.enableAuctionBidding,
                NotifyDrivers: notifyDrivers,
                BookingIds: $scope.bookings.map(function(b) {
                    return b.Id;
                })
            }

            $http.post($config.API_ENDPOINT + 'api/bookings/startbidding', input)
                .success(function() {
                    $modalInstance.close(true);
                    swal({
                        title: "Drivers Informed.",
                        text: "Drivers are invited to bid on the selected booking.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                }).error(function(error) {
                    $modalInstance.close(true);
                    if (error.Message == 'Driver auction settings are disabled.')
                        swal("Error", "Driver auction settings are disabled, Please enable auction or contact admin", "error");
                    else
                        swal("Error", "Please try again or contact admin", "error");
                });
        }

        function CancelBidding() {
            var bookingIds = $scope.bookings.map(function(b) {
                return b.Id;
            });

            swal({
                title: "Are you sure?",
                text: "All the biddings and invitation to drivers to bid will be cancelled.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Cancel!",
                closeOnConfirm: false
            }, function() {
                $http.post($config.API_ENDPOINT + 'api/bookings/cancelbidding', bookingIds)
                    .success(function() {
                        $modalInstance.close(true);
                        swal({
                            title: "Cancelled.",
                            text: "All the biddings and invitation to drivers to bid are cancelled",
                            type: "success",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    }).error(function(error) {
                        $modalInstance.close(true);
                        swal("Error", "Please try again or contact admin", "error");
                    });
            })
        }

        fetchDriverTypes();

        function fetchDriverTypes() {
            $http.get($config.API_ENDPOINT + 'api/drivertypes', {
                params: {
                    $select: 'Id,Name'
                }
            }).then(function(response) {
                $scope.driverTypes = response.data;
            }, function(err) {
                if (err.status == 401)
                    AuthFactory.fetchToken(function() {
                        fetchDriverTypes();
                    });
                else
                    ConvoFactory.showErrorMsg();
            });
        }

        //filter drivers based on driver type
        function fetchDrivers(selected) {
            $scope.allDriversSelected = false;
            if (!selected.Id)
                $scope.filteredDrivers = $scope.drivers
            else {
                $scope.filteredDrivers = $scope.drivers.filter(function(item) {
                    return item.DriverTypeId === selected.Id;
                });
                $scope.selectedCategory = selected.Name;
            }
        }

        //called when select all drivers option is selected
        function selectAllDrivers() {
            $scope.allDriversSelected = !$scope.allDriversSelected;
            if ($scope.selected.DriverTypeId) {
                for (i = 0, len = $scope.searchedDrivers.length; i < len; i++) {
                    if ($scope.searchedDrivers[i].DriverTypeId == $scope.selected.DriverTypeId) {
                        $scope.searchedDrivers[i].$checked = $scope.allDriversSelected;
                        var index = $scope.selected.DriverIds.indexOf($scope.searchedDrivers[i].Id);
                        if (!$scope.allDriversSelected) {
                            if (index !== -1)
                                $scope.selected.DriverIds.splice(index, 1);
                        } else if (index === -1)
                            $scope.selected.DriverIds.push($scope.searchedDrivers[i].Id);
                    }

                }
            } else {
                $scope.searchedDrivers = $scope.searchedDrivers.map(function(item) {
                    item.$checked = $scope.allDriversSelected;
                    var index = $scope.selected.DriverIds.indexOf(item.Id);
                    if (!$scope.allDriversSelected) {
                        if (index !== -1)
                            $scope.selected.DriverIds.splice(index, 1);
                    } else if (index === -1)
                        $scope.selected.DriverIds.push(item.Id);
                    return item;
                });
            }
        }

        //called when driver is removed from multi select box
        function selectDrivers() {
            $scope.filteredDrivers = $scope.filteredDrivers.map(function(item) {
                if ($scope.selected.DriverIds.indexOf(item.Id) !== -1)
                    item.$checked = true;
                else
                    item.$checked = false
                return item;
            });
        }

        function getFilteredDrivers() {
            if (!$scope.filteredDrivers || $scope.filteredDrivers.length == 0)
                return [];
            $scope.searchedDrivers = $scope.filteredDrivers.filter(function(item) {
                var s = item._Fullname + item.Callsign;
                var test = false;
                if ($scope.searchTerm.$) {
                    $scope.searchTerm.$ = $scope.searchTerm.$.toLowerCase();
                    if (s.toLowerCase().indexOf($scope.searchTerm.$) != -1) {
                        if ($scope.searchTerm.$callsign) {
                            if (item.Callsign.toLowerCase().startsWith($scope.searchTerm.$callsign.toLowerCase()))
                                test = true;
                        } else {
                            test = true;
                        }
                    }
                } else {
                    if ($scope.searchTerm.$callsign) {
                        $scope.searchTerm.$callsign = $scope.searchTerm.$callsign.toLowerCase();
                        if (item.Callsign.toLowerCase().startsWith($scope.searchTerm.$callsign))
                            test = true;
                    } else {
                        test = true;
                    }
                }
                return test;
            });
            return $scope.searchedDrivers;
        }

        function getFilteredBiddedDrivers() {
            if (!$scope.filteredBiddedDrivers || $scope.filteredBiddedDrivers.length == 0)
                return [];
            $scope.searchedBiddedDrivers = $scope.filteredBiddedDrivers.filter(function(item) {
                var s = item._Fullname + item.Callsign;
                var test = false;
                if ($scope.searchTerm.$) {
                    $scope.searchTerm.$ = $scope.searchTerm.$.toLowerCase();
                    if (s.toLowerCase().indexOf($scope.searchTerm.$) != -1) {
                        if ($scope.searchTerm.$callsign) {
                            if (item.Callsign.toLowerCase().startsWith($scope.searchTerm.$callsign.toLowerCase()))
                                test = true;
                        } else {
                            test = true;
                        }
                    }
                } else {
                    if ($scope.searchTerm.$callsign) {
                        $scope.searchTerm.$callsign = $scope.searchTerm.$callsign.toLowerCase();
                        if (item.Callsign.toLowerCase().startsWith($scope.searchTerm.$callsign))
                            test = true;
                    } else {
                        test = true;
                    }
                }
                return test;
            });
            return $scope.searchedBiddedDrivers;
        }

        function modifyDriverList(driver) {
            var i = $scope.selected.DriverIds.indexOf(driver.Id);
            if (!driver.$checked) {
                if (i !== -1)
                    $scope.selected.DriverIds.splice(i, 1);
            } else if (i === -1)
                $scope.selected.DriverIds.push(driver.Id);
        }

        function callsignStartsWith() {
            return function(item, callsign) {
                if (item.Callsign.startsWith(callsign))
                    return item;
            }
        }
    }
}())