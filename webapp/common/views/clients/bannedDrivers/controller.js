(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientItemBannedDriversController', clientItemBannedDriversController);

    clientItemBannedDriversController.$inject = ['$scope', '$http', '$config', '$stateParams', '$rootScope', '$state', '$q', '$config', '$UI', '$http', 'Model', 'rData'];

    function clientItemBannedDriversController($scope, $http, $config, $stateParams, $rootScope, $state, $q, $config, $UI, $http, Model, rData) {
        init();
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.addDriver = addDriver;
        $scope.removeDriver = removeDriver;
        $scope.saveChanges = saveChanges;

        $scope.searchDrivers = searchDrivers;
        $scope.drivers = [];
        $scope.unlinkedDrivers = [];
        
        function searchDrivers(searchText) {
            if (!searchText)
                return;
            $scope.loadingDrivers = true;
            $http.get($config.API_ENDPOINT + "api/Drivers/Search", {
                params: {
                    searchText: searchText,
                    lite: true
                }
            }).then(function(response) {
                $scope.drivers = response.data;
                $scope.drivers = $scope.drivers.map(function (item) {
                    return new Model.Driver(item)
                })
                $scope.driverIds = $scope.client.BannedDrivers.map(function (item) {
                    return item.Id
                })
                $scope.unlinkedDrivers = $scope.drivers.filter(function (item) {
                    return $scope.driverIds.indexOf(item.Id) == -1
                });
                $scope.loadingDrivers = false;
            })
        }

        function init() {
            $scope.viewMode = "VIEW";
            $scope.client = angular.copy(rData[0]);
            $scope.client.BannedDrivers = $scope.client.BannedDrivers.map(function (item) {
                return new Model.Driver(item)
            })
            $scope.selected = {
                Driver: null
            };
        }

        function addDriver(item) {
            $scope.client.BannedDrivers.push(item);
            for (i = 0, len = $scope.unlinkedDrivers.length; i < len; i++) {
                if ($scope.unlinkedDrivers[i].Id == item.Id) {
                    $scope.unlinkedDrivers.splice(i, 1);
                    break;
                }
            }
            $scope.selected.Driver = null;
        }

        function removeDriver(item) {
            // $scope.unlinkedDrivers.push(item);
            for (i = 0, len = $scope.client.BannedDrivers.length; i < len; i++) {
                if ($scope.client.BannedDrivers[i].Id == item.Id) {
                    $scope.client.BannedDrivers.splice(i, 1);
                    break;
                }
            }
        }


        function saveChanges() {
            $http.post($config.API_ENDPOINT + "api/Client/ManageDrivers", $scope.client).then(function (response) {
                swal({
                    title: "Client Banned Drivers Updated",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $state.go($state.current, {
                    Id: $stateParams.Id
                }, {
                    reload: true
                })
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function cancelEdit() {
            init();
        }

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }
    }
}(angular))