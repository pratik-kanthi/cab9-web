(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('NewPaymentInitController', newPaymentInitController);
    newPaymentInitController.$inject = ['$scope', '$state', '$UI', '$q', 'Model', '$stateParams', '$modalInstance', 'rDrivers'];

    function newPaymentInitController($scope, $state, $UI, $q, Model, $stateParams, $modalInstance, rDrivers) {
        $scope.drivers = rDrivers.map(function (item) {
            item.$checked = false;
            return item;
        });
        $scope.allDriverSelected = false;
        $scope.selectAllDrivers = selectAllDrivers;
        $scope.getSelectedDriversCount = getSelectedDriversCount;
        $scope.driverFilter = driverFilter;

        function getSelectedDriversCount() {
            return $scope.drivers.filter(function (item) {
                return item.$checked
            }).length;
        }

        $scope.$watchGroup(['payment.PaymentTo','payment.PaymentFrom'], function () {
            var from = ($scope.payment.PaymentFrom != null) ? new moment($scope.payment.PaymentFrom).format() : new moment().subtract(1, 'year').startOf("isoweek").format();
            var to = new moment($scope.payment.PaymentTo).format();
            Model.Booking.query()
                .select('Id,DriverId')
                .where("BookedDateTime ge datetimeoffset'" + from + "'")
                .where("BookedDateTime le datetimeoffset'" + to + "'")
                .where("DriverPaymentId eq null")
                .where("DriverId ne null")
                .where("BookingStatus eq 'Completed' or BookingStatus eq 'COA'")
                .execute().then(function (data) {
                    angular.forEach($scope.drivers, function (d) {
                        d.$bookings = data.filter(function (b) { return b.DriverId == d.Id; }).length;
                    });
                });
        });

        function driverFilter(item) {
            return item.DriverTypeId == $scope.selected.DriverType || !$scope.selected.DriverType
        };
        Model.DriverType.query().execute().then(function (response) {
            $scope.driverTypes = response;
        }, function (err) {
            swal({
                title: "Some Error Occured.",
                text: "Some error has occured.",
                type: "error",
                confirmButtonColor: $UI.COLOURS.brandSecondary
            });
        })
        $scope.payment = new Model.DriverPayment();
        $scope.payment.PaymentFrom = null;
        $scope.payment.PaymentTo = new moment().subtract(1, 'week').endOf("isoweek").toDate();
        $scope.payment.Driver = null;
        $scope.payment.PaymentModel = null;
        $scope.selected = {
            DriverIds: null,
            DriverType: null
        };
        $scope.opened = {};
        $scope.payment.Bill = new Model.Bill();
        $scope.payment.Bill.DueDate = new moment().add(1, 'month').toDate();

        $scope.payment.Invoice = new Model.Invoice();
        $scope.payment.Invoice.DueDate = new moment().add(1, 'month').toDate();
        $scope.payment.Invoice.InvoiceType = 'Driver';
        $scope.payment.Invoice.PaymentInstructions = $scope.COMPANY.DefaultInvoicePaymentInstructions;
        $scope.openCalendar = openCalendar;

        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function selectAllDrivers() {
            $scope.allDriverSelected = !$scope.allDriverSelected;
            if ($scope.selected.DriverType) {
                for (i = 0, len = $scope.drivers.length; i < len; i++) {
                    if ($scope.drivers[i].DriverTypeId == $scope.selected.DriverType)
                        $scope.drivers[i].$checked = $scope.allDriverSelected;
                }
            } else {
                $scope.drivers = $scope.drivers.map(function (item) {
                    item.$checked = $scope.allDriverSelected;
                    return item
                });
            }
        }
        $scope.proceed = proceed;

        function proceed() {
            var driverIds = [];
            for (i = 0, len = $scope.drivers.length; i < len; i++) {
                if ($scope.drivers[i].$checked)
                    driverIds.push($scope.drivers[i].Id)
            }
            $modalInstance.close();
            if ($scope.payment.PaymentFrom == null) {
                $scope.payment.PaymentFrom = new moment().subtract(1, 'year').startOf("isoweek").toDate();
            }
            $state.go('root.driverpayments.create', {
                data: {
                    payment: $scope.payment,
                    driverIds: driverIds
                }
            });
        }
    }
}(angular))