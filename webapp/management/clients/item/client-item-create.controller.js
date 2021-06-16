(function (angular) {
    var module = angular.module('cab9.clients');

    module.controller('ClientItemCreateController', clientItemCreateController);

    clientItemCreateController.$inject = ['$scope', '$state', 'Model', 'rClientTypes', 'rClientTags', '$UI', '$q', 'rCurrencies', 'rStaff'];

    function clientItemCreateController($scope, $state, Model, rClientTypes, rClientTags, $UI, $q, rCurrencies, rStaff) {
        $scope.clientTypes = rClientTypes;
        $scope.client = new Model.Client();
        $scope.displayMode = "CREATE";
        $scope.clientTags = rClientTags;
        $scope.currencies = rCurrencies;
        $scope.copyToBilling = copyToBilling;
        $scope.staff = rStaff;

        $scope.client.ClientTags = [];

        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;

        function copyToBilling(type) {
            if (type == 'contact') {
                $scope.client.BillingContact = $scope.client.PrimaryContact;
                $scope.client.BillingPhone = $scope.client.Phone;
                $scope.client.BillingMobile = $scope.client.Mobile;
                $scope.client.BillingFax = $scope.client.Fax;
                $scope.client.BillingEmail = $scope.client.Email;
            } else if (type == 'address') {
                $scope.client.BillingAddress1 = $scope.client.Address1;
                $scope.client.BillingAddress2 = $scope.client.Address2;
                $scope.client.BillingArea = $scope.client.Area;
                $scope.client.BillingTownCity = $scope.client.TownCity;
                $scope.client.BillingPostcode = $scope.client.Postcode;
                $scope.client.BillingCounty = $scope.client.County;
                $scope.client.BillingCountry = $scope.client.Country;
                $scope.client.BillingLatitude = $scope.client.Latitude;
                $scope.client.BillingLongitude = $scope.client.Longitude;
            }
        }

        function saveEdits() {
            $scope.saving = true;
            var promises = [];

            angular.forEach($scope.client.ClientTags, function (add) {
                promises.push(Model.$associate("Client", "ClientTags", $scope.client.Id, add.Id));
            });

            promises.push($scope.client.$save());

            $q.all(promises).then(function (response) {
                swal({
                    title: "Client Saved.",
                    text: "New Client has been added.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $state.go('root.clients.viewer.dashboard', {
                    Id: response[0].data.Id
                });
            }, function () {
                alert('Error');
                console.log(arguments);
            });
        }

        function cancelEditing() {
            $state.go('root.clients.cards');
        }
    }
}(angular))