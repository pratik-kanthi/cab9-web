(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('FlagDownConfigurationController', FlagDownConfigurationController);

    FlagDownConfigurationController.$inject = ['$scope', 'rCompanyFlagDownConfig', 'rClients', 'Auth', '$http', 'Model', '$UI'];

    function FlagDownConfigurationController($scope, rCompanyFlagDownConfig, rClients, Auth, $http, Model, $UI) {
      
        $scope.clients = rClients;
        $scope.companyFlagdownConfig = rCompanyFlagDownConfig[0];
        $scope.clientStaffs = [];
        $scope.passengers = [];

        $scope.viewMode = 'VIEW';
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        $scope.fetchBookers = fetchBookers;
        $scope.fetchPassengers = fetchPassengers;

        if ($scope.companyFlagdownConfig == undefined)
        {
            $scope.companyFlagdownConfig = new Model.FlagDownConfiguration();
            $scope.companyFlagdownConfig.FlagDown = false;
        } else {
            fetchBookers($scope.companyFlagdownConfig.ClientId);
            fetchPassengers($scope.companyFlagdownConfig.ClientId);
        }

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.companyFlagdownConfig.$rollback(false);
            $scope.viewMode = 'VIEW';
        }

        function fetchBookers(clientId) {
            if(clientId) {
                Model.ClientStaff
                .query()
                .where("ClientId eq Guid'" + clientId + "'")
                .select("Id, Firstname, Surname")
                .parseAs(function(item) {
                    return {Id: item.Id, Name: item.Firstname + " " + item.Surname}
                })
                .execute().then(function(data) {
                    $scope.clientStaffs.length = 0;
                    [].push.apply($scope.clientStaffs, data);
                });
            }
        }

        function fetchPassengers(clientId) {
            if(clientId) {
                Model.Passenger
                .query()
                .where("ClientId eq Guid'" + clientId + "'")
                .select("Id, Firstname, Surname")
                .parseAs(function(item) {
                    return {Id: item.Id, Name: item.Firstname + " " + item.Surname}
                })
                .execute().then(function(data) {
                    $scope.passengers.length = 0;
                    [].push.apply($scope.passengers, data);
                });
            }
        }

        function saveEdits() {
            if($scope.companyFlagdownConfig.FlagDown === false) {
                $scope.companyFlagdownConfig.ClientId = null;
                $scope.companyFlagdownConfig.ClientStaffId = null;
                $scope.companyFlagdownConfig.PassengerId = null;
            }

            if ($scope.companyFlagdownConfig != undefined && $scope.companyFlagdownConfig.Id != undefined) {
                $scope.companyFlagdownConfig.$patch().success(function() {
                    $scope.viewMode = 'VIEW';
                    location.reload();
                });
            } else {
                $scope.companyFlagdownConfig.TenantId = Auth.getSession().TenantId;
                $http.post($config.API_ENDPOINT + 'api/FlagDownConfigurations', $scope.companyFlagdownConfig)
                    .success(function() {
                        $scope.viewMode = 'VIEW';
                        location.reload();
                    }).error(function(error) {
                        $scope.viewMode = 'VIEW';
                        swal("Error", "Please try again or contact admin", "error");
                    });
            }
        }

        $scope.$watch("companyFlagdownConfig.ClientId", function(newValue, oldValue) {
            if(oldValue !== newValue) {
                $scope.companyFlagdownConfig.ClientStaffId = null;
                $scope.companyFlagdownConfig.PassengerId = null;
                fetchBookers(newValue);
                fetchPassengers(newValue);
            } 
        });
    }
}(angular))