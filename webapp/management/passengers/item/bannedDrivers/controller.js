(function (angular) {
    var module = angular.module('cab9.passengers');

    module.controller('PassengerItemBannedDriversController', PassengerItemBannedDriversController);

    PassengerItemBannedDriversController.$inject = ['$scope', '$http', '$config', '$stateParams', '$state', '$config', '$UI', '$http', 'Model', 'rData'];

    function PassengerItemBannedDriversController($scope, $http, $config, $stateParams, $state, $config, $UI, $http, Model, rData) {
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
                $scope.driverIds = $scope.passenger.BannedDrivers.map(function (item) {
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
            $scope.passenger = angular.copy(rData[0]);
            $scope.passenger.BannedDrivers = $scope.passenger.BannedDrivers.map(function (item) {
                return new Model.Driver(item)
            })
            $scope.selected = {
                Driver: null
            };
        }

        function addDriver(item) {
            $scope.passenger.BannedDrivers.push(item);
            for (i = 0, len = $scope.unlinkedDrivers.length; i < len; i++) {
                if ($scope.unlinkedDrivers[i].Id == item.Id) {
                    $scope.unlinkedDrivers.splice(i, 1);
                    break;
                }
            }
            $scope.selected.Driver = null;
        }

        function removeDriver(item) {
            for (i = 0, len = $scope.passenger.BannedDrivers.length; i < len; i++) {
                if ($scope.passenger.BannedDrivers[i].Id == item.Id) {
                    $scope.passenger.BannedDrivers.splice(i, 1);
                    break;
                }
            }
        }


        function saveChanges() {
            $http.post($config.API_ENDPOINT + "api/passenger/manage-banned-drivers?passengerId=" + $scope.passenger.Id, $scope.passenger.BannedDrivers).then(function (response) {
                swal({
                    title: "Passenger Restricted Drivers",
                    text: "Restricted Drivers has been updated.",
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
                    text: err.Message == null ? "error occured" : err.Message,
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