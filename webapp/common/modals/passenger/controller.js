(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('PassengerItemCreateModalController', PassengerItemCreateModalController);
    module.controller('PassengerItemEditModalController', passengerItemEditModalController);

    PassengerItemCreateModalController.$inject = ['$scope', '$state', 'Model', '$UI', '$q', '$config', '$modalInstance', 'rClientId', 'rNavigateAfterSave', '$timeout', '$http'];
    passengerItemEditModalController.$inject = ['$scope', '$state', 'Model', '$UI', '$q', '$config', '$modalInstance', 'rPassenger', 'rNotes', 'rStaff', 'rUsers'];

    function PassengerItemCreateModalController($scope, $state, Model, $UI, $q, $config, $modalInstance, rClientId, rNavigateAfterSave, $timeout, $http) {
        $scope.showClients = true;
        $scope.passenger = new Model.Passenger();
        $scope.saveEdits = saveEdits;
        $scope.duplicates = [];
        $scope.useExisting = useExisting;
        $scope.searchClients = searchClients;

        function searchClients(searchText) {
            if (!searchText)
                return;
            $scope.loadingClients = true;
            $http.get($config.API_ENDPOINT + "api/Clients/Search", {
                params: {
                    searchText: searchText,
                    lite: true
                }
            }).then(function (response) {
                $scope.clients = [];
                for (var i = 0; i < response.data.length; i++) {
                    var item = response.data[i];
                    $scope.clients.push({
                        Id: item.Id,
                        Name: "(" + item.AccountNo + ") " + item.Name,
                        Description: ((item.ClientType && item.ClientType.Name) ? item.ClientType.Name : ''),
                    });
                }
                $scope.loadingClients = false;

            });
        }

        if (!rClientId) {
            $scope.clients = [];
        } else {
            $scope.showClients = false;
            $scope.passenger.ClientId = rClientId;
        }

        var debounce = null;

        $scope.$watch('passenger', function () {
            if (debounce) {
                $timeout.cancel(debounce);
                debounce = null;
            }

            $scope.duplicates = [];
            if ($scope.passenger.Firstname || $scope.passenger.Surname || $scope.passenger.Phone || $scope.passenger.Mobile || $scope.passenger.Email) {
                debounce = $timeout(function () {
                    $http.post($config.API_ENDPOINT + 'api/client/duplicates', $scope.passenger)
                        .then(function (response) {
                            $scope.duplicates = response.data;
                        });
                }, 500);
            }
        }, true);

        function useExisting(pax) {
            $modalInstance.close(pax);
        }

        function saveEdits() {
            $scope.saving = true;
            var promises = [];
            promises.push($scope.passenger.$save());

            $q.all(promises).then(function (response) {
                swal({
                    title: "Passenger Saved.",
                    text: "New Passenger has been added.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $modalInstance.close(response[0].data);
                if (rNavigateAfterSave) {
                    $state.go('root.passengers.viewer.dashboard', {
                        Id: response[0].data.Id
                    });
                }
            }, function () {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });
        }
    }

    function passengerItemEditModalController($scope, $state, Model, $UI, $q, $config, $modalInstance, rPassenger, rNotes, rStaff, rUsers) {
        $scope.passenger = rPassenger[0];
        $scope.saveEdits = saveEdits;
        $scope.showClients = false;
        $scope.edit = true;
        $scope.notes = rNotes;
        $scope.getUserName = getUserName;
        $scope.addNote = addNote;
        $scope.new = { Note: "" };

        function addNote() {
            var note = new Model.Note();
            note.OwnerType = 'Passenger';
            note.OwnerId = $scope.passenger.Id;
            note.Content = $scope.new.Note;
            note.$save().then(function (result) {
                $scope.notes.push(result.data);
                swal({
                    title: "Note Saved.",
                    text: "The note has been saved.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }, function (error) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error"
                });
            });
        }

        function saveEdits() {
            $scope.passenger.$patch().then(function (response) {
                $modalInstance.close(response.data);
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function getUserName(id) {
            var name = null;
            var user = rUsers.filter(function (u) {
                return u.Id == id;
            })[0];
            if (user) {
                return user.Name;
            }
            return name;
        }
    }
}(angular))