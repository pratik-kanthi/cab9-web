(function () {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchBookingAllocateModalController', DispatchBookingAllocateModalController);

    DispatchBookingAllocateModalController.$inject = ['$scope', '$rootScope', '$modalInstance', 'rBooking', '$http', '$config', '$timeout', 'rChoosen'];

    function DispatchBookingAllocateModalController($scope, $rootScope, $modalInstance, rBooking, $http, $config, $timeout, rChoosen) {
        $scope.drivers = null;
        $scope.booking = rBooking;
        $scope.choosen = {
            driver: null,
            partner: null,
            allocateType: 'SOFT',
            notify: true,
            fixedNotify: false,
            pre: false,
            worksharePartner: null,
            workshareProduct: null,
        };
        $scope.fetchingWorkshare = false;
        $scope.fetchingPartners = false;
        var firstLoad = true;
        $scope.inprogress = false;
        $scope.confirm = confirm;
        $scope.chooseDriver = chooseDriver;
        $scope.choosePartner = choosePartner;
        $scope.chooseWorkshareProduct = chooseWorkshareProduct;
        $scope.allocatePartner = allocatePartner;
        fetchWorksharePartnerQuotes();

        function chooseDriver(driver) {
            $scope.choosen.partner = null;
            $scope.choosen.driver = driver;

            var found = $scope.drivers.filter(function (d) {
                return d.Id == driver.Id;
            })[0];
            if (found) {
                $scope.choosenFromBidded = false;
            } else {
                var found = $scope.biddeddrivers.filter(function (d) {
                    return d.Id == driver.Id;
                })[0];
                if (found) {
                    $scope.choosenFromBidded = true;
                }
            }


        }

        function chooseWorkshareProduct(partner, product) {
            $scope.choosen.driver = null;
            $scope.choosen.worksharePartner = partner;
            $scope.choosen.workshareProduct = product;
            $scope.choosen.partner = null;
        }

        function choosePartner(partner) {
            $scope.choosen.driver = null;
            $scope.choosen.worksharePartner = null;
            $scope.choosen.workshareProduct = null;
            $scope.choosen.partner = partner;
        }

        $scope.getScoreClass = function (value) {
            if (value >= 75) {
                return 'success';
            } else if (value >= 30) {
                return 'warning';
            } else {
                return 'danger';
            }
        };

        var skip = false;
        $scope.$watchGroup(['searchTerm', 'includeOffline'], function () {
            if (skip) {
                skip = false;
            }

            if ($scope.searchTerm) {
                prestate = $scope.includeOffline;
                $scope.includeOffline = true;
                if (!prestate) {
                    skip = true;
                }
            }

            $http.get($config.API_ENDPOINT + 'api/Bookings/BestSuitedDrivers', {
                params: {
                    bookingId: $scope.booking.Id,
                    includeOffline: !!$scope.includeOffline,
                    searchText: $scope.searchTerm
                }
            }).then(function (response) {
                var drivers = response.data;
                var stops = $scope.booking.BookingStops;

                if ($scope.booking.BookingStatus == 'OpenToBid') {
                    $http.get($config.API_ENDPOINT + 'api/Bid/AvailableBids', {
                        params: {
                            pLatitude: stops[0].latitude,
                            pLongitude: stops[0].longitude,
                            bookingId: $scope.booking.Id,
                            searchText: $scope.searchTerm
                        }
                    }).then(function (response) {
                        $scope.biddeddrivers = response.data;
                        if ($scope.biddeddrivers.length > 0) {
                            $scope.biddeddrivers.map(function (item) {
                                item._ImageUrl = window.formatImage(item.ImageUrl, item.Callsign);
                            })
                        }

                        for (i = 0; i < $scope.biddeddrivers.length; i++) {
                            value = $scope.biddeddrivers[i].Id;
                            var index = drivers.findIndex(function (d) {
                                return d.Id == value;
                            })
                            if (index > -1) {
                                drivers.splice(index, 1);
                            }
                        }

                        $scope.drivers = drivers;
                        $scope.drivers.map(function (item) {
                            item._ImageUrl = window.formatImage(item.ImageUrl, item.Callsign);
                        })
                        if (firstLoad) {
                            if (rChoosen) {
                                var found = $scope.drivers.filter(function (d) {
                                    return d.Id == rChoosen;
                                })[0];
                                if (found) {
                                    $scope.choosen.driver = found;
                                    $scope.choosen.pre = true;
                                    $scope.choosenFromBidded = false;
                                } else {
                                    var found = $scope.biddeddrivers.filter(function (d) {
                                        return d.Id == rChoosen;
                                    })[0];
                                    if (found) {
                                        $scope.choosen.driver = found;
                                        $scope.choosen.pre = true;
                                        $scope.choosenFromBidded = true;
                                    }
                                }

                            }
                            firstLoad = true;
                        }
                    });

                } else {
                    $scope.drivers = drivers;
                    $scope.drivers.map(function (item) {
                        item._ImageUrl = window.formatImage(item.ImageUrl, item.Callsign);
                    })
                    if (firstLoad) {
                        if (rChoosen) {
                            var found = $scope.drivers.filter(function (d) {
                                return d.Id == rChoosen;
                            })[0];
                            if (found) {
                                $scope.choosen.driver = found;
                                $scope.choosen.pre = true;
                                $scope.choosenFromBidded = false;
                            }
                        }
                        firstLoad = true;
                    }
                }
            });
        });

        function fetchWorksharePartnerQuotes() {
            $scope.fetchingWorkshare = true;
            var stops = $scope.booking.BookingStops;
            if (stops.length > 1) {
                $http.get($config.API_ENDPOINT + 'api/partner-products/all', {
                    params: {
                        bookingId: $scope.booking.Id,
                        pickupLatitude: stops[0].latitude,
                        pickupLongitude: stops[0].longitude,
                        dropLatitude: stops[stops.length - 1].latitude,
                        dropLongitude: stops[stops.length - 1].longitude,
                    }
                }).then(function (response) {
                    $scope.fetchingWorkshare = false;
                    $scope.worksharePartnerQuotes = response.data;
                }, function (err) {
                    $scope.fetchingWorkshare = false;
                });
            } else {
                $http.get($config.API_ENDPOINT + 'api/partner-products/all', {
                    params: {
                        bookingId: $scope.booking.Id,
                        pickupLatitude: stops[0].latitude,
                        pickupLongitude: stops[0].longitude,
                    }
                }).then(function (response) {
                        $scope.fetchingWorkshare = false;
                        $scope.worksharePartnerQuotes = response.data;
                    },
                    function (err) {
                        $scope.fetchingWorkshare = false;
                    });
            }
        }

        function fetchPartners() {
            $scope.fetchingPartners = true;
            var stops = $scope.booking.BookingStops;
            if (stops.length > 1) {
                $http.get($config.API_ENDPOINT + 'api/Partner/Products', {
                    params: {
                        pLatitude: stops[0].latitude,
                        pLongitude: stops[0].longitude,
                        dLatitude: stops[stops.length - 1].latitude,
                        dLongitude: stops[stops.length - 1].longitude,
                    }
                }).then(function (response) {
                        $scope.fetchingPartners = false;
                        $scope.partners = response.data.map(function (item) {
                            item.Name = item.Name.substr(item.Name.indexOf(" ") + 1)
                            return item
                        });
                    },
                    function (err) {
                        $scope.fetchingPartners = false;
                    });
            } else {
                $http.get($config.API_ENDPOINT + 'api/Partner/Products', {
                    params: {
                        pLatitude: stops[0].latitude,
                        pLongitude: stops[0].longitude,
                    }
                }).then(function (response) {
                        $scope.fetchingPartners = false;
                        $scope.partners = response.data;
                    },
                    function (err) {
                        $scope.fetchingPartners = false;
                    });
            }
        }

        fetchPartners();

        $timeout(function () {
            $('#allocate-search').focus();
        }, 100);

        if (new moment($scope.booking.BookedDateTime).isAfter(new moment().add(2, 'hour'))) {

            $scope.choosen.notify = false;
        }

        function confirm(type, notify) {
            $http.get($config.API_ENDPOINT + 'api/bookings/CheckDriver', {
                params: {
                    driverId: $scope.choosen.driver.Id,
                    bookingId: $scope.booking.Id,
                }
            }).success(function (data) {
                if (data && data.Conflict && data.Message === "Vehicle Mismatch") {
                    swal({
                        title: data.Message,
                        text: "Possible conflict as this vehicle does not match bookings Pax/Bags values.",
                        type: 'warning',
                        showCancelButton: true,
                        closeOnConfirm: false
                    }, function () {
                        confirmFinal(type, notify)
                    });
                } else if (data && data.Conflict) {
                    swal({
                        title: "Booking Conflict",
                        text: data.Message,
                        type: 'warning',
                        showCancelButton: true,
                        closeOnConfirm: false
                    }, function () {
                        confirmFinal(type, notify)
                    });
                } else {
                    confirmFinal(type, notify);
                }
            });
        }

        function confirmFinal(type, notify) {
            $scope.inprogress = true;
            $http.post($config.API_ENDPOINT + 'api/bookings/ChooseDriver', null, {
                params: {
                    driverId: $scope.choosen.driver.Id,
                    bookingId: $scope.booking.Id,
                    hard: (type == 'HARD'),
                    notify: notify
                }
            }).success(function () {

            });

            swal('Assigned', 'Booking has been assigned.', 'success');
            $modalInstance.close();
        }

        function allocatePartner() {
            $scope.inprogress = true;
            if ($scope.choosen.partner) {
                $http.post($config.API_ENDPOINT + 'api/Partner/Booking', null, {
                    params: {
                        bookingId: $scope.booking.Id,
                        pType: $scope.choosen.partner.PartnerType,
                        pId: $scope.choosen.partner.Id
                    }
                }).then(function (response) {
                    console.log(response);
                    swal('Assigned', 'Booking has been assigned to ' + $scope.choosen.partner.PartnerType + '. Reference: ' + response.data.ride_id, 'success');
                    $modalInstance.close();
                }, function (error) {
                    swal('Partner Error', JSON.parse(error.data.Message).error_description, 'error');
                });
            } else if ($scope.choosen.worksharePartner) {
                $http.post($config.API_ENDPOINT + 'api/partner-products/offer', null, {
                    params: {
                        partnerId: $scope.choosen.worksharePartner.PartnerId,
                        bookingId: $scope.booking.Id,
                        vehicleTypeId: $scope.choosen.workshareProduct.VehicleTypeId
                    }
                }).then(function (response) {
                    swal('Assigned', 'Booking assignment request created for partner ' + $scope.choosen.worksharePartner.PartnerName, 'success');
                    $modalInstance.close();
                }, function (error) {
                    swal('Partner Error', JSON.parse(error.data.Message).error_description, 'error');
                });
            } else {

            }
        }
    }
}())