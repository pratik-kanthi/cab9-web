(function(angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsTelephonyController', settingsTelephonyController);

    settingsTelephonyController.$inject = ['$scope', 'rIntegration', 'Model', '$http', '$config'];

    function settingsTelephonyController($scope, rIntegration, Model, $http, $config) {
        $scope.telephonyData = new Model.TelephonyIntegration(rIntegration[0]);
        $scope.telephonyData.TelephonyProvider = "Aircall";
        if ($scope.telephonyData == null) {
            $scope.telephonyData = new Model.TelephonyIntegration();
            $scope.telephonyData.TelephonyProvider = "Aircall";
        }

        $scope.saveDetails = saveDetails;
        $scope.deleteDetails = deleteDetails;
        $scope.testDetails = testDetails;
        $scope.createWebhook = createWebhook;
        $scope.staffSelectedOnExtension = staffSelectedOnExtension;

        $scope.listOfStaff = [];

        function saveDetails() {
            $scope.savingDetails = true;
            if ($scope.telephonyData.Id) {
                swal({
                    title: "Are you sure?",
                    text: "Are you sure you want to update the Integration Details?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Confirm",
                    closeOnConfirm: false
                }, function() {
                    $scope.telephonyData.$patch().success(function() {
                        $scope.savingDetails = false;
                        swal('Details Saved', 'The integration details have been saved to the database.', 'success');
                        getStaffExtensionList();
                    });
                }, function() {});
            } else {
                $scope.telephonyData.$save().success(function() {
                    $scope.savingDetails = false;
                    getStaffExtensionList();    
                    swal('Details Saved', 'The integration details have been saved to the database.', 'success');
                });
            }
        }

        function deleteDetails() {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to delete the Integration Details",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm Delete",
                closeOnConfirm: false
            }, function() {
                $scope.deletingDetails = true;
                $scope.telephonyData.$delete().success(function() {
                    $scope.deletingDetails = false;
                    $scope.telephonyData = new Model.TelephonyIntegration();
                    $scope.telephonyData.TelephonyProvider = "Aircall";
                    $scope.staffExtensions = null;
                    swal('Integration Details Deleted', "The integration details have been deleted.", 'success');
                });
            }, function() {});
        }

        function testDetails() {
            $scope.testingDetails = true;
            var authData = window.btoa($scope.telephonyData.AuthDetails1 + ':' + $scope.telephonyData.AuthDetails2);
            $http({
                method: 'GET',
                url: 'https://api.aircall.io/v1/ping',
                headers: {
                    "Authorization": 'Basic ' + authData
                }
            }).then(function successCallback(response) {
                $scope.testingDetails = false;
                swal('Connection Successful', 'The connection details were verified successfully.', 'success');
            }, function errorCallback(response) {
                swal('Connection Not Successful', response.data.error, 'error');
                $scope.testingDetails = false;
            });
        }

        function createWebhook(){
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to create the Webhook?",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm",
                closeOnConfirm: false
            }, function() {
                $scope.creatingWebhook=true;
                $http({
                    method: 'POST',
                    url: $config.API_ENDPOINT + "api/telephony/create-webhook"
                }).then(function (response) {
                    $scope.creatingWebhook=false;
                    swal('Webhook Created', 'The Webhook was created successfully.', 'success');
                }, function() {
                    swal('Webhook Creation Failed','There was an error while creating the Webhook.', 'error');
                    $scope.creatingWebhook = false;
                });
    
            }, function() {
            });

          
        }

        if($scope.telephonyData.Id != null) {
            getStaffExtensionList();    
        }

        function getStaffExtensionList() {
            $scope.fetchingStaffExtensions = true;

            $http({
                method: 'GET',
                url: $config.API_ENDPOINT + "/api/telephony/staff-extension"
            }).then(function successCallback(response) {
                Model.Staff.query().select("Id, Firstname, Surname")
                    .filter("Active eq true")
                    .execute().then(function(data) {
                    $scope.listOfStaff = data;
                    $scope.fetchingStaffExtensions = false;
                    $scope.staffExtensions = response.data;
                    $scope.staffExtensions.map(function(se) {
                        if(se.Staff) {
                            se.Staff._Fullname = se.Staff.Firstname + ' ' + se.Staff.Surname
                        }
                    })
                });
            }, function errorCallback(response) {
                $scope.fetchingStaffExtensions = false;
                swal('Error Fetching Staff Extensions', response.data.Message, 'error');
            });
        }

        function staffSelectedOnExtension(staffId, airCallUserId) {
            console.log(staffId + " is now selected on " + airCallUserId);

            $http({
                method: 'POST',
                url: $config.API_ENDPOINT + "/api/telephony/staff-extension",
                params: {
                    staffId: staffId,
                    extension: airCallUserId
                }
            }).then(function successCallback(response) {
                swal('Extension Set', 'The extension has been set for the staff.', 'success');
            }, function errorCallback(response) {
                swal('Error Fetching Staff Extensions', response.data.Message, 'error');
            });
        }


    }


}(angular));