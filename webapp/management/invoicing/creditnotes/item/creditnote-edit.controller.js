(function() {
    var module = angular.module('cab9.invoices');

    module.controller('CreditNoteItemEditController', CreditNoteItemEditController);

    CreditNoteItemEditController.$inject = ['$scope', 'rCredit', '$filter', '$timeout', 'Localisation', '$UI', '$state', '$q', '$parse', 'Model', '$stateParams', '$modal', 'Notification', 'Auth', '$config', '$window', '$http', 'rTaxes'];

    function CreditNoteItemEditController($scope, rCredit, $filter, $timeout, Localisation, $UI, $state, $q, $parse, Model, $stateParams, $modal, Notification, Auth, $config, $window, $http, rTaxes) {
        $scope.creditNote = rCredit[0];
        $scope.taxes = rTaxes;
        $scope.creditNote.$taxRate = $scope.creditNote.Tax.TaxComponents.reduce(function (prev, current) { return prev + (current.Rate / 100); }, 0);
        $scope.creditNote.$taxAmount = ($scope.creditNote.Amount * $scope.creditNote.$taxRate);
        $scope.creditNote.$totalAmount = ($scope.creditNote.Amount + $scope.creditNote.$taxAmount);

        //Bookings in saved invoice
        $scope.displayMode = 'VIEW';
        $scope.opened = {};

        $scope.accessors = {
            LogoUrl: function(item) {
                return $scope.COMPANY ? $scope.COMPANY._ImageUrl : '';
            }
        }


        $scope.exportReceipt = exportReceipt;
        $scope.emailTo = emailTo;

        $scope.startEditing = startEditing;
        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;

        $scope.deleteInvoice = deleteInvoice;

        $scope.markPaid = markPaid;

        function startEditing() {
            $scope.displayMode = 'EDIT';
        }

        function saveEdits() {
            $scope.creditNote.$patch(true).success(function (res) {
                $scope.displayMode = 'VIEW';
                Model.CreditNote
                            .query()
                            .include('Client')
                            .where('Id', '==', "guid'" + $stateParams.Id + "'")
                            .trackingEnabled()
                            .execute().then(function (result) {
                                $scope.creditNote = result[0];
                            })
                swal({
                    title: "Credit Note Updated.",
                    text: "Credit Note has been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }).error(function (err) {
                var msg = null;
                if (err && err.Message == "INVALID REFERENCE")
                    msg = 'Reference already exists!'
                swal({
                    title: "Error Occured",
                    text: msg,
                    type: 'error'
                });
            });
        }

        function cancelEditing() {
            $scope.creditNote.$rollback(false);
            $scope.displayMode = 'VIEW';
        }

        function markPaid() {
            $scope.creditNote.Status = 'Paid';
            $scope.creditNote.$patch();
        }

        function emailTo() {
            $modal.open({
                templateUrl: '/webapp/common/modals/email-to-sent.modal.html',
                controller: ['$scope', 'emailAddress', '$modalInstance', function ($scope, emailAddress, $modalInstance) {
                    if (emailAddress != null)
                        $scope.email = emailAddress;

                    $scope.markSent = ($scope.creditNote == 'Unsent');

                    $scope.sendEmail = function () {
                        $modalInstance.close({
                            email: $scope.email,
                            markSent: $scope.markSent
                        });
                    }
                }],
                resolve: {
                    emailAddress: function () {
                        return $scope.creditNote.Client.BillingEmail || $scope.creditNote.Client.Email;
                    }
                }
            }).result.then(function (res) {
                if (res.email != null) {
                    //swal('Success', 'User will receive the email soon..', 'success');
                    $http.post($config.API_ENDPOINT + 'api/email', {
                        Type: "ClientCreditNoteConfirmation",
                        CreditId: $scope.creditNote.Id,
                        ClientId: $scope.creditNote.ClientId,
                        EmailId: res.email
                    }).success(function () {
                        Notification.success('Email Sent');
                        if (res.markSent) {
                            $scope.creditNote.Status = 'Sent';
                            $scope.creditNote.$patch();
                        }
                    })
                }
            });
        }

        function deleteInvoice() {
            swal({
                title: "Are you sure?",
                text: "This Credit Note will be deleted permanentaly",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: true
            }, function() {
                $scope.creditNote.$delete().success(function () {
                    $state.go('root.creditnotes', null, {
                        reload: true
                    });
                });
            });
        }

        function exportReceipt() {
            $window.open($config.API_ENDPOINT + "api/CreditNotes/pdf?creditId=" + $scope.creditNote.Id, '_blank');
        }
    }
}())
