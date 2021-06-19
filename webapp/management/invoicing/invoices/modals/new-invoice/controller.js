(function (angular) {
    var module = angular.module('cab9.invoices');

    module.controller('NewInvoiceInitController', NewInvoiceInitController);
    NewInvoiceInitController.$inject = ['$scope', '$state', '$UI', '$q', 'Model', '$stateParams', '$modalInstance', 'rClients', 'Localisation'];

    function NewInvoiceInitController($scope, $state, $UI, $q, Model, $stateParams, $modalInstance, rClients, Localisation) {
        $scope.clients = rClients.map(function (item) {
            item.$checked = false;
            return item;
        });
        $scope.allDriverSelected = false;
        $scope.clientFilter = clientFilter;
        $scope.getSelectedCount = getSelectedCount;

        function getSelectedCount() {
            return $scope.clients.filter(function (item) {
                return item.$checked
            }).length;
        }

        $scope.$watchGroup(['payment.PaymentTo', 'payment.PaymentFrom'], function () {

            var from = _formatDate(($scope.payment.PaymentFrom != null) ? $scope.payment.PaymentFrom : new moment().subtract(1, 'year').startOf("isoweek")).format();
            var to = _formatDate($scope.payment.PaymentTo).format();
            Model.Booking.query()
                .select('Id,ClientId,LocalId')
                .where("BookedDateTime ge datetimeoffset'" + from + "'")
                .where("BookedDateTime le datetimeoffset'" + to + "'")
                .where("InvoiceId eq null")
                .where("ClientId ne null")
                .where("(BookingStatus eq 'Completed' or BookingStatus eq 'COA')")
                .where("PaymentMethod eq 'OnAccount'")//(or PaymentMethod eq 'Card')?
                .where("Dispute eq false")
                .execute().then(function (data) {
                    angular.forEach($scope.clients, function (d) {
                        d.$bookings = data.filter(function (b) { return b.ClientId == d.Id; }).length;
                    });
                });
        });

        function clientFilter(item) {
            return (item.ClientTypeId == $scope.selected.ClientType || !$scope.selected.ClientType) && (item.InvoicePeriod === $scope.selected.BillingPeriod || !$scope.selected.BillingPeriod)
        };

        Model.ClientType.query().execute().then(function (response) {
            $scope.clientTypes = response;
        }, function (err) {
            swal({
                title: "Some Error Occured.",
                text: "Some error has occured.",
                type: "error",
                confirmButtonColor: $UI.COLOURS.brandSecondary
            });
        });
        $scope.billingPeriods = ['Daily','Weekly','BiWeekly','Monthly'];

        $scope.selected = {
            ClientIds: null,
            BillingPeriod: null,
            ClientType: null
        };
        $scope.opened = {};

        $scope.payment = new Model.DriverPayment();
        $scope.payment.PaymentFrom = null;
        $scope.payment.PaymentTo = new moment().subtract(1, 'month').endOf("month").toDate();
        $scope.payment.Driver = null;
        $scope.payment.PaymentModel = null;
        $scope.payment.Bill = new Model.Bill();
        $scope.payment.Bill.DueDate = new moment().add(1, 'month').toDate();
        $scope.payment.Invoice = new Model.Invoice();
        $scope.payment.Invoice.DueDate = new moment().add(1, 'month').toDate();
        $scope.payment.Invoice.InvoiceType = 'Driver';
        $scope.payment.Invoice.PaymentInstructions = $scope.COMPANY.DefaultInvoicePaymentInstructions;
        $scope.openCalendar = openCalendar;
        $scope.selectAllClients = selectAllClients;

        function openCalendar(event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function selectAllClients() {
            $scope.allClientsSelected = !$scope.allClientsSelected;
            if ($scope.selected.ClientType) {
                for (i = 0, len = $scope.clients.length; i < len; i++) {
                    if ($scope.clients[i].ClientTypeId == $scope.selected.ClientType)
                        $scope.clients[i].$checked = $scope.allClientsSelected;
                }
            } else {
                $scope.clients = $scope.clients.map(function (item) {
                    item.$checked = $scope.allClientsSelected;
                    return item
                });
            }
        }
        $scope.proceed = proceed;

        function proceed() {
            var clientIds = [];
            for (i = 0, len = $scope.clients.length; i < len; i++) {
                if ($scope.clients[i].$checked)
                    clientIds.push($scope.clients[i].Id)
            }
            $modalInstance.close();
            if ($scope.payment.PaymentFrom == null) {
                $scope.payment.PaymentFrom = new moment().subtract(1, 'year').startOf("isoweek").toDate();
            }
            $state.go('root.invoices.create', {
                data: {
                    PaymentFrom: _formatDate($scope.payment.PaymentFrom).format(),
                    PaymentTo: _formatDate($scope.payment.PaymentTo).format(),
                    clientIds: clientIds
                }
            });
        }

        function _formatDate(date) {
            var bdt = moment.tz(date, Localisation.timeZone().getTimeZone());
            return bdt;
        }
    }
}(angular))