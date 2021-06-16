(function (angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsEmailTemplateController', settingsEmailTemplateController);
    module.controller('EmailTemplatePreviewController', emailTemplatePreviewController);

    settingsEmailTemplateController.$inject = ['$scope', 'rCompany', '$http', '$config', '$UI','Model','$modal'];
    function settingsEmailTemplateController($scope, rCompany, $http, $config, $UI, Model, $modal) {
        $scope.company = rCompany[0];
        $scope.bookings = [];
        $scope.selectedTemplate = null;
        $scope.data = {
            selectedOption: null
        };

        $scope.templates = [
            { Id: 1, Display: 'Account Created', Name: 'AccountCreatedConfirmation', data: null, params: 'none' },
            { Id: 3, Display: 'Client Credit Note Email', Name: 'ClientCreditNoteConfirmation', data: null, params: 'none' },
            { Id: 4, Display: 'Client Invoice Email', Name: 'ClientInvoiceConfirmation', data: null, params: 'none' },
            { Id: 6, Display: 'Driver Payment Email', Name: 'DriverPaymentConfirmation', data: null, params: 'none' },
            { Id: 7, Display: 'Booking Cancellation', Name: 'GeneralBookingCancellation', data: null, params: 'Booking' },
            { Id: 8, Display: 'Booking Confirmation', Name: 'GeneralBookingConfirmation', data: null, params: 'Booking' },
            { Id: 15, Display: 'Booking Assigned Confirmation', Name: 'GeneralBookingAssigned', data: null, params: 'Booking' },
            { Id: 9, Display: 'Passenger App Invite', Name: 'PassengerAppInvitationCreatedVerification', data: null, params: 'none' },
            { Id: 17, Display: 'Booking Payment Link', Name: 'GeneralBookingPaymentLink', data: null, params: 'Booking' },
            { Id: 11, Display: 'Card Payment Failed', Name: 'PassengerBookingPaymentFailed', data: null, params: 'Booking' },
            { Id: 12, Display: 'Card Payment Receipt', Name: 'PassengerBookingPaymentReceipt', data: null, params: 'Booking' },
            { Id: 13, Display: 'Card Pre-Auth Failed', Name: 'PassengerBookingPreauthFailed', data: null, params: 'Booking' },
            { Id: 14, Display: 'Password Reset Email', Name: 'ResetPassword', data: null, params: 'none' },
            { Id: 16, Display: 'Passenger Verification', Name: 'PassengerCreatedVerification', data: null, params: 'none' }
        ];

        $scope.selectTemplate = selectTemplate;
        $scope.reset = reset;
        $scope.fetchTemplate = fetchTemplate;
        $scope.saveEdits = saveEdits;
        $scope.preview = preview;
        $scope.upload = upload;

        $http.get($config.API_ENDPOINT + 'api/bookings', {
                params: {
                    $select: 'Id,LocalId',
                    $top: 10,
                    $orderby: 'BookedDateTime desc'
                }
            })
            .success(function (data) {
                [].push.apply($scope.bookings, data.map(function (b) {
                    return new Model.Booking(b);
                }));
            });

        selectTemplate($scope.templates[0]);

        function selectTemplate(t) {
            $scope.selectedTemplate = t;
            fetchTemplate(t);
        }

        function reset() {
            fetchTemplate($scope.selectedTemplate);
        }

        function fetchTemplate(t) {
            $http.get($config.API_ENDPOINT + 'api/Email/GetTemplate?template=' + t.Name, {})
            .success(function (data) {
                $scope.selectedTemplate.data = data;
            });
        }

        function saveEdits() {
            $http.post($config.API_ENDPOINT + 'api/Email/SaveTemplate', {
                Template: $scope.selectedTemplate.Name,
                Content: $scope.selectedTemplate.data,
            }).success(function (res) {
                swal({
                    title: "Template Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }).error(function () {
                alert('Error');
            });
        }

        function preview() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/settings/email/email-preview-modal.partial.html',
                controller: 'EmailTemplatePreviewController',
                size:'lg',
                resolve: {
                    BookingId: function () {
                        return $scope.data.selectedOption ? $scope.data.selectedOption.Id : null;
                    },
                    SelectedTemplate: function () {
                        return $scope.selectedTemplate;
                    }
                }
            });

            modalInstance.result.then(function (result) { });
        }

        function upload() {
            $http.post($config.API_ENDPOINT + 'api/Email/UploadTemplate', {
                template: $scope.selectedTemplate.Name
            }).success(function (res) {
                swal({
                    title: "Template Uploaded.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }).error(function (msg) {
                if (msg.Message)
                    swal({
                        title: "Save the Template",
                        text: "Save the template before upload.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                else
                    alert('Error');
            });
        }

        $scope.$on("$destroy", function () {
            clearTemplates();
        });

        function clearTemplates() {
            $http.get($config.API_ENDPOINT + "api/Email/ClearTemplates", {})
            .success(function (res) {
            }).error(function () {
                alert('Error');
            })
        }
    }


    emailTemplatePreviewController.$inject = ['$scope', 'SelectedTemplate', 'BookingId','Auth', '$sce','$config'];
    function emailTemplatePreviewController($scope, SelectedTemplate, BookingId, Auth, $sce, $config) {
        $scope.getTemplate = getTemplate;
        $scope.template = SelectedTemplate;

        function getTemplate() {
            return $sce.trustAsResourceUrl($config.API_ENDPOINT + "/api/email/GetTemplateHtml?template=" + SelectedTemplate.Name + "&bookingId=" + BookingId + "&token=" + Auth.getSession().access_token);
        }
    }
}(angular));