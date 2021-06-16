(function (angular) {
    var module = angular.module('cab9.clients');

    module.controller('ClientItemProfilesController', ClientItemProfilesController);

    ClientItemProfilesController.$inject = ['$scope', 'rPassengers', '$stateParams', '$modal', '$http', '$config'];

    function ClientItemProfilesController($scope, rPassengers, $stateParams, $modal, $http, $config) {
        $scope.passengers = rPassengers
        $scope.toggleSearch = toggleSearch;
        $scope.toggleRow = toggleRow;
        $scope.merge = merge;

        function merge(pax, dupe) {
            swal({
                title: "Are you sure?",
                text: "This will merge all bookings to target passenger and remove duplicate passenger.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, merge!",
                closeOnConfirm: true
            }, function (response) {
                if (response)
                    $http.get($config.API_ENDPOINT + 'api/client/merge', {
                        params: {
                            targetPassengerId: pax.Id,
                            mergePassengerId: dupe.Id
                        }
                    }).then(function (response) {
                        $http.get($config.API_ENDPOINT + 'api/client/duplicates', {
                            params: {
                                passengerId: pax.Id
                            }
                        }).then(function (response) {
                            pax.dupes = response.data;
                            var target = $scope.passengers.filter(function (p) {
                                return p.Id == dupe.Id;
                            })[0];
                            if (target) {
                                pax.Bookings += target.Bookings;
                                var index = $scope.passengers.indexOf(target);
                                $scope.passengers.splice(index, 1);
                            }
                        });
                    });
            });
            
        }

        function toggleRow(pax) {
            pax.$expand = !pax.$expand

            if (pax.$expand) {
                $http.get($config.API_ENDPOINT + 'api/client/duplicates', {
                    params: {
                        passengerId: pax.Id
                    }
                }).then(function (response) {
                    pax.dupes = response.data;
                });
            } else {
                pax.dupes = null;
            }
        }

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus()
                }, 500);
            }
        }

        $scope.$watch('searchTerm.$', function (newValue, oldValue) {
            if (newValue && newValue.trim() != "") {
                $scope.passengers = rPassengers.filter(function (item) {
                    return (item._Fullname + item.Phone + item.Mobile + item.Email + item._Addresses).toLowerCase().indexOf(newValue.toLowerCase()) != -1
                });
            } else {
                $scope.passengers = angular.copy(rPassengers);

            }
        });

    }
}(angular))