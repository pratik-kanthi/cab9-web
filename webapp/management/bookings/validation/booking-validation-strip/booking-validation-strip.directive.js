(function () {
    var module = angular.module('cab9.bookings');

    module.directive('bookingValidationStrip', function () {
        return {
            restrict: 'E',
            templateUrl: '/webapp/management/bookings/validation/booking-validation-strip/booking-validation-strip.template.html',
            scope: {
                booking: '='
            },
            controller: bookingValidationStripController,
            link: function (scope, element, attrs) {
                scope.mode = 'VIEW';
            }
        }
    });

    bookingValidationStripController.$inject = ['$scope', 'Auth', '$modal', '$UI', '$config', '$http', 'Model', 'Localisation', '$permissions', '$timeout'];

    function bookingValidationStripController($scope, Auth, $modal, $UI, $config, $http, Model, Localisation, $permissions, $timeout) {

        $scope.togglePopup = togglePopup;
        $scope.openEditModal = openEditModal;
        $scope.validateBooking = validateBooking;
        $scope.inValidateBooking = inValidateBooking;
        $scope.recalculateBooking = recalculateBooking;
        $scope.setCommissions = setCommissions;

        var current = Localisation.currency().getCurrent();

        $scope.editOptions = {
            mileage: false,
            client: {
                waiting: false,
                extras: false
            },
            driver: {
                waiting: false,
                extras: false
            }
        };
        $scope.showLabel = true;
        $scope.defaultFill = true;
        if ($scope.booking.Client) {
            $scope.CurrencyId = $scope.booking.Client.DefaultCurrencyId;
        } else
            $scope.CurrencyId = current.Id;

        $scope.PERMISSIONS = $permissions;

        $scope.API_ENDPOINT = $config.API_ENDPOINT;

        $scope.loading = false;

        function validateBooking(booking) {
            booking.$loading = true;
            $http.put($config.API_ENDPOINT + 'api/bookings/validation/setvalidate?bookingId=' + booking.Id + '&valid=true')
                .success(function (data) {
                    booking.$loading = false;
                    removeBookingFromArray(data);
                }).error(function (error) {
                    booking.$loading = false;
                    swal("Error", error.Message, "error");
                });
        }

        function setCommissions(booking) {
            booking.$loading = true;
            $http.put($config.API_ENDPOINT + 'api/bookings/validation/setcommissions?bookingId=' + booking.Id + '&manualCost=' + booking.ActualCost + '&manualCommission=' + booking.JourneyCommission)
                .success(function (data) {
                    replaceBookingWithNew(booking, data)
                    booking.$loading = false;
                }).error(function (error) {
                    swal("Error", error.Message, "error");
                    booking.$loading = false;
                });
        }

        function inValidateBooking(booking) {
            booking.$loading = true;
            $http.put($config.API_ENDPOINT + 'api/bookings/validation/setvalidate?bookingId=' + booking.Id + '&valid=false')
                .success(function (data) {
                    booking.$loading = false;
                    removeBookingFromArray(data);
                }).error(function (error) {
                    booking.$loading = false;
                    swal("Error", error.Message, "error");
                });
        }

        function recalculateBooking(booking) {
            booking.$loading = true;
            $http.put($config.API_ENDPOINT + 'api/bookings/validation/recalculate?bookingId=' + booking.Id)
                .success(function (data) {
                    replaceBookingWithNew(booking, data);
                    booking.$loading = false;
                }).error(function (error) {
                    swal("Error", error.Message, "error");
                    booking.$loading = false;
                });
        }

        function togglePopup(obj, type) {
            if (!type) {
                $scope.editOptions[obj] = !$scope.editOptions[obj];
                $scope.overlay = $scope.editOptions[obj];
            } else {
                $scope.editOptions[obj][type] = !$scope.editOptions[obj][type];
                $scope.overlay = $scope.editOptions[obj][type];
            }
            $scope.booking.Stops = $scope.booking.Stops.map(function (stop) {
                stop.StopSummary = stopSummary(stop);
                return stop;
            })
        }

        function replaceBookingWithNew(booking, data) {
            var index = $scope.$parent.bookings.findIndex(function (x) {
                return x.Id == data.Id
            });
            document.getElementById(booking.Id).classList.add('animated', 'pulse');
            $timeout(function () {
                if (data.PaymentMethod == "Cash") {
                    data.$invLbl = "Cash";
                } else if (data.PaymentMethod == "Card") {
                    data.$invLbl = "Card";
                } else {
                    data.$invLbl = "Invoice";
                }
                $scope.$parent.bookings.splice(index, 1, data);
            }, 400);
        }

        function removeBookingFromArray(data) {
            var index = $scope.$parent.bookings.findIndex(function (x) {
                return x.Id == data.Id
            });
            document.getElementById(data.Id).classList.add('animated', 'flipOutX');
            $timeout(function () {
                for (i = index + 1; i < $scope.$parent.bookings.length; i++) {
                    document.getElementById($scope.$parent.bookings[i].Id).classList.add('animated', 'slideInUp');
                }

                $scope.$parent.bookings.splice(index, 1);
            }, 400);
            $timeout(function () {
                for (i = index; i < $scope.$parent.bookings.length; i++) {
                    document.getElementById($scope.$parent.bookings[i].Id).classList.remove('animated', 'slideInUp');
                }
            }, 1000);
        }

        function openEditModal(booking) {
            window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId, 'EDIT:' + booking.Id, 'height=870,width=1000,left=0,top=0');
        }

        function stopSummary(model) {
            var add = "";
            if (model.Address1 && model.Address1.length > 0) {
                add += model.Address1;
            }
            if (model.TownCity && model.TownCity.length > 0) {
                if (add.trim().length > 0) {
                    add += ', ';
                }
                add += model.TownCity;
            } else if (model.Area && model.Area.length > 0) {
                if (add.trim().length > 0) {
                    add += ', ';
                }
                add += model.Area;
            }
            if (model.County && add.length === 0 && model.County.length > 0) {
                add += model.County;
            }
            if (model.Postcode && model.Postcode.length > 0) {
                if (add.trim().length > 0) {
                    add += ', ';
                }
                add += model.Postcode;
            }
            return add;
        }
    }

}());