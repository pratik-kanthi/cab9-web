(function (angular) {
    var module = angular.module('cab9.clients');

    module.controller('ClientItemLocationsController', ClientItemLocationsController);

    ClientItemLocationsController.$inject = ['$scope', '$filter', '$q', 'Model', 'rData', 'rLocations', '$modal'];

    function ClientItemLocationsController($scope, $filter, $q, Model, rData, rLocations, $modal) {
        $scope.displayMode = 'VIEW';
        $scope.client = rLocations[0];
        $scope.existingLocations = rLocations[0].KnownLocations.map(function (item) {
            item.$distance = parseFloat(getDistanceFromLatLonInKm($scope.client.Latitude, $scope.client.Longitude, item.Latitude, item.Longitude).toFixed(2));
            return item;
        });
        $scope.removeLocation = removeLocation;
        $scope.addLocation = addLocation;

        function addLocation(l) {
            $modal.open({
                templateUrl: '/webapp/management/clients/item/client-item-knownlocation.modal.html',
                controller: 'ClientLocationCreateController',
                resolve: {
                    rClient: function () {
                        return $scope.client;
                    }
                }
            }).result.then(function () {
                Model.Client.query()
                    .select('KnownLocations')
                    .include('KnownLocations')
                    .filter("Id eq guid'" + $scope.client.Id + "'")
                    .execute()
                    .then(function (data) {
                        $scope.existingLocations = data[0].KnownLocations.map(function (item) {
                            item.$distance = parseFloat(getDistanceFromLatLonInKm($scope.client.Latitude, $scope.client.Longitude, item.Latitude, item.Longitude).toFixed(2));
                            return item;
                        });
                });
            });
        }

        function removeLocation(l) {
            swal({
                title: "Are you sure?",
                text: "Location will be unlinked.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm Delete!",
            }, function () {
                Model.$dissociate('Client', 'Location', $scope.client.Id, l.Id).then(function () {
                    var index = $scope.existingLocations.indexOf(l);
                    $scope.existingLocations.splice(index, 1);
                    swal({
                        title: "Location removed.",
                        text: "Changes have been updated.",
                        type: "success"
                    });
                });
            })
        }
    }

    module.controller('ClientLocationCreateController', clientLocationCreateController);
    clientLocationCreateController.$inject = ['$scope', '$modalInstance', 'Model', '$state', 'rClient'];
    function clientLocationCreateController($scope, $modalInstance, Model, $state, rClient) {
        $scope.item = new Model.KnownLocation();
        $scope.save = saveEdits;

        function saveEdits() {
            $scope.item.StopSummary = window.$utilities.formatAddress($scope.item);
            $scope.item.$save().then(function (result) {
                Model.$associate('Client', 'Location', rClient.Id, result.data.Id).then(function (response) {
                    swal('Success', 'The location saved successfully', 'success');
                    $modalInstance.close();
                }, function (err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
            }, function () {
                swal('Error', 'The location failed to save.', 'error');
            })
        }
    }

    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1); // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }
})(angular);