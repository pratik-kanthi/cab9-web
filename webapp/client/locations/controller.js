(function (angular) {
    var module = angular.module('cab9.client.locations');

    module.controller('ClientLocationsController', clientLocationsController);

    clientLocationsController.$inject = ['$scope', '$filter', '$q', '$UI', 'Model', 'rLocations'];

    function clientLocationsController($scope, $filter, $q, $UI, Model, rLocations) {
        console.log('obj');
        $scope.displayMode = 'VIEW';
        $scope.client = rLocations[0];
        $scope.existingLocations = rLocations[0].KnownLocations.map(function (item) {
            item.$distance = parseFloat(getDistanceFromLatLonInKm($scope.client.Latitude, $scope.client.Longitude, item.Latitude, item.Longitude).toFixed(2));
            return item;
        });
        $scope.removeLocation = removeLocation;

        function removeLocation(l) {
            swal({
                title: "Are you sure?",
                text: "Location will be unliked.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandPrimary,
                confirmButtonText: "Confirm Delete!",
                closeOnConfirm: false
            }, function () {
                Model.$dissociate('Client', 'Location', $scope.client.Id, l.Id).then(function () {
                    var index = $scope.existingLocations.indexOf(l);
                    $scope.existingLocations.splice(index, 1);
                    swal({
                        title: "Location removed.",
                        text: "Changes have been updated.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                });
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