(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientStaffItemPassengerController', clientStaffItemPassengerController);

    clientStaffItemPassengerController.$inject = ['$scope', '$http', '$config', '$stateParams', '$rootScope', '$state', '$q', '$config', '$UI', '$http', 'Model', 'rData'];

    function clientStaffItemPassengerController($scope, $http, $config, $stateParams, $rootScope, $state, $q, $config, $UI, $http, Model, rData) {
        init();
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.addPassenger = addPassenger;
        $scope.removePassenger = removePassenger;
        $scope.saveChanges = saveChanges;

        if($rootScope.CLIENTID)
            $scope.clientId = $rootScope.CLIENTID;
        else
            $scope.clientId = $stateParams.Id;

        $scope.searchPassengers = searchPassengers;
        $scope.passengers = [];
        $scope.unlinkedPassengers = [];
        
        function searchPassengers(searchText) {
            if (!searchText)
                return;
            $scope.loadingPassengers = true;
            $http.get($config.API_ENDPOINT + "api/Passengers/Search", {
                params: {
                    searchText: searchText,
                    clientId: $scope.clientId,
                    lite: true
                }
            }).then(function(response) {
                $scope.passengers = response.data;
                $scope.passengers = $scope.passengers.map(function (item) {
                    return new Model.Passenger(item)
                });
                $scope.passengerIds = $scope.staff.Passengers.map(function (item) {
                    return item.Id
                });
                $scope.unlinkedPassengers = $scope.passengers.filter(function (item) {
                    return $scope.passengerIds.indexOf(item.Id) == -1
                });
                $scope.loadingPassengers = false;
            })
        }
                

        function init() {
            $scope.viewMode = "VIEW";
            $scope.staff = angular.copy(rData[0]);
            $scope.staff.Passengers = $scope.staff.Passengers.map(function (item) {
                return new Model.Passenger(item)
            });
            $scope.selected = {
                Passenger: null
            };
        }

        function addPassenger(item) {
            $scope.staff.Passengers.push(item);
            var found = $scope.unlinkedPassengers.filter(function (passenger) {
                return passenger.Id == item.Id
            })
            if (found[0])
                $scope.unlinkedPassengers.splice($scope.unlinkedPassengers.indexOf(found[0]), 1)
            // $scope.selected.Passenger = null;
        }

        function removePassenger(item) {
            // $scope.unlinkedPassengers.push(item);
            var found = $scope.staff.Passengers.filter(function (passenger) {
                return passenger.Id == item.Id
            })
            if (found[0])
                $scope.staff.Passengers.splice($scope.staff.Passengers.indexOf(found[0]), 1)
        }


        function saveChanges() {
            $http.post($config.API_ENDPOINT + "api/ClientStaff/ManagePassengers", $scope.staff).then(function (response) {
                swal({
                    title: "Staff Passengers Updated",
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