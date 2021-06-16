(function (angular) {
    var module = angular.module('cab9.passengers');

    module.controller('PassengersCardsController', passengersCardsController);

    passengersCardsController.$inject = ['$scope', 'Model', 'rAccessors', 'rNavTo', '$rootScope', 'rData'];

    function passengersCardsController($scope, Model, rAccessors, rNavTo, $rootScope, rData) {
        $scope.accessors = rAccessors;
        $scope.filterOptions = {
            ClientId: "All"
        };
        $scope.rNavTo = rNavTo;
        $scope.chosenGroup = null;
        $scope.items = angular.copy(rData);
        $scope.filterItems = filterItems;
        $scope.$parent.displayLimit = 20;
        $scope.clients = [{
            Id: "All",
            Name: "All"
        }];
        Model.Client.query().select('Id,Name').execute().then(function (response) {
            Array.prototype.push.apply($scope.clients, response);
        }, function (err) {
            swal({
                title: "Some Error Occured.",
                text: "Some error has occured.",
                type: "error",
                confirmButtonColor: $UI.COLOURS.brandSecondary
            });
        });

        function filterItems(selectedClient) {

            $scope.items = angular.copy(rData);
            if (!$scope.searchTerm || !$scope.searchTerm.$ || $scope.searchTerm.$.trim() == "") {
                $scope.items = angular.copy(rData);
            } else {
                $scope.items = rData.filter(function (item) {
                    var searchString = $scope.searchTerm.$.toLowerCase();
                    var value = (item.Id + item.Firstname + item.Surname + item.Mobile + item.Fax + item.Email + item.Phone).toLowerCase();
                    return value.indexOf(searchString) != -1
                });
            }
            if (selectedClient.Name == "All")
                return;
            $scope.items = $scope.items.filter(function (item) {
                return item.ClientId == selectedClient.Id
            });
        }
        $scope.$watchCollection('searchTerm', function (newvalue) {
            if (!newvalue || !newvalue.$ || newvalue.$.trim() == "") {
                $scope.items = angular.copy(rData);
                if ($scope.filterOptions.ClientId && $scope.filterOptions.ClientId != "All") {
                    $scope.items = $scope.items.filter(function (item) {
                        return item.ClientId == $scope.filterOptions.ClientId
                    });
                }
                return;
            }
            $scope.items = rData.filter(function (item) {
                var searchString = newvalue.$.toLowerCase();
                var value = (item.Id + item.Firstname + item.Surname + item.Mobile + item.Fax + item.Email + item.Phone).toLowerCase();
                return value.indexOf(searchString) != -1
            });
            if ($scope.filterOptions.ClientId && $scope.filterOptions.ClientId != "All") {
                $scope.items = $scope.items.filter(function (item) {
                    return item.ClientId == $scope.filterOptions.ClientId
                });
            }
        })
    }
}(angular))